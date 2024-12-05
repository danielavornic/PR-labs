import amqp from "amqplib";
import axios from "axios";
import * as ftp from "basic-ftp";
import FormData from "form-data";
import fs from "fs/promises";
import path from "path";
import express from "express";
import { config } from "./config";

class IntermediaryServer {
  private lastProcessedData: any[] = [];
  private ftpCheckCount = 0;
  private ftpLock = false;
  private activeClients: Set<ftp.Client> = new Set();
  private currentLeader: string | null = null;
  private leaderPort: string | null = null;
  private app: express.Express;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupExpressRoutes();

    process.on("SIGINT", async () => {
      await this.cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupExpressRoutes() {
    this.app.post("/update-leader", (req, res) => {
      console.log("Leader update:", req.body);
      const { leaderId, apiPort } = req.body;
      this.currentLeader = leaderId;
      this.leaderPort = apiPort;
      console.log(`New leader elected: Server ${leaderId} on port ${apiPort}`);
      res.json({ success: true });
    });

    this.app.listen(config.apiServer.port, "0.0.0.0", () => {
      console.log(
        `Leader update endpoint running on port ${config.apiServer.port}`
      );
    });
  }

  async start() {
    setTimeout(async () => {
      console.log("Starting consumer");
      await this.startConsumer();
    }, 30000); // Wait for RabbitMQ to start

    console.log("Starting FTP checker");
    this.startFtpChecker();
  }

  async createFtpClient() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      port: config.ftp.port,
    });
    this.activeClients.add(client);
    return client;
  }

  private async sendToApiServer(data: any, endpoint: string) {
    let retries = 3;
    while (retries > 0) {
      try {
        if (!this.currentLeader) {
          console.warn("No leader available, waiting for election...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries--;
          continue;
        }

        const url = `http://api-server-${this.currentLeader}:${this.leaderPort}${endpoint}`;
        return await axios.post(url, data);
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error(`Failed to send to leader:`, error);
          throw error;
        }
        console.log(`Retrying request. ${retries} attempts left`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  async waitForRabbitMQ() {
    const maxRetries = 10;
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const connection = await amqp.connect(config.rabbitmq.url);
        const channel = await connection.createChannel();
        await channel.assertQueue(config.rabbitmq.queue, { durable: true });
        return channel;
      } catch (error) {
        retries++;
        const backoffTime = Math.pow(2, retries) * 1000; // Exponential
        console.error(
          `Failed to connect to RabbitMQ, retrying in ${
            backoffTime / 1000
          } seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
    throw new Error("RabbitMQ is not ready after several retries.");
  }

  private async startConsumer() {
    try {
      // allow RabbitMQ to fully initialize
      const channel = await this.waitForRabbitMQ();

      if (!channel) {
        throw new Error("RabbitMQ channel not available");
      }

      channel.consume(config.rabbitmq.queue, async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log("Received data:", data);

            this.lastProcessedData.push(data);

            await this.sendToApiServer(
              {
                name: data.name,
                price: data.price,
                color: data.color,
              },
              "/api/products"
            );

            console.log("Sent to Lab 2 server:", data.name);

            await this.updateFtpFile();

            channel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
            channel.nack(msg);
          }
        }
      });
    } catch (error) {
      console.error("RabbitMQ error:", error);
      setTimeout(() => this.startConsumer(), 20000);
    }
  }

  private async updateFtpFile() {
    while (this.ftpLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.ftpLock = true;
    let client = null;

    try {
      // for simplicity, write the file to disk before uploading
      const filePath = path.join(__dirname, `temp_data_${Date.now()}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(this.lastProcessedData, null, 2)
      );

      client = await this.createFtpClient();
      await client.uploadFrom(filePath, "processed_data.json");
      console.log("File uploaded to FTP");

      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error updating FTP file:", error);
    } finally {
      await this.closeFtpClient(client);
      this.ftpLock = false;
    }
  }

  private async sendFileToApiServer(fileContent: Buffer) {
    try {
      const formData = new FormData();
      formData.append("file", fileContent, {
        filename: "processed_data.json",
        contentType: "application/json",
      });

      await this.sendToApiServer(formData, "/api/upload/file");
      console.log("File sent to leader server");
    } catch (error) {
      console.error("Error sending file to leader:", error);
    }
  }

  private startFtpChecker() {
    setInterval(async () => {
      if (this.ftpLock) {
        console.log("Skipping FTP check");
        return;
      }

      this.ftpLock = true;
      let client = null;

      try {
        this.ftpCheckCount++;
        console.log(`\nFTP Check #${this.ftpCheckCount} starting...`);

        client = await this.createFtpClient();

        try {
          const tempFile = path.join(
            __dirname,
            `temp_download_${Date.now()}.json`
          );
          await client.downloadTo(tempFile, "processed_data.json");
          const fileContent = await fs.readFile(tempFile);
          await fs.unlink(tempFile);

          if (fileContent) {
            await this.sendFileToApiServer(fileContent);
          }
        } catch (error: any) {
          if (error?.message?.includes("No such file")) {
            console.log(
              "processed_data.json doesn't exist yet - waiting for first data..."
            );
          } else {
            throw error; // rethrow if it's a different error
          }
        }
      } catch (error) {
        console.error("Error in FTP check:", error);
      } finally {
        await this.closeFtpClient(client);
        this.ftpLock = false;
      }
    }, 30000);
  }

  private async cleanup() {
    const closePromises = Array.from(this.activeClients).map((client) => {
      return client.close();
    });
    await Promise.all(closePromises);
    console.log("All FTP connections closed");
  }

  private async closeFtpClient(client: ftp.Client | null) {
    if (client) {
      await client.close();
      this.activeClients.delete(client);
    }
  }
}

const server = new IntermediaryServer();
server.start().catch(console.error);

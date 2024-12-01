import amqp from "amqplib";
import axios from "axios";
import * as ftp from "basic-ftp";
import FormData from "form-data";
import fs from "fs/promises";
import path from "path";
import { config } from "./config";

class IntermediaryServer {
  private lastProcessedData: any[] = [];
  private ftpCheckCount = 0;
  private ftpLock = false;
  // keep track of active clients such that we can close them on shutdown
  private activeClients: Set<ftp.Client> = new Set();

  constructor() {
    // on ctrl+c
    process.on("SIGINT", async () => {
      console.log("\nShutdown initiated...");
      await this.cleanup();
      process.exit(0);
    });

    // on docker stop
    process.on("SIGTERM", async () => {
      console.log("\nShutdown initiated...");
      await this.cleanup();
      process.exit(0);
    });
  }

  async createFtpClient() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
    });
    this.activeClients.add(client);
    return client;
  }

  async start() {
    await this.startConsumer();
    this.startFtpChecker();
  }

  private async startConsumer() {
    try {
      const connection = await amqp.connect(config.rabbitmq.url);
      const channel = await connection.createChannel();
      await channel.assertQueue(config.rabbitmq.queue, { durable: true });

      console.log("Consumer is running...");

      channel.consume(config.rabbitmq.queue, async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log("Received data:", data);

            this.lastProcessedData.push(data);

            await axios.post(`${config.lab2.apiUrl}/api/products`, {
              name: data.name,
              price: data.price,
              color: data.color,
            });
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
      console.error("RabbitMQ connection error:", error);
      setTimeout(() => this.startConsumer(), 5000);
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
        const tempFile = path.join(
          __dirname,
          `temp_download_${Date.now()}.json`
        );

        await client.downloadTo(tempFile, "processed_data.json");
        const fileContent = await fs.readFile(tempFile);
        await fs.unlink(tempFile);

        if (fileContent) {
          await this.sendFileToLab2(fileContent);
        }
      } catch (error) {
        console.error("Error in FTP check:", error);
      } finally {
        await this.closeFtpClient(client);
        this.ftpLock = false;
      }
    }, 30000);
  }

  private async sendFileToLab2(fileContent: Buffer) {
    try {
      const formData = new FormData();
      formData.append("file", fileContent, {
        filename: "processed_data.json",
        contentType: "application/json",
      });

      await axios.post(`${config.lab2.apiUrl}/api/upload/file`, formData, {
        headers: formData.getHeaders(),
      });
      console.log("File sent to Lab 2 server");
    } catch (error) {
      console.error("Error sending file to Lab 2:", error);
    }
  }

  private async cleanup() {
    console.log("Closing all FTP connections...");
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

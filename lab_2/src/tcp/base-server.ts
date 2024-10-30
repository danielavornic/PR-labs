import { createServer, Socket } from "net";
import * as path from "path";
import { Worker } from "worker_threads";

export interface Command {
  type: "read" | "write";
  content?: {
    author: string;
    message: string;
    timestamp?: string;
  };
}

export abstract class BaseTCPServer {
  constructor(protected port: number, protected dataFile: string) {
    const server = createServer((socket: Socket) => {
      this.handleConnection(socket);
    });

    server.listen(port, () => {
      console.log(`${this.getServerName()} listening on port ${port}`);
    });
  }

  protected abstract getServerName(): string;
  protected abstract processCommand(command: Command, socket: Socket): void;

  protected handleConnection(socket: Socket) {
    console.log("Client connected");

    socket.on("data", (data) => {
      try {
        const command: Command = JSON.parse(data.toString());
        this.processCommand(command, socket);
      } catch (error) {
        socket.write(
          JSON.stringify({
            error: "Invalid command format",
            expected: {
              type: "read | write",
              content:
                "For write operations: { author: string, message: string }",
            },
          })
        );
      }
    });

    socket.on("close", () => {
      console.log("Client disconnected");
    });
  }

  protected createWorker(command: Command, socket: Socket) {
    const worker = new Worker(path.join(__dirname, "./worker.js"), {
      workerData: {
        command,
        dataFile: this.dataFile,
      },
    });

    worker.on("message", (result) => {
      socket.write(JSON.stringify(result));
      worker.terminate();
    });

    worker.on("error", (error) => {
      socket.write(JSON.stringify({ error: error.message }));
      worker.terminate();
    });

    return worker;
  }
}

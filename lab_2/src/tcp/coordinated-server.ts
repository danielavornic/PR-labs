import { Mutex } from "async-mutex";
import { Socket } from "net";
import * as path from "path";
import { BaseTCPServer, Command } from "./base-server";

export class CoordinatedTCPServer extends BaseTCPServer {
  private mutex = new Mutex(); // Prevents concurrent file access
  private writeLock = new Mutex(); // Protects the activeWrites counter and readQueue
  private activeWrites = 0;
  private readQueue: (() => void)[] = [];

  constructor(port: number) {
    super(port, path.join(__dirname, "../../data/messages.json"));
  }

  protected getServerName(): string {
    return "Coordinated TCP Server";
  }

  protected async processCommand(command: Command, socket: Socket) {
    if (command.type === "write") {
      await this.handleWrite(command, socket);
    } else {
      await this.handleRead(socket);
    }
  }

  private async handleWrite(command: Command, socket: Socket) {
    await this.writeLock.acquire();
    this.activeWrites++;
    console.log(
      `Starting write operation. Active writes: ${this.activeWrites}`
    );
    this.writeLock.release();

    const worker = this.createWorker(command, socket);
    const sleepTime = Math.floor(Math.random() * 6000 + 1000);
    console.log(`Processing write with ${sleepTime}ms delay`);

    try {
      const release = await this.mutex.acquire();
      setTimeout(async () => {
        try {
          worker.postMessage("execute");
        } finally {
          release();
          await this.writeLock.acquire();
          this.activeWrites--;
          console.log(
            `Completed write operation. Remaining writes: ${this.activeWrites}`
          );

          if (this.activeWrites === 0 && this.readQueue.length > 0) {
            this.readQueue.forEach((resolve) => resolve());
            this.readQueue = [];
          }
          this.writeLock.release();
        }
      }, sleepTime);
    } catch (error) {
      console.error("Error in write operation:", error);
      socket.write(JSON.stringify({ error: "Write operation failed" }));
    }
  }

  private async handleRead(socket: Socket) {
    await this.writeLock.acquire();

    if (this.activeWrites > 0) {
      console.log(
        `Read waiting for ${this.activeWrites} write operations to complete`
      );
      const waitPromise = new Promise<void>((resolve) => {
        this.readQueue.push(resolve);
      });
      this.writeLock.release();
      await waitPromise;
    } else {
      this.writeLock.release();
    }

    const worker = this.createWorker({ type: "read" }, socket);
    const sleepTime = Math.floor(Math.random() * 6000 + 1000);

    const release = await this.mutex.acquire();
    setTimeout(() => {
      try {
        worker.postMessage("execute");
      } finally {
        release();
      }
    }, sleepTime);
  }
}

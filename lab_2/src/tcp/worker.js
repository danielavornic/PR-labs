const { workerData, parentPort } = require("worker_threads");
const fs = require("fs").promises;
const path = require("path");

const { command, dataFile } = workerData;

async function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function executeCommand() {
  await ensureDirectoryExists(dataFile);

  try {
    if (command.type === "write") {
      let messages = [];
      try {
        const content = await fs.readFile(dataFile, "utf8");
        messages = JSON.parse(content);
      } catch (error) {}

      const newMessage = {
        ...command.content,
        timestamp: new Date().toISOString(),
        threadId: process.threadId,
      };

      messages.push(newMessage);
      await fs.writeFile(dataFile, JSON.stringify(messages, null, 2));

      parentPort?.postMessage({
        success: true,
        message: "Message saved",
        data: messages,
      });
    } else {
      try {
        const content = await fs.readFile(dataFile, "utf8");
        const messages = JSON.parse(content);
        parentPort?.postMessage({
          success: true,
          data: messages,
        });
      } catch (error) {
        parentPort?.postMessage({
          success: true,
          data: [],
        });
      }
    }
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      error: error.message,
    });
  }
}

parentPort?.on("message", (message) => {
  if (message === "execute") {
    executeCommand();
  }
});

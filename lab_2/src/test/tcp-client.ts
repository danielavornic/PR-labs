import * as net from "net";

function createClient(name: string, port: number) {
  const client = new net.Socket();
  const writtenMessages: string[] = [];
  let writeStartTime: number;

  client.connect(port, "localhost", () => {
    console.log(`\n${name} connected to port ${port}`);
    writeStartTime = Date.now();

    if (name === "Andi") {
      const messages = [
        "First message from Andi",
        "Second message from Andi",
        "Third message from Andi",
      ];

      messages.forEach((msg, index) => {
        setTimeout(() => {
          const command = {
            type: "write",
            content: {
              author: name,
              message: msg,
            },
          };
          client.write(JSON.stringify(command));
          writtenMessages.push(msg);
          console.log(
            `[${Date.now() - writeStartTime}ms] ${name} sent: ${msg}`
          );
        }, index * 2000);
      });

      // Andi reads after her writes
      setTimeout(() => {
        console.log(
          `\n[${Date.now() - writeStartTime}ms] ${name} reading messages...`
        );
        client.write(JSON.stringify({ type: "read" }));
      }, messages.length * 2000 + 2000);
    } else {
      // Dana tries to read while Andi is writing
      setTimeout(() => {
        console.log(
          `\n[${
            Date.now() - writeStartTime
          }ms] ${name} attempting to read during writes...`
        );
        client.write(JSON.stringify({ type: "read" }));
      }, 3000);

      setTimeout(() => {
        const messages = [
          "First message from Dana",
          "Second message from Dana",
          "Third message from Dana",
        ];

        messages.forEach((msg, index) => {
          setTimeout(() => {
            const command = {
              type: "write",
              content: {
                author: name,
                message: msg,
              },
            };
            client.write(JSON.stringify(command));
            writtenMessages.push(msg);
            console.log(
              `[${Date.now() - writeStartTime}ms] ${name} sent: ${msg}`
            );
          }, index * 2000);
        });
      }, 6000);
    }
  });

  client.on("data", (data) => {
    try {
      const response = JSON.parse(data.toString());
      const timeSinceStart = Date.now() - writeStartTime;

      if (response.data && Array.isArray(response.data)) {
        console.log(`\n[${timeSinceStart}ms] ${name} received read response:`);
        console.log(`Stored messages (${response.data.length}):`);
        response.data.forEach((msg: any, idx: number) => {
          console.log(`${idx + 1}. [${msg.author}]: ${msg.message}`);
        });
      } else {
        console.log(
          `\n[${timeSinceStart}ms] ${name} received write confirmation:`,
          response.message
        );
      }
    } catch (error) {
      console.error("Error parsing response:", error);
    }
  });

  return client;
}

const PORT = 3003;
const client1 = createClient("Andi", PORT);
const client2 = createClient("Dana", PORT);

setTimeout(() => {
  console.log("\nClosing connections...");
  client1.destroy();
  client2.destroy();
}, 20000);

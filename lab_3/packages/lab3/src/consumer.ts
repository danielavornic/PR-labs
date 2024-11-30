import amqp from "amqplib";
import axios from "axios";

import { config } from "./config";

async function startConsumer() {
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

          await axios.post(`${config.lab2.apiUrl}/api/products`, {
            name: data.name,
            price: data.price,
            color: data.color,
          });

          console.log("Sent to Lab 2 server:", data.name);
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    console.error("Connection error:", error);

    // Retry connection after delay
    setTimeout(startConsumer, 5000);
  }
}

// Program termination on SIGINT
process.on("SIGINT", () => {
  process.exit(0);
});

startConsumer().catch(console.error);

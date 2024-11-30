import amqp from "amqplib";
import WebScraper from "./scraper/web-scraper";
import { processProducts } from "./processors/data-processor";

import { config } from "./config";

const main = async () => {
  try {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(config.rabbitmq.queue, { durable: true });

    console.log("Scraping products...");

    const webScraper = new WebScraper(config.scraper.url);
    const products = await webScraper.scrape();
    const processedData = processProducts(
      products,
      config.scraper.minPrice,
      config.scraper.maxPrice
    );

    let sentCount = 0;
    for (const product of processedData.products) {
      channel.sendToQueue(
        config.rabbitmq.queue,
        Buffer.from(JSON.stringify(product))
      );
      sentCount++;
      console.log(
        `Sent product ${sentCount}/${processedData.products.length}: ${product.name}`
      );
    }

    console.log("All products sent!");

    // After a short delay to ensure all messages are sent
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

main();

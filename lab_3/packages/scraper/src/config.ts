import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  rabbitmq: {
    url: `amqp://${process.env.RABBITMQ_USER || "user"}:${
      process.env.RABBITMQ_PASSWORD || "password"
    }@${"localhost"}:${process.env.RABBITMQ_PORT || "5672"}`,
    queue: process.env.QUEUE_NAME || "scraped_products",
  },
  scraper: {
    url: process.env.SCRAPER_URL || "https://darwin.md/laptopuri",
    minPrice: Number(process.env.MIN_PRICE) || 400,
    maxPrice: Number(process.env.MAX_PRICE) || 10000,
  },
};

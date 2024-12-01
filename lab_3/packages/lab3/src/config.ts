import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  rabbitmq: {
    url: `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
    queue: process.env.QUEUE_NAME || "scraped_products",
  },
  lab2: {
    apiUrl: process.env.LAB2_API_URL || "http://localhost:3000",
  },
  ftp: {
    host: process.env.FTP_HOST || "localhost",
    user: process.env.FTP_USER || "user",
    password: process.env.FTP_PASSWORD || "password",
  },
};

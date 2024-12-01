import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "password",
    database: process.env.DB_NAME ?? "pr_lab2",
    port: parseInt(process.env.DB_PORT ?? "5432"),
    ssl: false,
  },
} satisfies Config;

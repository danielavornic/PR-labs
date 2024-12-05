import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});

const db = drizzle(pool);

async function checkIfMigrationsNeeded() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'migrations'
      );
    `);
    return !result.rows[0].exists;
  } catch (error) {
    return true; // assume migrations are needed
  }
}

async function waitForDb() {
  while (true) {
    try {
      await pool.query("SELECT 1");
      console.log("Database connected");
      break;
    } catch (err) {
      console.log("Waiting for database...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function init() {
  try {
    await waitForDb();

    // run migrations if we're server 1
    if (process.env.SERVER_ID === "1") {
      const needsMigrations = await checkIfMigrationsNeeded();
      if (needsMigrations) {
        console.log("Running migrations...");
        await migrate(db, { migrationsFolder: "drizzle" });
        console.log("Migrations completed");
      } else {
        console.log("Migrations already applied");
      }
    } else {
      console.log(`Server ${process.env.SERVER_ID} skipping migrations`);
    }
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();

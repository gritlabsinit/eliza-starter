import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

export function initializeDatabase(dataDir: string) {
  if (process.env.POSTGRES_URL) {
    console.log("Using Postgres database");
    console.log("POSTGRES_URL:", process.env.POSTGRES_URL);
    const db = new PostgresDatabaseAdapter({
      connectionString: process.env.POSTGRES_URL,
    });
    return db;
  } else {
    const filePath =
      process.env.SQLITE_FILE ?? path.resolve(dataDir, "db.sqlite");
    console.log("SQLite file path:", filePath);
    const db = new SqliteDatabaseAdapter(new Database(filePath));
    return db;
  }
}

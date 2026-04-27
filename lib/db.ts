import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.PERF_USERS_DB || path.join(process.cwd(), "users.db");

function createDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

const globalForDb = globalThis as unknown as { __db?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__db) {
    globalForDb.__db = createDb();
  }
  return globalForDb.__db;
}

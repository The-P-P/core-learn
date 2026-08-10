import Database from "@tauri-apps/plugin-sql";

const DB_PATH = "sqlite:core_learn.db";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_PATH);
  }
  return dbPromise;
}

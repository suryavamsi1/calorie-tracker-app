import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/calorie-tracker.db";
const isInMemory = DATABASE_PATH === ":memory:";

const resolvedPath = isInMemory ? DATABASE_PATH : path.resolve(process.cwd(), DATABASE_PATH);
if (!isInMemory) {
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
}

export const db = new Database(resolvedPath);
if (!isInMemory) {
  db.pragma("journal_mode = WAL");
}
db.pragma("foreign_keys = ON");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      age INTEGER,
      sex TEXT,
      height_cm REAL,
      weight_kg REAL,
      activity_level TEXT,
      goal_type TEXT,
      target_weight_kg REAL,
      daily_calorie_goal INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      serving_size REAL NOT NULL,
      serving_unit TEXT NOT NULL,
      calories INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'curated',
      created_by_user_id TEXT REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
      custom_food_name TEXT,
      custom_calories INTEGER,
      quantity REAL NOT NULL DEFAULT 1,
      meal_type TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date
      ON meal_entries(user_id, entry_date);

    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

    CREATE TABLE IF NOT EXISTS favorite_foods (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, food_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      properties TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
  `);
}

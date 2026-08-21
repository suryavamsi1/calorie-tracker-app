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
      daily_protein_goal REAL,
      daily_carbs_goal REAL,
      daily_fat_goal REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      serving_size REAL NOT NULL,
      serving_unit TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g REAL NOT NULL DEFAULT 0,
      carbs_g REAL NOT NULL DEFAULT 0,
      fat_g REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'curated',
      provider TEXT,
      external_id TEXT,
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

    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weight_kg REAL NOT NULL,
      logged_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, logged_date)
    );

    CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
      ON weight_logs(user_id, logged_date);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      used_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
      ON password_reset_tokens(token_hash);

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      used_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash
      ON email_verification_tokens(token_hash);
  `);

  migrateAddMacroColumns();

  // Must run AFTER the migration above - on a pre-existing database the
  // foods table won't have provider/external_id yet until addColumnIfMissing
  // adds them, and this index references those columns.
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_provider_external
     ON foods(provider, external_id) WHERE provider IS NOT NULL;`
  );
}

// Lightweight migration for databases created before macro tracking was added:
// CREATE TABLE IF NOT EXISTS is a no-op on existing tables, so pre-existing
// `foods`/`users` tables need their new columns added explicitly.
function migrateAddMacroColumns() {
  addColumnIfMissing("foods", "protein_g", "REAL NOT NULL DEFAULT 0");
  addColumnIfMissing("foods", "carbs_g", "REAL NOT NULL DEFAULT 0");
  addColumnIfMissing("foods", "fat_g", "REAL NOT NULL DEFAULT 0");
  addColumnIfMissing("foods", "provider", "TEXT");
  addColumnIfMissing("foods", "external_id", "TEXT");
  addColumnIfMissing("users", "daily_protein_goal", "REAL");
  addColumnIfMissing("users", "daily_carbs_goal", "REAL");
  addColumnIfMissing("users", "daily_fat_goal", "REAL");
  addColumnIfMissing("users", "email_verified_at", "TEXT");
}

function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

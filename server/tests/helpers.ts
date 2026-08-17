import { createApp } from "../src/app";
import { initDb } from "../src/db";
import { seedFoods } from "../src/seed";

/**
 * Builds a fresh app instance backed by an isolated in-memory SQLite database
 * (DATABASE_PATH=":memory:" is set for the whole test run via vitest.config.ts,
 * and each test file gets its own module registry, so each file gets its own
 * independent in-memory database - no need to reset state between test files).
 */
export function createTestApp() {
  initDb();
  seedFoods();
  return createApp();
}

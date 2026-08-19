import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(1).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("30d"),
  DATABASE_PATH: z.string().default("./data/calorie-tracker.db"),
  // Optional: external food search provider (Edamam Food Database API).
  // When unset, /foods/search gracefully falls back to local-only results.
  EDAMAM_APP_ID: z.string().optional(),
  EDAMAM_APP_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET === "dev-secret-change-me") {
  console.error("Refusing to start: JWT_SECRET must be set to a real secret in production.");
  process.exit(1);
}

export const env = parsed.data;

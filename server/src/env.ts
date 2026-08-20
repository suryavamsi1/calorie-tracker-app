import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(1).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("30d"),
  DATABASE_PATH: z.string().default("./data/calorie-tracker.db"),
  // Which external food-search provider /foods/search uses. USDA works with
  // zero setup (falls back to the public DEMO_KEY), so it's the default.
  FOOD_PROVIDER: z.enum(["usda", "edamam"]).default("usda"),
  // Optional: free (fdc.nal.usda.gov/api-key-signup) - without this, USDA
  // search still works via the shared DEMO_KEY, just at a much lower rate
  // limit (30 req/hour vs 1000 req/hour with your own key).
  USDA_API_KEY: z.string().optional(),
  // Optional: paid provider, only used when FOOD_PROVIDER=edamam. When
  // unset, /foods/search gracefully falls back to local-only results.
  EDAMAM_APP_ID: z.string().optional(),
  EDAMAM_APP_KEY: z.string().optional(),
  // Optional: Resend API key (resend.com) for sending password-reset
  // emails. Without it, /forgot-password still works end-to-end for local
  // dev/testing - the reset code is logged to the server console instead
  // of emailed.
  RESEND_API_KEY: z.string().optional(),
  // Resend's built-in test sender - works with zero domain verification,
  // but can only deliver to the email you signed up to Resend with. Verify
  // a real domain in Resend and set this to an address on it to send to
  // arbitrary recipients (e.g. real users).
  RESEND_FROM_EMAIL: z.string().email().default("onboarding@resend.dev"),
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

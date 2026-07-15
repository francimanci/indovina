import "dotenv/config";
import { z } from "zod";

/**
 * Validate environment once at startup. Fail loudly on misconfiguration.
 * Later phases add ANTHROPIC_API_KEY, STRIPE_* — kept optional for now so the
 * app boots through Phase 1/2 without them.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (see .env.example)"),
  SESSION_SECRET: z.string().min(1).default("dev-insecure-session-secret"),

  // Later phases (optional until then)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_CODICE_FISCALE: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV !== "production";

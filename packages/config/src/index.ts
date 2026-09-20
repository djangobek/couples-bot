import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, "../../../.env");

dotenv.config({
  path: rootEnvPath,
});

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BOT_TOKEN: z.string().min(1),
  BOT_USERNAME: z.string().regex(/^[A-Za-z0-9_]{3,64}$/).default(""),
  WEB_APP_URL: z.string().url(),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_URL: z.string().url().default("http://localhost:3001"),

  ADMIN_TELEGRAM_IDS: z.string().default(""),

  TELEGRAM_WEBHOOK_SECRET: z.string().default(""),
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(86400),

  /* ============ NEW ============ */
  REQUIRED_CHANNELS: z.string().default(""),
  SUBSCRIPTION_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(300),

  DEFAULT_LANGUAGE: z.enum(["uz", "ru", "en"]).default("uz"),

  BROADCAST_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  BROADCAST_BATCH_DELAY_MS: z.coerce.number().int().positive().default(1000),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues
    .map((issue) => issue.path.join(".") || "environment")
    .join(", ");

  throw new Error(`Invalid environment configuration: ${fields}`);
}

const values = parsed.data;

export const env = {
  ...values,

  ADMIN_TELEGRAM_IDS: new Set(
    values.ADMIN_TELEGRAM_IDS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ),

  isProduction: values.NODE_ENV === "production",
} as const;
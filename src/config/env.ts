import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  AZURE_FORM_RECOGNIZER_ENDPOINT: z.string().url().optional(),
  AZURE_FORM_RECOGNIZER_KEY: z.string().optional(),
  AZURE_BLOB_CONNECTION_STRING: z.string().optional(),
  AZURE_BLOB_CONTAINER_NAME: z.string().default("invoice-training"),
  OCR_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.8),
  AMOUNT_TOLERANCE: z.coerce.number().default(0.05),
  AUTO_APPROVE_GL_ACCOUNTS: z.string().default(""),
  LOG_LEVEL: z.string().default("info")
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  AUTO_APPROVE_GL_ACCOUNTS_LIST: parsed.AUTO_APPROVE_GL_ACCOUNTS
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
};

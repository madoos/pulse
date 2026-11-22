import { z } from 'zod';

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGIN: z.url().optional(),
    // Error monitoring: without a DSN, errors are only logged.
    SENTRY_DSN: z.url().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_RELEASE: z.string().optional(),
    // Support assistant (ADR-0023): without a key it reports itself as unavailable.
    // Empty counts as not set, as docker compose passes it when .env does not have it.
    OPEN_ROUTER_API_KEY: z
      .string()
      .optional()
      .transform((key) => key || undefined),
    ASSISTANT_MODEL: z.string().min(1).default('openrouter/free'),
    // Where the embedding model is; the image ships it, so it is never downloaded at runtime.
    EMBEDDING_MODELS_DIR: z.string().min(1).optional(),
  })
  .refine((config) => config.NODE_ENV !== 'development' || config.CORS_ORIGIN, {
    message: 'CORS_ORIGIN is required in development',
    path: ['CORS_ORIGIN'],
  });

export type Config = z.infer<typeof ConfigSchema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => ConfigSchema.parse(env);

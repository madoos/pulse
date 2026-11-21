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
  })
  .refine((config) => config.NODE_ENV !== 'development' || config.CORS_ORIGIN, {
    message: 'CORS_ORIGIN is required in development',
    path: ['CORS_ORIGIN'],
  });

export type Config = z.infer<typeof ConfigSchema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => ConfigSchema.parse(env);

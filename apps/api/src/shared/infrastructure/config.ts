import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Config = z.infer<typeof ConfigSchema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => ConfigSchema.parse(env);

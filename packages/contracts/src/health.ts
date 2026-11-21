import { z } from 'zod';

export const HealthSchema = z
  .object({
    status: z.enum(['ok', 'down']),
  })
  .meta({ id: 'Health', description: 'Service health status' });

export type Health = z.infer<typeof HealthSchema>;

import { z } from 'zod';

/** RFC 9457 Problem Details: the shape of every error response. */
export const ProblemSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int().min(400).max(599),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .meta({ id: 'Problem', description: 'RFC 9457 Problem Details' });

export type Problem = z.infer<typeof ProblemSchema>;

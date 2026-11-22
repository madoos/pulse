import { z } from 'zod';

export const ADVISORY_FIRMS_PAGE_SIZE = 30;

export const AdvisoryFirmsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .meta({ description: 'Part of the name, ignoring case and accents' }),
  province: z.coerce.number().int().positive().optional().meta({ description: 'Province id' }),
  specialty: z.string().min(1).max(50).optional().meta({ description: 'Specialty code' }),
  cursor: z
    .string()
    .regex(/^[\w-]+$/)
    .max(500)
    .optional()
    .meta({ description: 'Where the page starts: the `nextCursor` of the previous page' }),
  limit: z.coerce.number().int().min(1).max(100).default(ADVISORY_FIRMS_PAGE_SIZE),
});

/** The query a client sends: the page size is optional. */
export type AdvisoryFirmsQuery = Omit<z.output<typeof AdvisoryFirmsQuerySchema>, 'limit'> & {
  limit?: number;
};

export const AdvisoryFirmSummarySchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    province: z.string(),
    city: z.string(),
    employees: z.number().int(),
    specialty: z.string(),
  })
  .meta({ id: 'AdvisoryFirmSummary', description: 'An advisory firm with its basic data' });

export type AdvisoryFirmSummary = z.infer<typeof AdvisoryFirmSummarySchema>;

export const AdvisoryFirmsPageSchema = z
  .object({
    items: z.array(AdvisoryFirmSummarySchema).meta({ description: 'Sorted by name' }),
    total: z.number().int().meta({ description: 'Firms that match the search and the filters' }),
    nextCursor: z
      .string()
      .nullable()
      .meta({ description: 'The cursor of the next page, null on the last one' }),
  })
  .meta({ id: 'AdvisoryFirmsPage', description: 'One page of the advisory firms' });

export type AdvisoryFirmsPage = z.infer<typeof AdvisoryFirmsPageSchema>;

export const AdvisoryFirmFiltersSchema = z
  .object({
    provinces: z
      .array(z.object({ id: z.number().int(), name: z.string() }))
      .meta({ description: 'The provinces with advisory firms, by name' }),
    specialties: z
      .array(z.object({ code: z.string(), name: z.string() }))
      .meta({ description: 'The specialties with advisory firms, by name' }),
  })
  .meta({ id: 'AdvisoryFirmFilters', description: 'The values the listing can be filtered by' });

export type AdvisoryFirmFilters = z.infer<typeof AdvisoryFirmFiltersSchema>;

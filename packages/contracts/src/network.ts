import { z } from 'zod';

/** Calendar month numbers in fiscal order: a fiscal year runs from April to March. */
export const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;

/** Position of a calendar month (1-12) inside the fiscal year: April is 0, March is 11. */
export const fiscalMonthIndex = (month: number) => (month + 8) % 12;

const fiscalYear = z.coerce
  .number()
  .int()
  .min(2000)
  .max(2100)
  .meta({ description: 'Fiscal year, named by the calendar year it starts in: 2025 is 2025-26' });

const calendarMonth = z.coerce.number().int().min(1).max(12);

const PeriodQueryShape = {
  fiscalYear,
  fromMonth: calendarMonth
    .default(4)
    .meta({ description: 'First calendar month of the period (1-12), April by default' }),
  toMonth: calendarMonth
    .default(3)
    .meta({ description: 'Last calendar month of the period (1-12), March by default' }),
};

const validRange = (query: { fromMonth: number; toMonth: number }) =>
  fiscalMonthIndex(query.fromMonth) <= fiscalMonthIndex(query.toMonth);

const rangeError = {
  message: 'The months must be in fiscal order, from April to March',
  path: ['toMonth'],
};

export const PeriodQuerySchema = z.object(PeriodQueryShape).refine(validRange, rangeError);

export type PeriodQuery = z.infer<typeof PeriodQuerySchema>;

const ComparedPeriodQueryShape = {
  ...PeriodQueryShape,
  compareWith: fiscalYear.optional().meta({ description: 'Fiscal year to compare with, if any' }),
};

const notComparedWithItself = (query: { fiscalYear: number; compareWith?: number }) =>
  query.compareWith !== query.fiscalYear;

const sameYearError = {
  message: 'A fiscal year cannot be compared with itself',
  path: ['compareWith'],
};

export const NetworkPerformanceQuerySchema = z
  .object(ComparedPeriodQueryShape)
  .refine(validRange, rangeError)
  .refine(notComparedWithItself, sameYearError);

export type NetworkPerformanceQuery = z.infer<typeof NetworkPerformanceQuerySchema>;

export const GROUP_BY = ['specialty', 'autonomous-community'] as const;

export const GroupBySchema = z.enum(GROUP_BY);

export type GroupBy = z.infer<typeof GroupBySchema>;

export const NetworkGroupsQuerySchema = z
  .object({ ...ComparedPeriodQueryShape, groupBy: GroupBySchema })
  .refine(validRange, rangeError)
  .refine(notComparedWithItself, sameYearError);

export type NetworkGroupsQuery = z.infer<typeof NetworkGroupsQuerySchema>;

export const FiscalYearsSchema = z
  .object({
    fiscalYears: z.array(z.number().int()).meta({ description: 'From the most recent' }),
  })
  .meta({ id: 'FiscalYears', description: 'The fiscal years that have metrics' });

export type FiscalYears = z.infer<typeof FiscalYearsSchema>;

const ratio = z.number().nullable();

export const PeriodSummarySchema = z
  .object({
    activeClients: z.number().int().meta({ description: 'Active clients of the last month' }),
    revenue: z.number().meta({ description: 'Revenue of the period, in euros' }),
    revenuePerClient: ratio.meta({
      description: 'Revenue of the period / average monthly active clients, in euros',
    }),
    churnRate: ratio.meta({
      description: 'Churned clients / sum of monthly active clients (0.02 is 2 %)',
    }),
  })
  .meta({ id: 'PeriodSummary', description: 'The metrics of a period' });

export type PeriodSummary = z.infer<typeof PeriodSummarySchema>;

export const MonthlyPointSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    firmsWithData: z.number().int(),
    activeClients: z.number().int(),
    revenue: z.number(),
    revenuePerClient: ratio,
    churnRate: ratio,
  })
  .meta({ id: 'MonthlyPoint', description: 'The metrics of one month (YYYY-MM)' });

export type MonthlyPoint = z.infer<typeof MonthlyPointSchema>;

export const YearPerformanceSchema = z
  .object({
    fiscalYear: z.number().int(),
    summary: PeriodSummarySchema,
    months: z.array(MonthlyPointSchema).meta({ description: 'Only the months with data' }),
  })
  .meta({ id: 'YearPerformance' });

export type YearPerformance = z.infer<typeof YearPerformanceSchema>;

export const NetworkPerformanceSchema = z
  .object({
    years: z.array(YearPerformanceSchema).meta({
      description: 'The selected fiscal year first, then the compared one if any',
    }),
  })
  .meta({ id: 'NetworkPerformance', description: 'The whole network, month by month' });

export type NetworkPerformance = z.infer<typeof NetworkPerformanceSchema>;

export const GroupPerformanceSchema = z
  .object({
    key: z.string(),
    name: z.string(),
    firms: z.number().int().meta({ description: 'Advisory firms of the group' }),
    summary: PeriodSummarySchema,
    revenuePerFirm: z.number(),
    revenueChange: ratio.meta({
      description: 'Revenue change against the compared year (0.1 is +10 %)',
    }),
    months: z.array(MonthlyPointSchema).meta({ description: 'The selected year only' }),
  })
  .meta({ id: 'GroupPerformance' });

export type GroupPerformance = z.infer<typeof GroupPerformanceSchema>;

export const NetworkGroupsSchema = z
  .object({ groups: z.array(GroupPerformanceSchema) })
  .meta({ id: 'NetworkGroups', description: 'The network grouped by an attribute of the firms' });

export type NetworkGroups = z.infer<typeof NetworkGroupsSchema>;

export const FirmReferenceSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    specialty: z.string(),
    province: z.string(),
  })
  .meta({ id: 'FirmReference' });

export type FirmReference = z.infer<typeof FirmReferenceSchema>;

export const ALERT_TYPES = [
  'losing-clients',
  'high-churn',
  'falling-revenue',
  'losing-value',
  'missing-data',
] as const;

export const AlertTypeSchema = z.enum(ALERT_TYPES);

export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertSchema = z
  .object({
    type: AlertTypeSchema,
    value: z.number().nullable().meta({ description: 'The value of the firm' }),
    reference: z.number().nullable().meta({ description: 'The value it is compared with' }),
  })
  .meta({ id: 'Alert' });

export type Alert = z.infer<typeof AlertSchema>;

export const FirmNeedingAttentionSchema = z
  .object({ firm: FirmReferenceSchema, alerts: z.array(AlertSchema).min(1) })
  .meta({ id: 'FirmNeedingAttention' });

export type FirmNeedingAttention = z.infer<typeof FirmNeedingAttentionSchema>;

export const StandoutSchema = z
  .object({
    firm: FirmReferenceSchema,
    clientGrowth: z.number().meta({ description: 'Against the same month of the previous year' }),
    churnRate: ratio,
  })
  .meta({ id: 'Standout' });

export type Standout = z.infer<typeof StandoutSchema>;

export const NetworkHighlightsSchema = z
  .object({
    previousFiscalYear: z.number().int().nullable().meta({
      description: 'The year the period is compared with, null when there is no previous year',
    }),
    needsAttention: z.array(FirmNeedingAttentionSchema),
    standouts: z.array(StandoutSchema),
  })
  .meta({
    id: 'NetworkHighlights',
    description: 'The advisory firms that need attention and the ones that grow the most',
  });

export type NetworkHighlights = z.infer<typeof NetworkHighlightsSchema>;

const taxFilings = z.number().int().meta({ description: 'Tax filings of every kind' });

const revenuePerEmployee = ratio.meta({
  description: 'Revenue over the employees of the firm, in euros',
});

const incidentRate = ratio.meta({
  description: 'Incidents with the tax agency over tax filings, null without filings',
});

export const FirmPeriodSummarySchema = PeriodSummarySchema.extend({
  taxFilings,
  revenuePerEmployee,
  incidentRate,
}).meta({
  id: 'FirmPeriodSummary',
  description: 'The metrics of an advisory firm in a period',
});

export type FirmPeriodSummary = z.infer<typeof FirmPeriodSummarySchema>;

export const FirmMonthlyPointSchema = MonthlyPointSchema.omit({ firmsWithData: true })
  .extend({ taxFilings, revenuePerEmployee, incidentRate })
  .meta({ id: 'FirmMonthlyPoint', description: 'The metrics of an advisory firm in one month' });

export type FirmMonthlyPoint = z.infer<typeof FirmMonthlyPointSchema>;

/** The average firm of a specialty: its totals are averages, so they need not be whole. */
const averaged = {
  activeClients: z.number().meta({ description: 'Average active clients' }),
  taxFilings: z.number().meta({ description: 'Average tax filings' }),
};

export const AverageFirmPeriodSummarySchema = FirmPeriodSummarySchema.extend(averaged).meta({
  id: 'AverageFirmPeriodSummary',
});

export const AverageFirmMonthlyPointSchema = FirmMonthlyPointSchema.extend(averaged).meta({
  id: 'AverageFirmMonthlyPoint',
});

export const FirmPerformanceSchema = z
  .object({
    years: z
      .array(
        z.object({
          fiscalYear: z.number().int(),
          summary: FirmPeriodSummarySchema,
          months: z
            .array(FirmMonthlyPointSchema)
            .meta({ description: 'Only the months with data' }),
        }),
      )
      .meta({ description: 'The selected fiscal year first, then the compared one if any' }),
    sixMonthsAgo: z
      .object({
        current: FirmMonthlyPointSchema.meta({
          description: 'The last month of the period with data',
        }),
        previous: FirmMonthlyPointSchema.nullable().meta({
          description: 'Six months before it, null without data',
        }),
        specialty: z
          .object({
            current: AverageFirmMonthlyPointSchema.nullable(),
            previous: AverageFirmMonthlyPointSchema.nullable(),
          })
          .meta({
            description:
              'The average firm of the rest of its specialty in the same two months, so seasonality shows',
          }),
      })
      .nullable()
      .meta({ description: 'The last month against six months before, null without data' }),
    specialty: z
      .object({
        firms: z.number().int().meta({ description: 'The other firms of its specialty' }),
        summary: AverageFirmPeriodSummarySchema,
        months: z
          .array(AverageFirmMonthlyPointSchema)
          .meta({ description: 'Only the months with data' }),
      })
      .meta({
        description:
          'The average firm of the rest of its specialty in the selected period, to compare with',
      }),
    alerts: z.array(AlertSchema).meta({
      description: 'What goes wrong in the period, by the same rules as in the network',
    }),
    alertsComparedWith: z.number().int().nullable().meta({
      description: 'The year the alerts compare with, null when there is no previous year',
    }),
  })
  .meta({ id: 'FirmPerformance', description: 'An advisory firm month by month' });

export type FirmPerformance = z.infer<typeof FirmPerformanceSchema>;

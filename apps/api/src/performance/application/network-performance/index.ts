import {
  fiscalYearOf,
  withComparedYear,
  type FiscalPeriod,
} from '@performance/domain/FiscalPeriod';
import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';
import {
  pointOf,
  summarize,
  totalsOf,
  type MonthlyPoint,
  type PeriodSummary,
} from '@performance/domain/Totals';

export type NetworkPerformanceInput = FiscalPeriod & { compareWith?: number };

export type YearPerformance = {
  fiscalYear: number;
  summary: PeriodSummary;
  months: MonthlyPoint[];
};

export type GetNetworkPerformance = (
  input: NetworkPerformanceInput,
) => Promise<{ years: YearPerformance[] }>;

export const makeGetNetworkPerformance =
  ({ repository }: { repository: NetworkPerformanceRepository }): GetNetworkPerformance =>
  async ({ compareWith, ...period }) => {
    const periods = withComparedYear(period, compareWith);
    const rows = await repository.monthlyTotals(periods);
    const years = periods.map(({ fiscalYear }) => {
      const months = rows
        .filter((row) => fiscalYearOf(row.month) === fiscalYear)
        .sort((a, b) => a.month.localeCompare(b.month));
      return { fiscalYear, summary: summarize(totalsOf(months)), months: months.map(pointOf) };
    });
    return { years };
  };

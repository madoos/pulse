import type { FiscalPeriod } from './FiscalPeriod';
import type { FirmPeriod } from './Highlights';
import type { MonthlyTotals } from './Totals';

export type GroupBy = 'specialty' | 'autonomous-community';

export type Group = { key: string; name: string; firms: number };

export type GroupMonthlyTotals = MonthlyTotals & { groupKey: string };

export type NetworkPerformanceRepository = {
  /** The fiscal years with metrics, the most recent first. */
  fiscalYears: () => Promise<number[]>;
  /** The whole network, month by month, for the months of the given periods. */
  monthlyTotals: (periods: FiscalPeriod[]) => Promise<MonthlyTotals[]>;
  /** The groups that have advisory firms, with how many each one has. */
  groups: (groupBy: GroupBy) => Promise<Group[]>;
  /** Each group, month by month, for the months of the given periods. */
  monthlyTotalsByGroup: (
    groupBy: GroupBy,
    periods: FiscalPeriod[],
  ) => Promise<GroupMonthlyTotals[]>;
  /** Every firm with its totals for a period and, if given, for the same months of another year. */
  firmPeriods: (period: FiscalPeriod, previousFiscalYear: number | null) => Promise<FirmPeriod[]>;
};

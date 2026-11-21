import {
  fiscalYearOf,
  withComparedYear,
  type FiscalPeriod,
} from '@performance/domain/FiscalPeriod';
import type {
  GroupBy,
  NetworkPerformanceRepository,
} from '@performance/domain/NetworkPerformanceRepository';
import {
  changeOf,
  pointOf,
  summarize,
  totalsOf,
  type MonthlyPoint,
  type PeriodSummary,
} from '@performance/domain/Totals';

export type NetworkGroupsInput = FiscalPeriod & { compareWith?: number; groupBy: GroupBy };

export type GroupPerformance = {
  key: string;
  name: string;
  firms: number;
  summary: PeriodSummary;
  revenuePerFirm: number;
  revenueChange: number | null;
  months: MonthlyPoint[];
};

export type GetNetworkGroups = (
  input: NetworkGroupsInput,
) => Promise<{ groups: GroupPerformance[] }>;

export const makeGetNetworkGroups =
  ({ repository }: { repository: NetworkPerformanceRepository }): GetNetworkGroups =>
  async ({ groupBy, compareWith, ...period }) => {
    const periods = withComparedYear(period, compareWith);
    const [groups, rows] = await Promise.all([
      repository.groups(groupBy),
      repository.monthlyTotalsByGroup(groupBy, periods),
    ]);
    return {
      groups: groups.map((group) => {
        const ofGroup = rows.filter((row) => row.groupKey === group.key);
        const months = ofGroup.filter((row) => fiscalYearOf(row.month) === period.fiscalYear);
        const summary = summarize(totalsOf(months));
        const compared =
          compareWith === undefined
            ? null
            : totalsOf(ofGroup.filter((row) => fiscalYearOf(row.month) === compareWith));
        return {
          ...group,
          summary,
          revenuePerFirm: group.firms > 0 ? summary.revenue / group.firms : 0,
          revenueChange: compared ? changeOf(summary.revenue, summarize(compared).revenue) : null,
          months: months.sort((a, b) => a.month.localeCompare(b.month)).map(pointOf),
        };
      }),
    };
  };

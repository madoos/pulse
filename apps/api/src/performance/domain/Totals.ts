/** What the database adds up for one month: across all firms, a group or a single firm. */
export type MonthlyTotals = {
  /** As `YYYY-MM`. */
  month: string;
  firms: number;
  activeClients: number;
  churnedClients: number;
  revenueCents: number;
};

/** What the database adds up for a period. */
export type PeriodTotals = {
  /** The last month of the period with data. */
  lastMonth: string;
  lastMonthActiveClients: number;
  /** Sum of the active clients of every month, the base of the averages. */
  activeClientsSum: number;
  monthsWithData: number;
  churnedClients: number;
  revenueCents: number;
};

export type PeriodSummary = {
  activeClients: number;
  revenue: number;
  revenuePerClient: number | null;
  churnRate: number | null;
};

export type MonthlyPoint = PeriodSummary & { month: string; firmsWithData: number };

const euros = (cents: number) => cents / 100;

/** Adds up the months of a period. Returns null when no month has data. */
export const totalsOf = (months: MonthlyTotals[]): PeriodTotals | null => {
  const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month));
  const last = sorted.at(-1);
  if (!last) return null;
  return {
    lastMonth: last.month,
    lastMonthActiveClients: last.activeClients,
    activeClientsSum: sorted.reduce((sum, m) => sum + m.activeClients, 0),
    monthsWithData: sorted.length,
    churnedClients: sorted.reduce((sum, m) => sum + m.churnedClients, 0),
    revenueCents: sorted.reduce((sum, m) => sum + m.revenueCents, 0),
  };
};

/**
 * The metrics of a period, the same for the network, a group or a firm:
 * - active clients are those of the last month,
 * - revenue per client is the revenue over the average monthly active clients,
 * - the churn rate is the churned clients over the sum of monthly active clients (mean monthly churn).
 */
export const summarize = (totals: PeriodTotals | null): PeriodSummary => {
  if (!totals) return { activeClients: 0, revenue: 0, revenuePerClient: null, churnRate: null };
  const averageClients = totals.activeClientsSum / totals.monthsWithData;
  return {
    activeClients: totals.lastMonthActiveClients,
    revenue: euros(totals.revenueCents),
    revenuePerClient: averageClients > 0 ? euros(totals.revenueCents) / averageClients : null,
    churnRate: totals.activeClientsSum > 0 ? totals.churnedClients / totals.activeClientsSum : null,
  };
};

/** The metrics of one month, a period of one month. */
export const pointOf = (month: MonthlyTotals): MonthlyPoint => ({
  month: month.month,
  firmsWithData: month.firms,
  ...summarize(totalsOf([month])),
});

/** Relative change, null when there is no reference or it is zero. */
export const changeOf = (value: number | null, reference: number | null | undefined) =>
  value === null || !reference ? null : (value - reference) / reference;

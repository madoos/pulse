import { changeOf, summarize, type PeriodTotals } from './Totals';

export const ALERT_TYPES = [
  'losing-clients',
  'high-churn',
  'falling-revenue',
  'losing-value',
  'missing-data',
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

export type Alert = { type: AlertType; value: number | null; reference: number | null };

/** A churn rate this many times the network's is high. */
export const HIGH_CHURN_FACTOR = 1.5;

/** Revenue per client this much below the previous year means the firm is losing value. */
export const LOSING_VALUE_DROP = 0.1;

export const STANDOUTS = 4;

export type FirmReference = { id: number; name: string; specialty: string; province: string };

/** A firm with its totals for the period and for the same months of the previous year. */
export type FirmPeriod = {
  firm: FirmReference;
  current: PeriodTotals | null;
  previous: PeriodTotals | null;
};

const sameCalendarMonth = (a: string, b: string) => a.slice(5) === b.slice(5);

/**
 * The alerts of one firm. Every comparison is with the same months of the previous
 * fiscal year, so seasonality never raises an alert; without a previous year only the
 * alerts that need none apply.
 */
export const alertsOf = (
  { current, previous }: FirmPeriod,
  context: { lastMonth: string; networkChurnRate: number | null },
): Alert[] => {
  const alerts: Alert[] = [];
  if (!current || current.lastMonth !== context.lastMonth) {
    alerts.push({ type: 'missing-data', value: null, reference: null });
  }
  if (!current) return alerts;

  const now = summarize(current);
  const before = previous ? summarize(previous) : null;

  if (
    previous &&
    current.lastMonth === context.lastMonth &&
    sameCalendarMonth(previous.lastMonth, current.lastMonth) &&
    current.lastMonthActiveClients < previous.lastMonthActiveClients
  ) {
    alerts.push({
      type: 'losing-clients',
      value: current.lastMonthActiveClients,
      reference: previous.lastMonthActiveClients,
    });
  }
  if (
    now.churnRate !== null &&
    context.networkChurnRate !== null &&
    now.churnRate >= HIGH_CHURN_FACTOR * context.networkChurnRate
  ) {
    alerts.push({ type: 'high-churn', value: now.churnRate, reference: context.networkChurnRate });
  }
  if (before && now.revenue < before.revenue) {
    alerts.push({ type: 'falling-revenue', value: now.revenue, reference: before.revenue });
  }
  const valueChange = changeOf(now.revenuePerClient, before?.revenuePerClient);
  if (valueChange !== null && valueChange <= -LOSING_VALUE_DROP) {
    alerts.push({
      type: 'losing-value',
      value: now.revenuePerClient,
      reference: before?.revenuePerClient ?? null,
    });
  }
  return sortAlerts(alerts);
};

const sortAlerts = (alerts: Alert[]) =>
  [...alerts].sort((a, b) => ALERT_TYPES.indexOf(a.type) - ALERT_TYPES.indexOf(b.type));

/** Network churn rate, from the totals of all its firms. */
export const networkChurnRateOf = (firms: FirmPeriod[]) => {
  const totals = firms.flatMap((f) => (f.current ? [f.current] : []));
  const active = totals.reduce((sum, t) => sum + t.activeClientsSum, 0);
  const churned = totals.reduce((sum, t) => sum + t.churnedClients, 0);
  return active > 0 ? churned / active : null;
};

/** The last month of the period with data in any firm. */
export const lastMonthOf = (firms: FirmPeriod[]): string | null =>
  firms.reduce<string | null>(
    (last, f) => (f.current && (!last || f.current.lastMonth > last) ? f.current.lastMonth : last),
    null,
  );

export type FirmNeedingAttention = { firm: FirmReference; alerts: Alert[] };

/** Firms with alerts, the ones with more alerts first. */
export const needingAttention = (firms: FirmPeriod[]): FirmNeedingAttention[] => {
  const lastMonth = lastMonthOf(firms);
  if (!lastMonth) return [];
  const context = { lastMonth, networkChurnRate: networkChurnRateOf(firms) };
  return firms
    .map((f) => ({ firm: f.firm, alerts: alertsOf(f, context) }))
    .filter((f) => f.alerts.length > 0)
    .sort(
      (a, b) =>
        b.alerts.length - a.alerts.length ||
        ALERT_TYPES.indexOf(a.alerts[0]!.type) - ALERT_TYPES.indexOf(b.alerts[0]!.type) ||
        a.firm.name.localeCompare(b.firm.name, 'es'),
    );
};

export type Standout = { firm: FirmReference; clientGrowth: number; churnRate: number | null };

/**
 * The firms that grow the most in active clients against the same month of the
 * previous year. Firms without that month in both years are left out.
 */
export const standoutsOf = (firms: FirmPeriod[], count = STANDOUTS): Standout[] => {
  const lastMonth = lastMonthOf(firms);
  return firms
    .flatMap(({ firm, current, previous }) => {
      if (!current || !previous || current.lastMonth !== lastMonth) return [];
      if (!sameCalendarMonth(previous.lastMonth, current.lastMonth)) return [];
      const clientGrowth = changeOf(
        current.lastMonthActiveClients,
        previous.lastMonthActiveClients,
      );
      if (clientGrowth === null) return [];
      return [{ firm, clientGrowth, churnRate: summarize(current).churnRate }];
    })
    .sort((a, b) => b.clientGrowth - a.clientGrowth)
    .slice(0, count);
};

/** The alerts of one firm, measured against the whole network. Empty if it is not in it. */
export const alertsOfFirm = (firms: FirmPeriod[], firmId: number): Alert[] => {
  const lastMonth = lastMonthOf(firms);
  const firm = firms.find((f) => f.firm.id === firmId);
  if (!lastMonth || !firm) return [];
  return alertsOf(firm, { lastMonth, networkChurnRate: networkChurnRateOf(firms) });
};

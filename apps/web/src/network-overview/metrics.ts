import type { MonthlyPoint, PeriodSummary } from '@pulse/contracts';
import type { DeltaProps } from '@pulse/design-system';
import {
  formatChange,
  formatCompactEuros,
  formatEuros,
  formatNumber,
  formatPercent,
  formatPoints,
} from '@shared/format';

export type MetricKey = keyof PeriodSummary;

type Metric = {
  label: string;
  format: (value: number | null) => string;
  formatTick: (value: number) => string;
  /** Whether going up is good news. */
  higherIsBetter: boolean;
  /** Rates change in percentage points; amounts and counts in percentage. */
  change: 'relative' | 'points';
  footnote: string;
};

const count = (value: number | null) => (value === null ? 'n/d' : formatNumber(value));

/** The four metrics of the network, and how to read them. */
export const METRICS: Record<MetricKey, Metric> = {
  activeClients: {
    label: 'Clientes activos',
    format: count,
    formatTick: formatNumber,
    higherIsBetter: true,
    change: 'relative',
    footnote: 'Clientes del último mes del periodo, sumando todas las asesorías.',
  },
  revenue: {
    label: 'Facturación',
    format: formatEuros,
    formatTick: formatCompactEuros,
    higherIsBetter: true,
    change: 'relative',
    footnote: 'Suma de la facturación de todas las asesorías en el periodo.',
  },
  revenuePerClient: {
    label: 'Facturación por cliente',
    format: formatEuros,
    formatTick: (value) => formatEuros(value),
    higherIsBetter: true,
    change: 'relative',
    footnote: 'Facturación del periodo entre la media de clientes activos al mes.',
  },
  churnRate: {
    label: 'Bajas al mes',
    format: (value) => formatPercent(value),
    formatTick: (value) => formatPercent(value),
    higherIsBetter: false,
    change: 'points',
    footnote: 'De cada 100 clientes, cuántos se van en un mes: bajas entre clientes activos.',
  },
};

export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

const THRESHOLD = 0.0005;

/** How a metric changed against the compared year, ready for a Delta. Null if it cannot be told. */
export const deltaOf = (
  metric: MetricKey,
  value: number | null,
  reference: number | null,
): (Omit<DeltaProps, 'children'> & { text: string }) | null => {
  if (value === null || reference === null) return null;
  const { change, higherIsBetter } = METRICS[metric];
  if (change === 'relative' && reference === 0) return null;
  const amount = change === 'relative' ? (value - reference) / reference : value - reference;
  const formatted = change === 'relative' ? formatChange(amount) : formatPoints(amount);
  const text = `${formatted} · antes ${METRICS[metric].format(reference)}`;
  if (Math.abs(amount) < THRESHOLD) return { direction: 'flat', tone: 'neutral', text };
  const direction = amount > 0 ? 'up' : 'down';
  const tone = (direction === 'up') === higherIsBetter ? 'good' : 'bad';
  return { direction, tone, text };
};

/** The values of a metric for each month of the period, null where there is no data. */
export const valuesByMonth = (
  months: MonthlyPoint[],
  calendarMonths: number[],
  metric: MetricKey,
) =>
  calendarMonths.map((calendarMonth) => {
    const point = months.find((m) => Number(m.month.slice(5)) === calendarMonth);
    return point ? point[metric] : null;
  });

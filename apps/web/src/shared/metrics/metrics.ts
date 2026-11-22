import type { FirmPeriodSummary, PeriodSummary } from '@pulse/contracts';
import type { DeltaProps } from '@pulse/design-system';
import {
  formatChange,
  formatCompactEuros,
  formatEuros,
  formatNumber,
  formatPercent,
  formatPoints,
} from '@shared/format';

/** Every metric: the network's, and the tax filings measured for each firm. */
export type MetricKey = keyof FirmPeriodSummary;

/** The metrics of the network. */
export type NetworkMetricKey = keyof PeriodSummary;

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

/** The metrics, and how to read them. */
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
  revenuePerEmployee: {
    label: 'Facturación por empleado',
    format: formatEuros,
    formatTick: (value) => formatEuros(value),
    higherIsBetter: true,
    change: 'relative',
    footnote: 'Facturación del periodo entre los empleados de la asesoría.',
  },
  incidentRate: {
    label: 'Incidencias con Hacienda',
    format: (value) => formatPercent(value),
    formatTick: (value) => formatPercent(value),
    higherIsBetter: false,
    change: 'points',
    footnote: 'De cada 100 declaraciones, cuántas acaban en una incidencia con Hacienda.',
  },
  taxFilings: {
    label: 'Declaraciones',
    format: count,
    formatTick: formatNumber,
    higherIsBetter: true,
    change: 'relative',
    footnote: 'Declaraciones presentadas en el periodo: renta, IVA, sociedades y otras.',
  },
};

/** The four metrics of the network overview. */
export const METRIC_KEYS: NetworkMetricKey[] = [
  'activeClients',
  'revenue',
  'revenuePerClient',
  'churnRate',
];

const THRESHOLD = 0.0005;

/** How a metric changed against the compared year, ready for a Delta. Null if it cannot be told. */
export const deltaOf = (
  metric: MetricKey,
  value: number | null,
  reference: number | null,
  /** How the reference is introduced: "antes 216", or "su especialidad 216". */
  referenceIs = 'antes',
): (Omit<DeltaProps, 'children'> & { text: string }) | null => {
  if (value === null || reference === null) return null;
  const { change, higherIsBetter } = METRICS[metric];
  if (change === 'relative' && reference === 0) return null;
  const amount = change === 'relative' ? (value - reference) / reference : value - reference;
  const formatted = change === 'relative' ? formatChange(amount) : formatPoints(amount);
  const text = `${formatted} · ${referenceIs} ${METRICS[metric].format(reference)}`;
  if (Math.abs(amount) < THRESHOLD) return { direction: 'flat', tone: 'neutral', text };
  const direction = amount > 0 ? 'up' : 'down';
  const tone = (direction === 'up') === higherIsBetter ? 'good' : 'bad';
  return { direction, tone, text };
};

/** Whether a change in points of a metric is good, bad or too small to matter. */
export const toneOf = (metric: MetricKey, points: number): Omit<DeltaProps, 'children'> => {
  if (Math.abs(points) < THRESHOLD) return { direction: 'flat', tone: 'neutral' };
  const direction = points > 0 ? 'up' : 'down';
  return {
    direction,
    tone: (direction === 'up') === METRICS[metric].higherIsBetter ? 'good' : 'bad',
  };
};

/** The values of a metric for each month of the period, null where there is no data. */
export const valuesByMonth = (months: MonthOf[], calendarMonths: number[], metric: MetricKey) =>
  calendarMonths.map((calendarMonth) => {
    const point = months.find((m) => Number(m.month.slice(5)) === calendarMonth);
    return point?.[metric] ?? null;
  });

/** A month of the network, a group or a firm. */
export type MonthOf = { month: string } & Partial<Record<MetricKey, number | null>>;

import {
  ChartLegend,
  Delta,
  LineChart,
  StatCard,
  type ChartLegendItem,
} from '@pulse/design-system';
import { formatMonthName, formatShortMonth } from '@shared/format';
import {
  METRICS,
  METRIC_KEYS,
  deltaOf,
  type MetricKey,
  type MonthOf,
} from '@shared/metrics/metrics';
import styles from './metric-cards.module.scss';
import type { MetricChart } from './charts';

/** The network or a firm, year by year: the selected year first, then the compared one. */
export type MetricCardsOf = {
  years: {
    fiscalYear: number;
    summary: Partial<Record<MetricKey, number | null>>;
    months: MonthOf[];
  }[];
};

export type MetricCardsProps = {
  performance: MetricCardsOf;
  /** The metrics to show, the four of the network by default. */
  metrics?: MetricKey[];
  /** What each value means, when it is not what it means for the network. */
  footnotes?: Partial<Record<MetricKey, string>>;
  /** The calendar months of the period, in fiscal order. */
  calendarMonths: number[];
  /** The chart of each metric: one line per year, or per group. Null while it loads. */
  charts: MetricChart[] | null;
  /** What the lines are, shown once over the cards when there is more than one. */
  legend: ChartLegendItem[];
  /** What the lines are, for screen readers: "una línea por año". */
  linesAre: string;
  /** How the second value is introduced in the change: "antes" by default. */
  referenceIs?: string;
};

/** A card per metric: its value, its change and its evolution month by month. */
export const MetricCards = ({
  performance,
  metrics = METRIC_KEYS,
  footnotes = {},
  calendarMonths,
  charts,
  legend,
  linesAre,
  referenceIs,
}: MetricCardsProps) => {
  const [selected, compared] = performance.years;
  if (!selected) return null;
  const range = `de ${formatMonthName(calendarMonths[0] ?? 4)} a ${formatMonthName(calendarMonths.at(-1) ?? 3)}`;
  return (
    <>
      {legend.length > 1 && <ChartLegend items={legend} />}
      <div className={styles['metric-cards']}>
        {metrics.map((key) => {
          const metric = METRICS[key];
          const value = selected.summary[key] ?? null;
          const delta = compared && deltaOf(key, value, compared.summary[key] ?? null, referenceIs);
          const chart = charts?.find((c) => c.metric === key);
          return (
            <StatCard
              key={key}
              label={metric.label}
              value={metric.format(value)}
              change={
                delta && (
                  <Delta direction={delta.direction} tone={delta.tone}>
                    {delta.text}
                  </Delta>
                )
              }
              chart={
                chart && (
                  <LineChart
                    compact
                    height={170}
                    label={`${metric.label} mes a mes ${range}, ${linesAre}`}
                    categories={calendarMonths.map(formatShortMonth)}
                    series={chart.series}
                    formatValue={(value) => metric.format(value)}
                    formatTick={metric.formatTick}
                    describeCategory={chart.describeMonth}
                  />
                )
              }
              footnote={footnotes[key] ?? metric.footnote}
            />
          );
        })}
      </div>
    </>
  );
};

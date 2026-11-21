import type { NetworkPerformance } from '@pulse/contracts';
import {
  ChartLegend,
  Delta,
  LineChart,
  StatCard,
  type ChartLegendItem,
} from '@pulse/design-system';
import { formatMonthName, formatShortMonth } from '@shared/format';
import { METRICS, METRIC_KEYS, deltaOf } from '@network-overview/metrics';
import styles from '@network-overview/network-overview.module.scss';
import type { MetricChart } from './charts';

export type NetworkKpisProps = {
  performance: NetworkPerformance;
  /** The calendar months of the period, in fiscal order. */
  calendarMonths: number[];
  /** The chart of each metric: one line per year, or per group. Null while it loads. */
  charts: MetricChart[] | null;
  /** What the lines are, shown once over the cards when there is more than one. */
  legend: ChartLegendItem[];
  /** What the lines are, for screen readers: "una línea por año". */
  linesAre: string;
};

/** Each metric of the network: its value, its change and its evolution month by month. */
export const NetworkKpis = ({
  performance,
  calendarMonths,
  charts,
  legend,
  linesAre,
}: NetworkKpisProps) => {
  const [selected, compared] = performance.years;
  if (!selected) return null;
  const range = `de ${formatMonthName(calendarMonths[0] ?? 4)} a ${formatMonthName(calendarMonths.at(-1) ?? 3)}`;
  return (
    <>
      {legend.length > 1 && <ChartLegend items={legend} />}
      <div className={styles['network-overview__kpis']}>
        {METRIC_KEYS.map((key) => {
          const metric = METRICS[key];
          const delta = compared && deltaOf(key, selected.summary[key], compared.summary[key]);
          const chart = charts?.find((c) => c.metric === key);
          return (
            <StatCard
              key={key}
              label={metric.label}
              value={metric.format(selected.summary[key])}
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
              footnote={metric.footnote}
            />
          );
        })}
      </div>
    </>
  );
};

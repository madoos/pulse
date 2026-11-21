import type { NetworkPerformance } from '@pulse/contracts';
import { ChartLegend, Delta, LineChart, StatCard } from '@pulse/design-system';
import { formatMonthName, formatShortMonth } from '@shared/format';
import { METRICS, METRIC_KEYS, deltaOf } from '@network-overview/metrics';
import styles from '@network-overview/network-overview.module.scss';
import { yearLegend, yearSeries } from './charts';

export type NetworkKpisProps = {
  performance: NetworkPerformance;
  /** The calendar months of the period, in fiscal order. */
  calendarMonths: number[];
};

export const NetworkKpis = ({ performance, calendarMonths }: NetworkKpisProps) => {
  const [selected, compared] = performance.years;
  if (!selected) return null;
  const range = `de ${formatMonthName(calendarMonths[0] ?? 4)} a ${formatMonthName(calendarMonths.at(-1) ?? 3)}`;
  return (
    <>
      {compared && <ChartLegend items={yearLegend(performance)} />}
      <div className={styles['network-overview__grid']}>
        {METRIC_KEYS.map((key) => {
          const metric = METRICS[key];
          const delta = compared && deltaOf(key, selected.summary[key], compared.summary[key]);
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
                <LineChart
                  compact
                  label={`${metric.label} mes a mes ${range}, una línea por año`}
                  categories={calendarMonths.map(formatShortMonth)}
                  series={yearSeries(performance, calendarMonths, key)}
                  formatValue={(value) => metric.format(value)}
                  formatTick={metric.formatTick}
                />
              }
              footnote={metric.footnote}
            />
          );
        })}
      </div>
    </>
  );
};

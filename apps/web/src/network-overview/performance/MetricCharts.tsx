import { LineChart, type LineChartSeries } from '@pulse/design-system';
import { formatShortMonth } from '@shared/format';
import { METRICS, type MetricKey } from '@network-overview/metrics';
import styles from '@network-overview/network-overview.module.scss';

export type MetricChart = {
  metric: MetricKey;
  series: LineChartSeries[];
  describeMonth?: (index: number) => string | undefined;
};

export type MetricChartsProps = {
  /** The calendar months of the period, in fiscal order. */
  calendarMonths: number[];
  charts: MetricChart[];
  /** What the lines are, for screen readers: "por año", "por especialidad". */
  description: string;
};

/** One line chart per metric over the months of the period, from April to March. */
export const MetricCharts = ({ calendarMonths, charts, description }: MetricChartsProps) => (
  <div className={styles['network-overview__charts']}>
    {charts.map(({ metric, series, describeMonth }) => (
      <div key={metric} className={styles['network-overview__section']}>
        <h3 className={styles['network-overview__section-title']}>{METRICS[metric].label}</h3>
        <LineChart
          label={`${METRICS[metric].label} mes a mes, ${description}`}
          categories={calendarMonths.map(formatShortMonth)}
          series={series}
          formatValue={(value) => METRICS[metric].format(value)}
          formatTick={METRICS[metric].formatTick}
          describeCategory={describeMonth}
        />
      </div>
    ))}
  </div>
);

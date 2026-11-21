import type { GroupPerformance, NetworkPerformance } from '@pulse/contracts';
import type { LineChartSeries } from '@pulse/design-system';
import { formatFiscalYear, formatNumber } from '@shared/format';
import { METRIC_KEYS, valuesByMonth, type MetricKey } from '@network-overview/metrics';

/** The chart of a metric over the months of the period. */
export type MetricChart = {
  metric: MetricKey;
  series: LineChartSeries[];
  describeMonth?: (index: number) => string | undefined;
};

type Color = NonNullable<LineChartSeries['color']>;

/** The series of each year, without values: the selected one stands out, and each year keeps its colour. */
export const yearLegend = (performance: NetworkPerformance) =>
  performance.years.map((year, index) => ({
    id: String(year.fiscalYear),
    label: formatFiscalYear(year.fiscalYear),
    color: (index + 1) as Color,
    muted: index > 0,
  }));

/** One line per year for a metric. */
export const yearSeries = (
  performance: NetworkPerformance,
  calendarMonths: number[],
  metric: MetricKey,
): LineChartSeries[] =>
  yearLegend(performance).map((item, index) => ({
    ...item,
    values: valuesByMonth(performance.years[index]?.months ?? [], calendarMonths, metric),
  }));

/** The monthly charts of the network, one line per year. */
export const networkCharts = (
  performance: NetworkPerformance,
  calendarMonths: number[],
): MetricChart[] => {
  const [selected] = performance.years;
  return METRIC_KEYS.map((metric) => ({
    metric,
    series: yearSeries(performance, calendarMonths, metric),
    describeMonth: (index) => {
      const month = selected?.months.find(
        (m) => Number(m.month.slice(5)) === calendarMonths[index],
      );
      return month && `${formatNumber(month.firmsWithData)} asesorías con datos`;
    },
  }));
};

/** One line per group, for the selected year only. */
export const groupCharts = (groups: GroupPerformance[], calendarMonths: number[]): MetricChart[] =>
  METRIC_KEYS.map((metric) => ({
    metric,
    series: groups.map((group, index) => ({
      id: group.key,
      label: group.name,
      values: valuesByMonth(group.months, calendarMonths, metric),
      color: ((index % 6) + 1) as Color,
    })),
  }));

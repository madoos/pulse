import type { LineChartSeries } from '@pulse/design-system';
import { formatFiscalYear } from '@shared/format';
import { valuesByMonth, type MetricKey, type MonthOf } from '@shared/metrics/metrics';

/** The chart of a metric over the months of the period. */
export type MetricChart = {
  metric: MetricKey;
  series: LineChartSeries[];
  describeMonth?: (index: number) => string | undefined;
};

export type Color = NonNullable<LineChartSeries['color']>;

/** The network or a firm, year by year: the selected year first, then the compared one. */
export type YearsOf = { years: { fiscalYear: number; months: MonthOf[] }[] };

/** The series of each year, without values: the selected one stands out, and each year keeps its colour. */
export const yearLegend = (performance: YearsOf) =>
  performance.years.map((year, index) => ({
    id: String(year.fiscalYear),
    label: formatFiscalYear(year.fiscalYear),
    color: (index + 1) as Color,
    muted: index > 0,
  }));

/** One line per year for a metric. */
export const yearSeries = (
  performance: YearsOf,
  calendarMonths: number[],
  metric: MetricKey,
): LineChartSeries[] =>
  yearLegend(performance).map((item, index) => ({
    ...item,
    values: valuesByMonth(performance.years[index]?.months ?? [], calendarMonths, metric),
  }));

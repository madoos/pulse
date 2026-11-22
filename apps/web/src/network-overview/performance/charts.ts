import type { GroupPerformance, NetworkPerformance } from '@pulse/contracts';
import { formatNumber } from '@shared/format';
import { yearSeries, type Color, type MetricChart } from '@shared/metric-cards/charts';
import { METRIC_KEYS, valuesByMonth } from '@shared/metrics/metrics';

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

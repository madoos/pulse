import type { FirmPerformance } from '@pulse/contracts';
import { Message, type LineChartSeries } from '@pulse/design-system';
import type { MetricKey } from '@shared/metrics/metrics';
import { valuesByMonth } from '@shared/metrics/metrics';
import { MetricCards } from '@shared/metric-cards/MetricCards';
import { formatNumber } from '@shared/format';

export type AgainstSpecialtyProps = {
  performance: FirmPerformance;
  specialty: string;
  metrics: MetricKey[];
  footnotes: Partial<Record<MetricKey, string>>;
  calendarMonths: number[];
};

/**
 * The firm against the average firm of the rest of its specialty, in the selected period.
 * They share the seasonality, so a gap between the lines is the firm's own doing.
 */
export const AgainstSpecialty = ({
  performance,
  specialty,
  metrics,
  footnotes,
  calendarMonths,
}: AgainstSpecialtyProps) => {
  const [selected] = performance.years;
  const others = performance.specialty;
  if (!selected) return null;
  if (others.firms === 0) {
    return <Message title={`No hay más asesorías de ${specialty} con datos en el periodo`} />;
  }
  const legend = [
    { id: 'firm', label: 'Esta asesoría', color: 1 as const, muted: false },
    {
      id: 'specialty',
      label: `Media de ${specialty} (${formatNumber(others.firms)} asesorías)`,
      color: 2 as const,
      muted: true,
    },
  ];
  const lines = [selected.months, others.months];
  return (
    <MetricCards
      performance={{
        years: [selected, { fiscalYear: selected.fiscalYear, ...others }],
      }}
      metrics={metrics}
      footnotes={footnotes}
      calendarMonths={calendarMonths}
      charts={metrics.map((metric) => ({
        metric,
        series: legend.map((item, index): LineChartSeries => ({
          ...item,
          values: valuesByMonth(lines[index] ?? [], calendarMonths, metric),
        })),
      }))}
      legend={legend}
      linesAre="una línea para la asesoría y otra para la media de su especialidad"
      referenceIs="su especialidad"
    />
  );
};

import type { FirmPerformance } from '@pulse/contracts';
import { Delta, Message, Table } from '@pulse/design-system';
import { METRICS, deltaOf, toneOf, type MetricKey } from '@shared/metrics/metrics';
import { formatMonth, formatPoints } from '@shared/format';

export type SixMonthsAgoProps = {
  comparison: FirmPerformance['sixMonthsAgo'];
  metrics: MetricKey[];
};

type Point = NonNullable<FirmPerformance['sixMonthsAgo']>['current'];

/** The change of a metric between two months: relative, or in points for a rate. */
const changeOf = (key: MetricKey, current: Point | null, previous: Point | null) => {
  const now = current?.[key] ?? null;
  const before = previous?.[key] ?? null;
  if (now === null || before === null) return null;
  if (METRICS[key].change === 'points') return now - before;
  return before === 0 ? null : (now - before) / before;
};

/** A change in its own format: "+20,0 %", or "+0,5 p.p." for a rate. */
const formatChangeOf = (key: MetricKey, change: number) =>
  METRICS[key].change === 'points'
    ? formatPoints(change)
    : deltaOf(key, 1 + change, 1)!.text.split(' · ')[0];

/** The last month of the period against six months before: is the firm doing better? */
export const SixMonthsAgo = ({ comparison, metrics }: SixMonthsAgoProps) => {
  if (!comparison) return <Message title="No hay datos en el periodo" />;
  const { current, previous } = comparison;
  if (!previous) {
    return (
      <Message title="Sin datos de hace seis meses">
        No hay datos seis meses antes de {formatMonth(current.month)}.
      </Message>
    );
  }
  return (
    <Table
      label={`${formatMonth(current.month)} frente a ${formatMonth(previous.month)}`}
      columns={[
        { id: 'metric', label: 'Indicador', isRowHeader: true },
        { id: 'current', label: formatMonth(current.month), align: 'end' },
        { id: 'previous', label: formatMonth(previous.month), align: 'end' },
        { id: 'change', label: 'Cambio', align: 'end' },
        { id: 'specialty', label: 'Su especialidad', align: 'end' },
        { id: 'gap', label: 'Diferencia', align: 'end' },
      ]}
      rows={metrics.map((key) => {
        const metric = METRICS[key];
        const delta = deltaOf(key, current[key], previous[key]);
        const own = changeOf(key, current, previous);
        const others = changeOf(key, comparison.specialty.current, comparison.specialty.previous);
        const gap = own === null || others === null ? null : own - others;
        return {
          id: key,
          cells: {
            metric: metric.label,
            current: metric.format(current[key]),
            previous: metric.format(previous[key]),
            change: delta ? (
              <Delta direction={delta.direction} tone={delta.tone}>
                {delta.text.split(' · ')[0]}
              </Delta>
            ) : (
              'n/d'
            ),
            specialty: others === null ? 'n/d' : formatChangeOf(key, others),
            gap: gap === null ? 'n/d' : <Delta {...toneOf(key, gap)}>{formatPoints(gap)}</Delta>,
          },
        };
      })}
    />
  );
};

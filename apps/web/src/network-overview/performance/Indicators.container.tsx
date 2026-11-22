import { useAppDispatch, useAppSelector } from '@app/store';
import type { NetworkFilters } from '@network-overview/networkOverview.filters';
import { SectionState } from '@shared/section-state/SectionState';
import { yearLegend } from '@shared/metric-cards/charts';
import { groupCharts, networkCharts } from './charts';
import { MetricCards } from '@shared/metric-cards/MetricCards';
import { performanceRequested } from './networkPerformance.slice';

const GROUP_NAMES = { specialty: 'especialidad', 'autonomous-community': 'comunidad autónoma' };

/** The KPIs of the network with their charts: one line per year, or per group while grouped. */
export const IndicatorsContainer = ({
  filters,
  calendarMonths,
}: {
  filters: NetworkFilters;
  calendarMonths: number[];
}) => {
  const performance = useAppSelector((state) => state.networkPerformance);
  const groups = useAppSelector((state) => state.networkGroups);
  const dispatch = useAppDispatch();
  const data = performance.data;

  // While grouped, the charts wait for the groups; the table below shows their errors.
  const grouped = filters.groupBy
    ? groups.data && groupCharts(groups.data.groups, calendarMonths)
    : null;
  const charts = filters.groupBy ? grouped : data && networkCharts(data, calendarMonths);
  const yearLines = data ? yearLegend(data) : [];
  const groupLines = (grouped?.[0]?.series ?? []).map(({ id, label, color }) => ({
    id,
    label,
    color,
  }));
  const legend = filters.groupBy ? groupLines : yearLines;
  const linesAre = filters.groupBy
    ? `una línea por ${GROUP_NAMES[filters.groupBy]}`
    : 'una línea por año';

  return (
    <SectionState
      status={performance.status}
      what="las métricas de la red"
      onRetry={() => performance.query && dispatch(performanceRequested(performance.query))}
    >
      {data && (
        <MetricCards
          performance={data}
          calendarMonths={calendarMonths}
          charts={charts ?? null}
          legend={legend}
          linesAre={linesAre}
        />
      )}
    </SectionState>
  );
};

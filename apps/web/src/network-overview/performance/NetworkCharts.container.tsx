import { useAppDispatch, useAppSelector } from '@app/store';
import { groupsRequested } from '@network-overview/groups/networkGroups.slice';
import type { NetworkFilters } from '@network-overview/networkOverview.filters';
import { SectionState } from '@network-overview/SectionState';
import { groupCharts, networkCharts } from './charts';
import { MetricCharts } from './MetricCharts';
import { performanceRequested } from './networkPerformance.slice';

const GROUP_NAMES = { specialty: 'especialidad', 'autonomous-community': 'comunidad autónoma' };

/** The monthly charts: one line per year, or one per group while the network is grouped. */
export const NetworkChartsContainer = ({
  filters,
  calendarMonths,
}: {
  filters: NetworkFilters;
  calendarMonths: number[];
}) => {
  const performance = useAppSelector((state) => state.networkPerformance);
  const groups = useAppSelector((state) => state.networkGroups);
  const dispatch = useAppDispatch();

  if (filters.groupBy) {
    return (
      <SectionState
        status={groups.status}
        what="los grupos"
        onRetry={() => groups.query && dispatch(groupsRequested(groups.query))}
      >
        {groups.data && (
          <MetricCharts
            calendarMonths={calendarMonths}
            charts={groupCharts(groups.data.groups, calendarMonths)}
            description={`una línea por ${GROUP_NAMES[filters.groupBy]}`}
          />
        )}
      </SectionState>
    );
  }
  return (
    <SectionState
      status={performance.status}
      what="los gráficos de la red"
      onRetry={() => performance.query && dispatch(performanceRequested(performance.query))}
    >
      {performance.data && (
        <MetricCharts
          calendarMonths={calendarMonths}
          charts={networkCharts(performance.data, calendarMonths)}
          description="una línea por año"
        />
      )}
    </SectionState>
  );
};

import { useAppDispatch, useAppSelector } from '@app/store';
import type { NetworkFilters } from '@network-overview/networkOverview.filters';
import { SectionState } from '@network-overview/SectionState';
import { GroupTable } from './GroupTable';
import { groupsRequested, groupsSorted } from './networkGroups.slice';

export const GroupTableContainer = ({ filters }: { filters: NetworkFilters }) => {
  const { status, query, data, sort } = useAppSelector((state) => state.networkGroups);
  const dispatch = useAppDispatch();
  if (!filters.groupBy) return null;
  return (
    <SectionState
      status={status}
      what="los grupos"
      onRetry={() => query && dispatch(groupsRequested(query))}
    >
      {data && (
        <GroupTable
          groupBy={filters.groupBy}
          groups={data.groups}
          comparedYear={filters.compareWith}
          sort={sort}
          onSortChange={(next) => dispatch(groupsSorted(next))}
        />
      )}
    </SectionState>
  );
};

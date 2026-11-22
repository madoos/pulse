import { GROUP_BY, type GroupBy, type NetworkGroupsQuery } from '@pulse/contracts';
import { describePeriod } from '@shared/period-filters/PeriodFilters';
import {
  changePeriod,
  performanceQueryOf,
  periodSearchParams,
  resolvePeriod,
  type PeriodFilters,
} from '@shared/period-filters/period.filters';

/** What the user selected in the network overview: the period, and how to group the network. */
export type NetworkFilters = PeriodFilters & { groupBy: GroupBy | null };

const isGroupBy = (value: string | null): value is GroupBy => GROUP_BY.includes(value as GroupBy);

/** Reads the filters from the URL: the period, and a grouping only if it is a known one. */
export const resolveFilters = (params: URLSearchParams, fiscalYears: number[]): NetworkFilters => {
  const group = params.get('group');
  return { ...resolvePeriod(params, fiscalYears), groupBy: isGroupBy(group) ? group : null };
};

export const changeFilters = (filters: NetworkFilters, change: Partial<NetworkFilters>) =>
  changePeriod(filters, change);

export const toSearchParams = (filters: NetworkFilters) => {
  const params = periodSearchParams(filters);
  if (filters.groupBy) params.set('group', filters.groupBy);
  return params;
};

export const groupsQueryOf = (filters: NetworkFilters): NetworkGroupsQuery | null =>
  filters.groupBy === null ? null : { ...performanceQueryOf(filters), groupBy: filters.groupBy };

const GROUP_NAMES: Record<GroupBy, string> = {
  specialty: 'especialidad',
  'autonomous-community': 'comunidad autónoma',
};

/** What the filters show, in words, with the grouping when there is one. */
export const describeFilters = (filters: NetworkFilters) =>
  describePeriod(filters, filters.groupBy ? `, por ${GROUP_NAMES[filters.groupBy]}` : '');

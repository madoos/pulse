import {
  FISCAL_MONTHS,
  GROUP_BY,
  fiscalMonthIndex,
  type GroupBy,
  type NetworkGroupsQuery,
  type NetworkPerformanceQuery,
  type PeriodQuery,
} from '@pulse/contracts';

/** What the user selected in the network overview. The URL is its source of truth. */
export type NetworkFilters = {
  fiscalYear: number;
  compareWith: number | null;
  fromMonth: number;
  toMonth: number;
  groupBy: GroupBy | null;
};

const FIRST_MONTH = 4;
const LAST_MONTH = 3;

const monthParam = (value: string | null) => {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
};

const isGroupBy = (value: string | null): value is GroupBy => GROUP_BY.includes(value as GroupBy);

/**
 * Reads the filters from the URL and fixes what is not valid: an unknown year falls back to the
 * most recent one, a comparison with the same year or an unknown one is dropped, and a range of
 * months that goes backwards becomes the whole fiscal year.
 */
export const resolveFilters = (params: URLSearchParams, fiscalYears: number[]): NetworkFilters => {
  const requested = Number(params.get('year'));
  const fiscalYear = fiscalYears.includes(requested) ? requested : (fiscalYears[0] ?? requested);
  const compare = Number(params.get('compare'));
  const compareWith = fiscalYears.includes(compare) && compare !== fiscalYear ? compare : null;
  let fromMonth = monthParam(params.get('from')) ?? FIRST_MONTH;
  let toMonth = monthParam(params.get('to')) ?? LAST_MONTH;
  if (fiscalMonthIndex(fromMonth) > fiscalMonthIndex(toMonth)) {
    fromMonth = FIRST_MONTH;
    toMonth = LAST_MONTH;
  }
  const group = params.get('group');
  return { fiscalYear, compareWith, fromMonth, toMonth, groupBy: isGroupBy(group) ? group : null };
};

/** Applies a change, keeping the filters valid. */
export const changeFilters = (
  filters: NetworkFilters,
  change: Partial<NetworkFilters>,
): NetworkFilters => {
  const next = { ...filters, ...change };
  if (next.compareWith === next.fiscalYear) next.compareWith = null;
  if (fiscalMonthIndex(next.fromMonth) > fiscalMonthIndex(next.toMonth)) {
    if (change.fromMonth !== undefined) next.toMonth = next.fromMonth;
    else next.fromMonth = next.toMonth;
  }
  return next;
};

export const toSearchParams = (filters: NetworkFilters) => {
  const params = new URLSearchParams({ year: String(filters.fiscalYear) });
  if (filters.compareWith !== null) params.set('compare', String(filters.compareWith));
  if (filters.fromMonth !== FIRST_MONTH) params.set('from', String(filters.fromMonth));
  if (filters.toMonth !== LAST_MONTH) params.set('to', String(filters.toMonth));
  if (filters.groupBy) params.set('group', filters.groupBy);
  return params;
};

/** The calendar months of the selected period, in fiscal order. */
export const monthsOfPeriod = ({
  fromMonth,
  toMonth,
}: Pick<NetworkFilters, 'fromMonth' | 'toMonth'>) =>
  FISCAL_MONTHS.slice(fiscalMonthIndex(fromMonth), fiscalMonthIndex(toMonth) + 1);

export const periodQueryOf = (filters: NetworkFilters): PeriodQuery => ({
  fiscalYear: filters.fiscalYear,
  fromMonth: filters.fromMonth,
  toMonth: filters.toMonth,
});

export const performanceQueryOf = (filters: NetworkFilters): NetworkPerformanceQuery => ({
  ...periodQueryOf(filters),
  ...(filters.compareWith === null ? {} : { compareWith: filters.compareWith }),
});

export const groupsQueryOf = (filters: NetworkFilters): NetworkGroupsQuery | null =>
  filters.groupBy === null ? null : { ...performanceQueryOf(filters), groupBy: filters.groupBy };

/** Two queries ask for the same data. */
export const sameQuery = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

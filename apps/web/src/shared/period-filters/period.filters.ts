import {
  FISCAL_MONTHS,
  fiscalMonthIndex,
  type NetworkPerformanceQuery,
  type PeriodQuery,
} from '@pulse/contracts';

/** The period selected and the year to compare it with. The URL is its source of truth. */
export type PeriodFilters = {
  fiscalYear: number;
  compareWith: number | null;
  fromMonth: number;
  toMonth: number;
};

const FIRST_MONTH = 4;
const LAST_MONTH = 3;

const monthParam = (value: string | null) => {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
};

/**
 * Reads the period from the URL and fixes what is not valid: an unknown year falls back to the
 * most recent one, a comparison with the same year or an unknown one is dropped, and a range of
 * months that goes backwards becomes the whole fiscal year.
 */
export const resolvePeriod = (params: URLSearchParams, fiscalYears: number[]): PeriodFilters => {
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
  return { fiscalYear, compareWith, fromMonth, toMonth };
};

/** Applies a change, keeping the period valid. Any other filter is kept as it comes. */
export const changePeriod = <T extends PeriodFilters>(filters: T, change: Partial<T>): T => {
  const next = { ...filters, ...change };
  if (next.compareWith === next.fiscalYear) next.compareWith = null;
  if (fiscalMonthIndex(next.fromMonth) > fiscalMonthIndex(next.toMonth)) {
    if (change.fromMonth !== undefined) next.toMonth = next.fromMonth;
    else next.fromMonth = next.toMonth;
  }
  return next;
};

/** The period as URL parameters, leaving out what is the default. */
export const periodSearchParams = (filters: PeriodFilters) => {
  const params = new URLSearchParams({ year: String(filters.fiscalYear) });
  if (filters.compareWith !== null) params.set('compare', String(filters.compareWith));
  if (filters.fromMonth !== FIRST_MONTH) params.set('from', String(filters.fromMonth));
  if (filters.toMonth !== LAST_MONTH) params.set('to', String(filters.toMonth));
  return params;
};

/** The calendar months of the selected period, in fiscal order. */
export const monthsOfPeriod = ({
  fromMonth,
  toMonth,
}: Pick<PeriodFilters, 'fromMonth' | 'toMonth'>) =>
  FISCAL_MONTHS.slice(fiscalMonthIndex(fromMonth), fiscalMonthIndex(toMonth) + 1);

export const periodQueryOf = (filters: PeriodFilters): PeriodQuery => ({
  fiscalYear: filters.fiscalYear,
  fromMonth: filters.fromMonth,
  toMonth: filters.toMonth,
});

export const performanceQueryOf = (filters: PeriodFilters): NetworkPerformanceQuery => ({
  ...periodQueryOf(filters),
  ...(filters.compareWith === null ? {} : { compareWith: filters.compareWith }),
});

/** Two queries ask for the same data. */
export const sameQuery = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

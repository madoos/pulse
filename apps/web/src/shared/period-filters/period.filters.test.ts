import { describe, expect, it } from 'vitest';
import {
  changePeriod,
  monthsOfPeriod,
  performanceQueryOf,
  periodSearchParams,
  resolvePeriod,
  sameQuery,
  type PeriodFilters,
} from './period.filters';

const years = [2025, 2024, 2023];
const resolve = (search: string) => resolvePeriod(new URLSearchParams(search), years);

const period: PeriodFilters = { fiscalYear: 2025, compareWith: null, fromMonth: 4, toMonth: 3 };

describe('period filters', () => {
  it('selects the most recent year and the whole fiscal year by default, with no comparison', () => {
    expect(resolve('')).toEqual(period);
  });

  it('reads the period from the URL', () => {
    expect(resolve('year=2024&compare=2023&from=4&to=6')).toEqual({
      fiscalYear: 2024,
      compareWith: 2023,
      fromMonth: 4,
      toMonth: 6,
    });
  });

  it('drops what is not valid', () => {
    expect(resolve('year=1990&compare=2025&from=6&to=4')).toEqual(period);
  });

  it('resets the comparison when the selected year becomes the compared one', () => {
    expect(
      changePeriod({ ...period, compareWith: 2024 }, { fiscalYear: 2024 }).compareWith,
    ).toBeNull();
  });

  it('keeps the range of months in order', () => {
    const range = { ...period, fromMonth: 5, toMonth: 6 };

    expect(changePeriod(range, { fromMonth: 9 })).toMatchObject({ fromMonth: 9, toMonth: 9 });
    expect(changePeriod(range, { toMonth: 4 })).toMatchObject({ fromMonth: 4, toMonth: 4 });
  });

  it('keeps any other filter as it comes', () => {
    expect(changePeriod({ ...period, other: 'kept' }, { toMonth: 6 }).other).toBe('kept');
  });

  it('writes only what differs from the defaults to the URL', () => {
    expect(periodSearchParams(period).toString()).toBe('year=2025');
    expect(periodSearchParams({ ...period, compareWith: 2024, toMonth: 6 }).toString()).toBe(
      'year=2025&compare=2024&to=6',
    );
  });

  it('lists the months of the period in fiscal order', () => {
    expect(monthsOfPeriod({ fromMonth: 11, toMonth: 2 })).toEqual([11, 12, 1, 2]);
    expect(monthsOfPeriod(period)).toHaveLength(12);
  });

  it('builds the query of the period, with the compared year only when there is one', () => {
    expect(performanceQueryOf(period)).toEqual({ fiscalYear: 2025, fromMonth: 4, toMonth: 3 });
    expect(performanceQueryOf({ ...period, compareWith: 2024 })).toMatchObject({
      compareWith: 2024,
    });
  });

  it('tells whether two queries ask for the same data', () => {
    expect(sameQuery(performanceQueryOf(period), performanceQueryOf(period))).toBe(true);
    expect(
      sameQuery(performanceQueryOf(period), { ...performanceQueryOf(period), fiscalYear: 2024 }),
    ).toBe(false);
  });
});

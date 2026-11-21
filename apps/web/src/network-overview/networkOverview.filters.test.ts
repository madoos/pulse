import { describe, expect, it } from 'vitest';
import {
  changeFilters,
  groupsQueryOf,
  monthsOfPeriod,
  performanceQueryOf,
  resolveFilters,
  toSearchParams,
  type NetworkFilters,
} from './networkOverview.filters';

const years = [2025, 2024, 2023];
const resolve = (search: string) => resolveFilters(new URLSearchParams(search), years);

const filters: NetworkFilters = {
  fiscalYear: 2025,
  compareWith: null,
  fromMonth: 4,
  toMonth: 3,
  groupBy: null,
};

describe('network filters', () => {
  it('selects the most recent year and the whole fiscal year by default, with no comparison', () => {
    expect(resolve('')).toEqual(filters);
  });

  it('reads every filter from the URL', () => {
    expect(resolve('year=2024&compare=2023&from=4&to=6&group=specialty')).toEqual({
      fiscalYear: 2024,
      compareWith: 2023,
      fromMonth: 4,
      toMonth: 6,
      groupBy: 'specialty',
    });
  });

  it('drops what is not valid', () => {
    expect(resolve('year=1990&compare=2025&from=6&to=4&group=city')).toEqual(filters);
  });

  it('resets the comparison when the selected year becomes the compared one', () => {
    expect(
      changeFilters({ ...filters, compareWith: 2024 }, { fiscalYear: 2024 }).compareWith,
    ).toBeNull();
  });

  it('keeps the range of months in order', () => {
    const range = { ...filters, fromMonth: 5, toMonth: 6 };

    expect(changeFilters(range, { fromMonth: 9 })).toMatchObject({ fromMonth: 9, toMonth: 9 });
    expect(changeFilters(range, { toMonth: 4 })).toMatchObject({ fromMonth: 4, toMonth: 4 });
  });

  it('writes only what differs from the defaults to the URL', () => {
    expect(toSearchParams(filters).toString()).toBe('year=2025');
    expect(
      toSearchParams({
        ...filters,
        compareWith: 2024,
        toMonth: 6,
        groupBy: 'autonomous-community',
      }).toString(),
    ).toBe('year=2025&compare=2024&to=6&group=autonomous-community');
  });

  it('lists the months of the period in fiscal order', () => {
    expect(monthsOfPeriod({ fromMonth: 11, toMonth: 2 })).toEqual([11, 12, 1, 2]);
    expect(monthsOfPeriod(filters)).toHaveLength(12);
  });

  it('builds the queries of each section', () => {
    expect(performanceQueryOf(filters)).toEqual({ fiscalYear: 2025, fromMonth: 4, toMonth: 3 });
    expect(groupsQueryOf(filters)).toBeNull();
    expect(groupsQueryOf({ ...filters, compareWith: 2024, groupBy: 'specialty' })).toEqual({
      fiscalYear: 2025,
      compareWith: 2024,
      fromMonth: 4,
      toMonth: 3,
      groupBy: 'specialty',
    });
  });
});

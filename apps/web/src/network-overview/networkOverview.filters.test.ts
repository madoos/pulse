import { describe, expect, it } from 'vitest';
import {
  changeFilters,
  describeFilters,
  groupsQueryOf,
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
  it('reads the period and the grouping from the URL', () => {
    expect(resolve('year=2024&compare=2023&to=6&group=specialty')).toEqual({
      fiscalYear: 2024,
      compareWith: 2023,
      fromMonth: 4,
      toMonth: 6,
      groupBy: 'specialty',
    });
  });

  it('drops an unknown grouping', () => {
    expect(resolve('group=city')).toEqual(filters);
  });

  it('keeps the grouping when the period changes', () => {
    expect(changeFilters({ ...filters, groupBy: 'specialty' }, { toMonth: 6 }).groupBy).toBe(
      'specialty',
    );
  });

  it('writes the grouping to the URL after the period', () => {
    expect(
      toSearchParams({ ...filters, compareWith: 2024, groupBy: 'autonomous-community' }).toString(),
    ).toBe('year=2025&compare=2024&group=autonomous-community');
  });

  it('asks for groups only when there is a grouping', () => {
    expect(groupsQueryOf(filters)).toBeNull();
    expect(groupsQueryOf({ ...filters, compareWith: 2024, groupBy: 'specialty' })).toEqual({
      fiscalYear: 2025,
      compareWith: 2024,
      fromMonth: 4,
      toMonth: 3,
      groupBy: 'specialty',
    });
  });

  it('says in words what is shown, with the grouping', () => {
    expect(describeFilters({ ...filters, groupBy: 'specialty' })).toBe(
      'Estás viendo todo el año 2025-26, sin comparar con otro año, por especialidad.',
    );
  });
});

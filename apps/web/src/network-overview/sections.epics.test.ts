import type { NetworkGroups, NetworkHighlights, NetworkPerformance } from '@pulse/contracts';
import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { throwError } from 'rxjs';
import { describe, it } from 'vitest';
import { requestGroupsEpic, loadGroupsEpic } from './groups/networkGroups.epics';
import { groupsFailed, groupsLoaded, groupsRequested } from './groups/networkGroups.slice';
import { loadHighlightsEpic, requestHighlightsEpic } from './highlights/networkHighlights.epics';
import { highlightsLoaded, highlightsRequested } from './highlights/networkHighlights.slice';
import type { NetworkFilters } from './networkOverview.filters';
import { networkFiltersChanged } from './networkOverview.slice';
import {
  loadPerformanceEpic,
  requestPerformanceEpic,
} from './performance/networkPerformance.epics';
import { performanceLoaded, performanceRequested } from './performance/networkPerformance.slice';

const filters: NetworkFilters = {
  fiscalYear: 2025,
  compareWith: null,
  fromMonth: 4,
  toMonth: 3,
  groupBy: null,
};
const period = { fiscalYear: 2025, fromMonth: 4, toMonth: 3 };
const grouped = { ...filters, groupBy: 'specialty' as const };
const compared = { ...filters, compareWith: 2024 };

const changed = (marbles: string, values: Record<string, NetworkFilters>) => ({
  marbles,
  values: Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, networkFiltersChanged(value)]),
  ),
});

describe('requesting each section', () => {
  it('reloads the network when the period or the comparison changes, not when grouping', () => {
    expectEpic(requestPerformanceEpic, {
      api: () => createFakeApi(),
      actions: changed('-a-g-c', { a: filters, g: grouped, c: compared }),
      expected: {
        marbles: '-a---c',
        values: {
          a: performanceRequested(period),
          c: performanceRequested({ ...period, compareWith: 2024 }),
        },
      },
    });
  });

  it('loads the groups only while grouped', () => {
    expectEpic(requestGroupsEpic, {
      api: () => createFakeApi(),
      actions: changed('-a-g-c', { a: filters, g: grouped, c: { ...grouped, compareWith: 2024 } }),
      expected: {
        marbles: '---g-c',
        values: {
          g: groupsRequested({ ...period, groupBy: 'specialty' }),
          c: groupsRequested({ ...period, compareWith: 2024, groupBy: 'specialty' }),
        },
      },
    });
  });

  it('reloads the highlights only when the period changes', () => {
    expectEpic(requestHighlightsEpic, {
      api: () => createFakeApi(),
      actions: changed('-a-g-c-m', {
        a: filters,
        g: grouped,
        c: compared,
        m: { ...filters, toMonth: 6 },
      }),
      expected: {
        marbles: '-a-----m',
        values: {
          a: highlightsRequested(period),
          m: highlightsRequested({ ...period, toMonth: 6 }),
        },
      },
    });
  });
});

describe('loading each section', () => {
  const performance: NetworkPerformance = { years: [] };
  const groups: NetworkGroups = { groups: [] };
  const highlights: NetworkHighlights = {
    previousFiscalYear: 2024,
    needsAttention: [],
    standouts: [],
  };

  it('loads the network and cancels a stale request', () => {
    expectEpic(loadPerformanceEpic, {
      api: (cold) =>
        createFakeApi({ network: { performance: () => cold('---p', { p: performance }) } }),
      actions: { marbles: '-a-a', values: { a: performanceRequested(period) } },
      expected: { marbles: '------b', values: { b: performanceLoaded(performance) } },
    });
  });

  it('loads the groups and reports a failure', () => {
    expectEpic(loadGroupsEpic, {
      api: (cold) => createFakeApi({ network: { groups: () => cold('-g', { g: groups }) } }),
      actions: {
        marbles: '-a',
        values: { a: groupsRequested({ ...period, groupBy: 'specialty' }) },
      },
      expected: { marbles: '--b', values: { b: groupsLoaded(groups) } },
    });
    expectEpic(loadGroupsEpic, {
      api: () => createFakeApi({ network: { groups: () => throwError(() => new Error('down')) } }),
      actions: {
        marbles: '-a',
        values: { a: groupsRequested({ ...period, groupBy: 'specialty' }) },
      },
      expected: { marbles: '-b', values: { b: groupsFailed() } },
    });
  });

  it('loads the highlights', () => {
    expectEpic(loadHighlightsEpic, {
      api: (cold) =>
        createFakeApi({ network: { highlights: () => cold('-h', { h: highlights }) } }),
      actions: { marbles: '-a', values: { a: highlightsRequested(period) } },
      expected: { marbles: '--b', values: { b: highlightsLoaded(highlights) } },
    });
  });
});

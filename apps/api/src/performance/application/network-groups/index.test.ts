import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';
import { describe, expect, it } from 'vitest';
import { makeGetNetworkGroups } from '.';

const totals = (groupKey: string, month: string, revenueCents: number) => ({
  groupKey,
  month,
  firms: 1,
  activeClients: 100,
  churnedClients: 2,
  revenueCents,
});

const repository = {
  groups: async () => [
    { key: 'fiscal', name: 'Fiscal', firms: 24 },
    { key: 'laboral', name: 'Laboral', firms: 10 },
  ],
  monthlyTotalsByGroup: async () => [
    totals('fiscal', '2025-04', 786_000_000),
    totals('laboral', '2025-04', 410_000_000),
    totals('laboral', '2024-04', 400_000_000),
  ],
} as unknown as NetworkPerformanceRepository;

describe('getNetworkGroups', () => {
  it('summarizes each group with its revenue per firm and its change', async () => {
    const { groups } = await makeGetNetworkGroups({ repository })({
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 4,
      compareWith: 2024,
      groupBy: 'specialty',
    });

    expect(groups.map((g) => [g.key, g.revenuePerFirm, g.revenueChange])).toEqual([
      ['fiscal', 327_500, null],
      ['laboral', 410_000, 0.025],
    ]);
    expect(groups[1]?.months.map((m) => m.month)).toEqual(['2025-04']);
  });

  it('has no change without a compared year', async () => {
    const { groups } = await makeGetNetworkGroups({ repository })({
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 4,
      groupBy: 'specialty',
    });

    expect(groups.every((g) => g.revenueChange === null)).toBe(true);
  });
});

import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';
import type { MonthlyTotals } from '@performance/domain/Totals';
import { describe, expect, it, vi } from 'vitest';
import { makeGetNetworkPerformance } from '.';

const row = (month: string, activeClients: number, revenueCents: number): MonthlyTotals => ({
  month,
  firms: 50,
  activeClients,
  churnedClients: 0,
  revenueCents,
});

const repositoryWith = (rows: MonthlyTotals[]) => {
  const monthlyTotals = vi.fn<NetworkPerformanceRepository['monthlyTotals']>(async () => rows);
  return { monthlyTotals } as unknown as NetworkPerformanceRepository & {
    monthlyTotals: typeof monthlyTotals;
  };
};

describe('getNetworkPerformance', () => {
  it('returns the selected year month by month with its summary', async () => {
    const repository = repositoryWith([row('2025-05', 120, 600_000), row('2025-04', 100, 400_000)]);

    const result = await makeGetNetworkPerformance({ repository })({
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 5,
    });

    expect(repository.monthlyTotals).toHaveBeenCalledWith([
      { fiscalYear: 2025, fromMonth: 4, toMonth: 5 },
    ]);
    expect(result.years).toHaveLength(1);
    expect(result.years[0]?.months.map((m) => m.month)).toEqual(['2025-04', '2025-05']);
    expect(result.years[0]?.summary).toMatchObject({ activeClients: 120, revenue: 10_000 });
  });

  it('adds the same months of the compared year', async () => {
    const repository = repositoryWith([row('2025-04', 100, 400_000), row('2024-04', 80, 300_000)]);

    const result = await makeGetNetworkPerformance({ repository })({
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 4,
      compareWith: 2024,
    });

    expect(result.years.map((y) => [y.fiscalYear, y.summary.activeClients])).toEqual([
      [2025, 100],
      [2024, 80],
    ]);
  });
});

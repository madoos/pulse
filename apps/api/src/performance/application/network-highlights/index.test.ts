import type { FirmPeriod } from '@performance/domain/Highlights';
import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';
import type { PeriodTotals } from '@performance/domain/Totals';
import { describe, expect, it, vi } from 'vitest';
import { makeGetNetworkHighlights } from '.';

const totals = (lastMonth: string, lastMonthActiveClients: number): PeriodTotals => ({
  lastMonth,
  lastMonthActiveClients,
  activeClientsSum: 1200,
  monthsWithData: 12,
  churnedClients: 18,
  revenueCents: 24_000_000,
});

const firmPeriod = (id: number, current: number, previous: number | null): FirmPeriod => ({
  firm: { id, name: `Firm ${id}`, specialty: 'Fiscal', province: 'Madrid' },
  current: totals('2026-03', current),
  previous: previous === null ? null : totals('2025-03', previous),
});

const repositoryWith = (fiscalYears: number[], firms: FirmPeriod[]) => {
  const firmPeriods = vi.fn<NetworkPerformanceRepository['firmPeriods']>(async () => firms);
  return {
    repository: {
      fiscalYears: async () => fiscalYears,
      firmPeriods,
    } as unknown as NetworkPerformanceRepository,
    firmPeriods,
  };
};

const period = { fiscalYear: 2025, fromMonth: 4, toMonth: 3 };

describe('getNetworkHighlights', () => {
  it('compares with the previous fiscal year', async () => {
    const { repository, firmPeriods } = repositoryWith(
      [2025, 2024],
      [firmPeriod(1, 90, 100), firmPeriod(2, 130, 100)],
    );

    const result = await makeGetNetworkHighlights({ repository })(period);

    expect(firmPeriods).toHaveBeenCalledWith(period, 2024);
    expect(result.previousFiscalYear).toBe(2024);
    expect(result.needsAttention.map((f) => f.firm.id)).toEqual([1]);
    expect(result.standouts.map((s) => s.firm.id)).toEqual([2, 1]);
  });

  it('has no standouts in the first fiscal year', async () => {
    const { repository, firmPeriods } = repositoryWith([2025], [firmPeriod(1, 90, null)]);

    const result = await makeGetNetworkHighlights({ repository })(period);

    expect(firmPeriods).toHaveBeenCalledWith(period, null);
    expect(result).toEqual({ previousFiscalYear: null, needsAttention: [], standouts: [] });
  });
});

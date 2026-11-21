import { describe, expect, it } from 'vitest';
import { changeOf, pointOf, summarize, totalsOf, type MonthlyTotals } from './Totals';

const month = (overrides: Partial<MonthlyTotals>): MonthlyTotals => ({
  month: '2025-04',
  firms: 2,
  activeClients: 1000,
  churnedClients: 10,
  revenueCents: 20_000_000,
  ...overrides,
});

describe('Totals', () => {
  it('takes the active clients of the last month of the period', () => {
    const totals = totalsOf([
      month({ month: '2026-03', activeClients: 8000 }),
      month({ month: '2025-04', activeClients: 7000 }),
    ]);

    expect(summarize(totals).activeClients).toBe(8000);
  });

  it('calculates revenue per client and mean monthly churn of a period', () => {
    const totals = totalsOf([
      month({
        month: '2025-04',
        activeClients: 1000,
        churnedClients: 10,
        revenueCents: 20_000_000,
      }),
      month({
        month: '2025-05',
        activeClients: 1000,
        churnedClients: 30,
        revenueCents: 22_000_000,
      }),
    ]);

    expect(summarize(totals)).toEqual({
      activeClients: 1000,
      revenue: 420_000,
      revenuePerClient: 420,
      churnRate: 0.02,
    });
  });

  it('summarizes a period without data as empty', () => {
    expect(summarize(totalsOf([]))).toEqual({
      activeClients: 0,
      revenue: 0,
      revenuePerClient: null,
      churnRate: null,
    });
  });

  it('calculates the metrics of one month with the firms that have data', () => {
    expect(pointOf(month({ firms: 49, activeClients: 400, revenueCents: 3_500_000 }))).toEqual({
      month: '2025-04',
      firmsWithData: 49,
      activeClients: 400,
      revenue: 35_000,
      revenuePerClient: 87.5,
      churnRate: 0.025,
    });
  });

  it('calculates a change only against a reference that is not zero', () => {
    expect(changeOf(16_600_000, 13_700_000)).toBeCloseTo(0.2117, 4);
    expect(changeOf(5, 0)).toBeNull();
    expect(changeOf(5, null)).toBeNull();
    expect(changeOf(null, 5)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  alertsOf,
  needingAttention,
  networkChurnRateOf,
  standoutsOf,
  type FirmPeriod,
} from './Highlights';
import type { PeriodTotals } from './Totals';

const totals = (overrides: Partial<PeriodTotals> = {}): PeriodTotals => ({
  lastMonth: '2026-03',
  lastMonthActiveClients: 200,
  activeClientsSum: 2400,
  monthsWithData: 12,
  churnedClients: 36,
  revenueCents: 48_000_000,
  ...overrides,
});

const previousYear = (overrides: Partial<PeriodTotals> = {}) =>
  totals({ lastMonth: '2025-03', ...overrides });

let nextId = 1;
const firm = (
  current: PeriodTotals | null,
  previous: PeriodTotals | null = previousYear(),
  name = `Firm ${nextId}`,
): FirmPeriod => ({
  firm: { id: nextId++, name, specialty: 'Fiscal', province: 'Madrid' },
  current,
  previous,
});

const context = { lastMonth: '2026-03', networkChurnRate: 0.015 };

const typesOf = (f: FirmPeriod) => alertsOf(f, context).map((a) => a.type);

describe('alertsOf', () => {
  it('raises no alert for a firm doing as well as last year', () => {
    expect(alertsOf(firm(totals()), context)).toEqual([]);
  });

  it('detects a firm losing clients against the same month of the previous year', () => {
    const alerts = alertsOf(
      firm(totals({ lastMonthActiveClients: 238 }), previousYear({ lastMonthActiveClients: 248 })),
      context,
    );

    expect(alerts).toEqual([{ type: 'losing-clients', value: 238, reference: 248 }]);
  });

  it('detects a churn of 1.5 times the network or more', () => {
    expect(typesOf(firm(totals({ churnedClients: 54 })))).toEqual(['high-churn']);
    expect(typesOf(firm(totals({ churnedClients: 53 })))).toEqual([]);
  });

  it('detects falling revenue against the same months of the previous year', () => {
    const alerts = alertsOf(
      firm(totals({ revenueCents: 30_000_000 }), previousYear({ revenueCents: 32_000_000 })),
      context,
    );

    expect(alerts).toContainEqual({ type: 'falling-revenue', value: 300_000, reference: 320_000 });
  });

  it('detects revenue per client 10 % or more below the previous year', () => {
    const losing = firm(totals({ revenueCents: 43_200_000 }));
    const fine = firm(totals({ revenueCents: 43_300_000 }));

    expect(typesOf(losing)).toEqual(['falling-revenue', 'losing-value']);
    expect(typesOf(fine)).toEqual(['falling-revenue']);
  });

  it('detects a firm without data for the last month', () => {
    expect(typesOf(firm(totals({ lastMonth: '2026-02' })))).toEqual(['missing-data']);
    expect(alertsOf(firm(null), context)).toEqual([
      { type: 'missing-data', value: null, reference: null },
    ]);
  });

  it('only applies the alerts that need no previous year in the first year', () => {
    expect(typesOf(firm(totals({ churnedClients: 100 }), null))).toEqual(['high-churn']);
  });
});

describe('needingAttention', () => {
  it('lists the firms with alerts, the ones with more alerts first', () => {
    const highChurn = firm(totals({ churnedClients: 100 }), previousYear(), 'A');
    const fine = firm(totals(), previousYear(), 'B');
    const twoAlerts = firm(
      totals({ lastMonthActiveClients: 100, revenueCents: 10_000_000 }),
      previousYear(),
      'C',
    );

    const result = needingAttention([highChurn, fine, twoAlerts]);

    expect(result.map((f) => f.firm.name)).toEqual(['C', 'A']);
  });

  it('measures churn against the whole network', () => {
    const firms = [firm(totals({ churnedClients: 10 })), firm(totals({ churnedClients: 30 }))];

    expect(networkChurnRateOf(firms)).toBeCloseTo(40 / 4800);
  });
});

describe('standoutsOf', () => {
  it('ranks the firms that grow the most in clients', () => {
    const growing = (clients: number, name: string) =>
      firm(
        totals({ lastMonthActiveClients: clients }),
        previousYear({ lastMonthActiveClients: 100 }),
        name,
      );
    const firms = ['A', 'B', 'C', 'D', 'E', 'F'].map((name, i) => growing(110 + i * 10, name));

    const result = standoutsOf(firms);

    expect(result.map((s) => s.firm.name)).toEqual(['F', 'E', 'D', 'C']);
    expect(result[0]?.clientGrowth).toBeCloseTo(0.6);
  });

  it('leaves out the firms without data in the previous year', () => {
    expect(standoutsOf([firm(totals(), null)])).toEqual([]);
  });
});

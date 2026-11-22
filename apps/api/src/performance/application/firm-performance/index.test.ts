import type {
  FirmMonthlyTotals,
  FirmPerformanceRepository,
  SpecialtyMonthlyTotals,
} from '@performance/domain/FirmPerformanceRepository';
import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';
import { describe, expect, it, vi } from 'vitest';
import { makeGetFirmPerformance } from '.';

const month = (m: string, activeClients: number, revenueCents: number): FirmMonthlyTotals => ({
  month: m,
  firms: 1,
  activeClients,
  churnedClients: 2,
  revenueCents,
  taxFilings: 10,
  taxAgencyIncidents: 1,
});

const totals = (lastMonth: string, lastMonthActiveClients: number, revenueCents: number) => ({
  lastMonth,
  lastMonthActiveClients,
  activeClientsSum: lastMonthActiveClients,
  monthsWithData: 1,
  churnedClients: 1,
  revenueCents,
});

const network = {
  fiscalYears: async () => [2025, 2024],
  firmPeriods: async () => [
    {
      firm: { id: 7, name: 'A', specialty: 'Fiscal', province: 'Madrid' },
      current: totals('2026-03', 90, 1_000_000),
      previous: totals('2025-03', 100, 1_000_000),
    },
    {
      firm: { id: 8, name: 'B', specialty: 'Fiscal', province: 'Madrid' },
      current: totals('2026-03', 100, 1_000_000),
      previous: totals('2025-03', 100, 1_000_000),
    },
  ],
} as unknown as NetworkPerformanceRepository;

const others = (
  m: string,
  firms: number,
  activeClients: number,
  revenueCents: number,
): SpecialtyMonthlyTotals => ({
  month: m,
  firms,
  activeClients,
  churnedClients: 4,
  revenueCents,
  taxFilings: 20,
  taxAgencyIncidents: 2,
  employees: 10 * firms,
});

const setUp = (
  rows: FirmMonthlyTotals[],
  employees: number | null = 10,
  specialty: SpecialtyMonthlyTotals[] = [],
) => {
  const repository = {
    monthlyTotals: vi.fn(async (_firmId: number, months: string[]) =>
      rows.filter((row) => months.includes(row.month)),
    ),
    specialtyTotals: vi.fn(async (_firmId: number, months: string[]) =>
      specialty.filter((row) => months.includes(row.month)),
    ),
    employees: vi.fn(async () => employees),
  } satisfies FirmPerformanceRepository;
  return { repository, getFirmPerformance: makeGetFirmPerformance({ repository, network }) };
};

describe('getFirmPerformance', () => {
  it('measures the firm month by month, with its tax filings, against the compared year', async () => {
    const { repository, getFirmPerformance } = setUp([
      month('2025-04', 100, 1_000_000),
      month('2025-05', 110, 1_200_000),
      month('2024-04', 90, 900_000),
    ]);

    const { years } = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 5,
      compareWith: 2024,
    });

    expect(repository.monthlyTotals).toHaveBeenCalledWith(7, [
      '2025-04',
      '2025-05',
      '2024-04',
      '2024-05',
    ]);
    expect(years.map((y) => [y.fiscalYear, y.summary.activeClients, y.summary.revenue])).toEqual([
      [2025, 110, 22_000],
      [2024, 90, 9_000],
    ]);
    expect(years[0]?.summary.taxFilings).toBe(20);
    expect(years[0]?.months[1]).toEqual({
      month: '2025-05',
      activeClients: 110,
      revenue: 12_000,
      revenuePerClient: 12_000 / 110,
      churnRate: 2 / 110,
      taxFilings: 10,
      revenuePerEmployee: 1_200,
      incidentRate: 0.1,
    });
    expect(years[0]?.summary.incidentRate).toBeCloseTo(0.1);
    expect(years[0]?.summary.revenuePerEmployee).toBe(2_200);
  });

  it('compares the last month with data with six months before', async () => {
    const { getFirmPerformance } = setUp([
      month('2025-09', 100, 1_000_000),
      month('2026-02', 120, 1_500_000),
      month('2025-08', 95, 900_000),
    ]);

    const { sixMonthsAgo } = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
    });

    expect(sixMonthsAgo?.current.month).toBe('2026-02');
    expect(sixMonthsAgo?.previous?.month).toBe('2025-08');
  });

  it('sets the firm against the average firm of the rest of its specialty', async () => {
    const { repository, getFirmPerformance } = setUp(
      [month('2025-09', 100, 1_000_000), month('2026-03', 120, 1_500_000)],
      10,
      [
        others('2025-09', 2, 200, 1_600_000),
        others('2026-03', 4, 480, 4_000_000),
        others('2025-04', 2, 180, 1_400_000),
      ],
    );

    const { specialty, sixMonthsAgo } = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
      compareWith: 2024,
    });

    expect(repository.specialtyTotals).toHaveBeenCalledWith(7, expect.arrayContaining(['2025-04']));
    expect(repository.specialtyTotals).not.toHaveBeenCalledWith(
      7,
      expect.arrayContaining(['2024-04']),
    );
    expect(specialty.firms).toBe(4);
    expect(specialty.months.map((m) => [m.month, m.activeClients, m.revenue])).toEqual([
      ['2025-04', 90, 7_000],
      ['2025-09', 100, 8_000],
      ['2026-03', 120, 10_000],
    ]);
    expect(specialty.months[2]).toMatchObject({
      taxFilings: 5,
      revenuePerEmployee: 1_000,
      incidentRate: 0.1,
    });
    expect(specialty.summary).toMatchObject({ activeClients: 120, revenue: 25_000 });
    expect(specialty.summary.revenuePerEmployee).toBe(2_500);
    expect(sixMonthsAgo?.specialty.current?.revenue).toBe(10_000);
    expect(sixMonthsAgo?.specialty.previous?.revenue).toBe(8_000);
  });

  it('has no specialty to compare with when it is the only firm of it', async () => {
    const { getFirmPerformance } = setUp([month('2026-03', 120, 1_500_000)]);

    const { specialty, sixMonthsAgo } = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
    });

    expect(specialty).toMatchObject({ firms: 0, months: [] });
    expect(specialty.summary.revenuePerEmployee).toBeNull();
    expect(sixMonthsAgo?.specialty).toEqual({ current: null, previous: null });
  });

  it('has nothing to compare without data in the period', async () => {
    const { getFirmPerformance } = setUp([]);

    const result = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
    });

    expect(result.sixMonthsAgo).toBeNull();
    expect(result.years[0]?.months).toEqual([]);
  });

  it('has no incident rate without tax filings', async () => {
    const { getFirmPerformance } = setUp([{ ...month('2025-04', 100, 1_000_000), taxFilings: 0 }]);

    const { years } = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 4,
    });

    expect(years[0]?.summary.incidentRate).toBeNull();
    expect(years[0]?.months[0]?.incidentRate).toBeNull();
  });

  it('has no revenue per employee without employees', async () => {
    const { getFirmPerformance } = setUp([month('2025-04', 100, 1_000_000)], 0);

    const { years } = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 4,
    });

    expect(years[0]?.summary.revenuePerEmployee).toBeNull();
  });

  it('raises the alerts of the firm by the rules of the network, against the previous year', async () => {
    const { getFirmPerformance } = setUp([]);

    const result = await getFirmPerformance({
      firmId: 7,
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
    });

    expect(result.alertsComparedWith).toBe(2024);
    expect(result.alerts.map((a) => a.type)).toEqual(['losing-clients']);
  });
});

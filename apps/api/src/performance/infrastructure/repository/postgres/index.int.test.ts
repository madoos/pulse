import {
  advisoryFirms,
  autonomousCommunities,
  provinces,
  specialties,
} from '@advisory-firms/infrastructure/repository/postgres/schema';
import { startTestDatabase } from '@shared/infrastructure/database/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPostgresFirmPerformanceRepository,
  createPostgresNetworkPerformanceRepository,
} from '.';
import { monthlyMetrics } from './schema';

const metric = (firmId: number, month: string, activeClients: number, revenueCents: number) => ({
  firmId,
  month: `${month}-01`,
  activeClients,
  newClients: 0,
  churnedClients: 2,
  filingsIncomeTax: 0,
  filingsVat: 0,
  filingsCorporateTax: 0,
  filingsOther: 0,
  revenueAdvisory: revenueCents,
  revenueManagement: 0,
  revenueConsulting: 0,
  hoursWorked: 0,
  queriesReceived: 0,
  queriesResolved: 0,
  taxAgencyIncidents: 0,
  documentsProcessed: 0,
  satisfaction: 4.5,
});

const firm = (id: number, name: string, provinceId: number, specialtyCode: string) => ({
  id,
  name,
  taxId: `B0000000${id}`,
  provinceId,
  city: 'City',
  specialtyCode,
  onboardedOn: '2020-01-01',
  employees: 5,
});

describe('Postgres network performance repository', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;
  let repository: ReturnType<typeof createPostgresNetworkPerformanceRepository>;

  beforeAll(async () => {
    database = await startTestDatabase();
    const { db } = database;
    await db.insert(autonomousCommunities).values([
      { id: 13, name: 'Madrid, Comunidad de' },
      { id: 1, name: 'Andalucía' },
    ]);
    await db.insert(provinces).values([
      { id: 28, name: 'Madrid', autonomousCommunityId: 13 },
      { id: 41, name: 'Sevilla', autonomousCommunityId: 1 },
    ]);
    await db.insert(specialties).values([
      { code: 'fiscal', name: 'Fiscal' },
      { code: 'laboral', name: 'Laboral' },
    ]);
    await db
      .insert(advisoryFirms)
      .values([
        firm(1, 'Gestoría Uno', 28, 'fiscal'),
        firm(2, 'Gestoría Dos', 41, 'fiscal'),
        firm(3, 'Gestoría Tres', 41, 'laboral'),
      ]);
    await db
      .insert(monthlyMetrics)
      .values([
        metric(1, '2024-04', 90, 100_000),
        metric(1, '2025-03', 95, 100_000),
        metric(1, '2025-04', 100, 200_000),
        metric(1, '2026-03', 110, 300_000),
        metric(2, '2025-04', 300, 500_000),
        metric(2, '2026-03', 320, 600_000),
      ]);
    repository = createPostgresNetworkPerformanceRepository(db);
  }, 120_000);

  afterAll(() => database?.stop());

  it('reads the months of one firm that have data', async () => {
    const firm = createPostgresFirmPerformanceRepository(database.db);

    expect(await firm.monthlyTotals(2, ['2025-04', '2025-05', '2026-03'])).toEqual([
      {
        month: '2025-04',
        firms: 1,
        activeClients: 300,
        churnedClients: 2,
        revenueCents: 500_000,
        taxFilings: 0,
        taxAgencyIncidents: 0,
      },
      {
        month: '2026-03',
        firms: 1,
        activeClients: 320,
        churnedClients: 2,
        revenueCents: 600_000,
        taxFilings: 0,
        taxAgencyIncidents: 0,
      },
    ]);
  });

  it('adds up the other firms of its specialty, month by month', async () => {
    const firm = createPostgresFirmPerformanceRepository(database.db);

    expect(await firm.specialtyTotals(2, ['2025-04', '2026-03'])).toEqual([
      {
        month: '2025-04',
        firms: 1,
        activeClients: 100,
        churnedClients: 2,
        revenueCents: 200_000,
        taxFilings: 0,
        taxAgencyIncidents: 0,
        employees: 5,
      },
      {
        month: '2026-03',
        firms: 1,
        activeClients: 110,
        churnedClients: 2,
        revenueCents: 300_000,
        taxFilings: 0,
        taxAgencyIncidents: 0,
        employees: 5,
      },
    ]);
    expect(await firm.specialtyTotals(3, ['2025-04'])).toEqual([]);
  });

  it('reads the employees of a firm', async () => {
    const firm = createPostgresFirmPerformanceRepository(database.db);

    expect(await firm.employees(2)).toBe(5);
    expect(await firm.employees(99)).toBeNull();
  });

  it('lists the fiscal years with metrics, the most recent first', async () => {
    expect(await repository.fiscalYears()).toEqual([2025, 2024]);
  });

  it('adds up the network month by month, only for the months of the period', async () => {
    const rows = await repository.monthlyTotals([
      { fiscalYear: 2025, fromMonth: 4, toMonth: 4 },
      { fiscalYear: 2024, fromMonth: 4, toMonth: 4 },
    ]);

    expect(rows).toEqual([
      { month: '2024-04', firms: 1, activeClients: 90, churnedClients: 2, revenueCents: 100_000 },
      { month: '2025-04', firms: 2, activeClients: 400, churnedClients: 4, revenueCents: 700_000 },
    ]);
  });

  it('lists the groups that have advisory firms', async () => {
    expect(await repository.groups('specialty')).toEqual([
      { key: 'fiscal', name: 'Fiscal', firms: 2 },
      { key: 'laboral', name: 'Laboral', firms: 1 },
    ]);
    expect(await repository.groups('autonomous-community')).toEqual([
      { key: '1', name: 'Andalucía', firms: 2 },
      { key: '13', name: 'Madrid, Comunidad de', firms: 1 },
    ]);
  });

  it('adds up each group month by month', async () => {
    const rows = await repository.monthlyTotalsByGroup('autonomous-community', [
      { fiscalYear: 2025, fromMonth: 4, toMonth: 3 },
    ]);

    expect(rows.map((r) => [r.groupKey, r.month, r.activeClients])).toEqual([
      ['1', '2025-04', 300],
      ['1', '2026-03', 320],
      ['13', '2025-04', 100],
      ['13', '2026-03', 110],
    ]);
  });

  it('returns every firm with its totals for the period and the previous year', async () => {
    const firms = await repository.firmPeriods(
      { fiscalYear: 2025, fromMonth: 4, toMonth: 3 },
      2024,
    );

    expect(firms).toEqual([
      {
        firm: { id: 1, name: 'Gestoría Uno', specialty: 'Fiscal', province: 'Madrid' },
        current: {
          lastMonth: '2026-03',
          lastMonthActiveClients: 110,
          activeClientsSum: 210,
          monthsWithData: 2,
          churnedClients: 4,
          revenueCents: 500_000,
        },
        previous: {
          lastMonth: '2025-03',
          lastMonthActiveClients: 95,
          activeClientsSum: 185,
          monthsWithData: 2,
          churnedClients: 4,
          revenueCents: 200_000,
        },
      },
      expect.objectContaining({ firm: expect.objectContaining({ id: 2 }), previous: null }),
      {
        firm: { id: 3, name: 'Gestoría Tres', specialty: 'Laboral', province: 'Sevilla' },
        current: null,
        previous: null,
      },
    ]);
  });
});

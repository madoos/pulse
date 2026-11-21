import {
  advisoryFirms,
  autonomousCommunities,
  provinces,
  specialties,
} from '@advisory-firms/infrastructure/repository/postgres/schema';
import { startTestDatabase } from '@shared/infrastructure/database/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { monthlyMetrics } from './schema';

const metricsFor = (month: string) => ({
  firmId: 1,
  month,
  activeClients: 100,
  newClients: 5,
  churnedClients: 2,
  filingsIncomeTax: 10,
  filingsVat: 20,
  filingsCorporateTax: 3,
  filingsOther: 4,
  revenueAdvisory: 1_000_000,
  revenueManagement: 500_000,
  revenueConsulting: 250_000,
  hoursWorked: 800,
  queriesReceived: 50,
  queriesResolved: 45,
  taxAgencyIncidents: 1,
  documentsProcessed: 300,
  satisfaction: 4.2,
});

describe('Monthly metrics schema', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;

  beforeAll(async () => {
    database = await startTestDatabase();
    await database.db.insert(autonomousCommunities).values({ id: 1, name: 'Comunidad de Madrid' });
    await database.db
      .insert(provinces)
      .values({ id: 28, name: 'Madrid', autonomousCommunityId: 1 });
    await database.db.insert(specialties).values({ code: 'fiscal', name: 'Fiscal' });
    await database.db.insert(advisoryFirms).values({
      id: 1,
      name: 'Asesoría de prueba',
      taxId: 'B00000001',
      provinceId: 28,
      city: 'Madrid',
      specialtyCode: 'fiscal',
      onboardedOn: '2018-03-15',
      employees: 5,
    });
  }, 120_000);

  afterAll(() => database?.stop());

  it('calculates the fiscal year, from April to March', async () => {
    await database.db
      .insert(monthlyMetrics)
      .values([metricsFor('2025-03-01'), metricsFor('2025-04-01'), metricsFor('2026-03-01')]);

    const rows = await database.db
      .select({ month: monthlyMetrics.month, fiscalYear: monthlyMetrics.fiscalYear })
      .from(monthlyMetrics)
      .orderBy(monthlyMetrics.month);

    expect(rows).toEqual([
      { month: '2025-03-01', fiscalYear: 2024 },
      { month: '2025-04-01', fiscalYear: 2025 },
      { month: '2026-03-01', fiscalYear: 2025 },
    ]);
  });

  it('rejects a second record for the same firm and month', async () => {
    await database.db.insert(monthlyMetrics).values(metricsFor('2025-05-01'));

    await expect(
      database.db.insert(monthlyMetrics).values(metricsFor('2025-05-01')),
    ).rejects.toThrow();
  });

  it('rejects metrics of an unknown firm', async () => {
    await expect(
      database.db.insert(monthlyMetrics).values({ ...metricsFor('2025-06-01'), firmId: 999 }),
    ).rejects.toThrow();
  });
});

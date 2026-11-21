import {
  advisoryFirms,
  provinces,
} from '@advisory-firms/infrastructure/repository/postgres/schema';
import { monthlyMetrics } from '@performance/infrastructure/repository/postgres/schema';
import { count, countDistinct, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadBusinessData } from '.';
import { BUSINESS_DATA_FOLDER } from '..';
import { startTestDatabase } from '../testing';

describe('Business data', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;

  beforeAll(async () => {
    database = await startTestDatabase();
    await loadBusinessData(database.db, BUSINESS_DATA_FOLDER);
  }, 120_000);

  afterAll(() => database?.stop());

  it('loads every advisory firm with its province', async () => {
    const [firms] = await database.db
      .select({ total: count() })
      .from(advisoryFirms)
      .innerJoin(provinces, eq(advisoryFirms.provinceId, provinces.id));

    expect(firms?.total).toBe(50);
  });

  it('loads three complete fiscal years of metrics for every firm', async () => {
    const years = await database.db
      .select({
        fiscalYear: monthlyMetrics.fiscalYear,
        rows: count(),
        firms: countDistinct(monthlyMetrics.firmId),
      })
      .from(monthlyMetrics)
      .groupBy(monthlyMetrics.fiscalYear)
      .orderBy(monthlyMetrics.fiscalYear);

    expect(years).toEqual([
      { fiscalYear: 2023, rows: 600, firms: 50 },
      { fiscalYear: 2024, rows: 600, firms: 50 },
      { fiscalYear: 2025, rows: 600, firms: 50 },
    ]);
  });

  it('keeps amounts in cents and satisfaction as a number', async () => {
    const [april] = await database.db
      .select({
        revenueAdvisory: monthlyMetrics.revenueAdvisory,
        satisfaction: monthlyMetrics.satisfaction,
      })
      .from(monthlyMetrics)
      .where(sql`${monthlyMetrics.firmId} = 1 and ${monthlyMetrics.month} = '2025-04-01'`);

    expect(april).toEqual({ revenueAdvisory: 1_820_984, satisfaction: 4.5 });
  });
});

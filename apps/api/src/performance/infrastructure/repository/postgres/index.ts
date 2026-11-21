import {
  advisoryFirms,
  autonomousCommunities,
  provinces,
  specialties,
} from '@advisory-firms/infrastructure/repository/postgres/schema';
import { monthsOf, type FiscalPeriod } from '@performance/domain/FiscalPeriod';
import type { FirmPeriod } from '@performance/domain/Highlights';
import type {
  GroupBy,
  NetworkPerformanceRepository,
} from '@performance/domain/NetworkPerformanceRepository';
import type { Database } from '@shared/infrastructure/database';
import { and, count, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { PgSelect } from 'drizzle-orm/pg-core';
import { monthlyMetrics as m } from './schema';

const revenue = sql`${m.revenueAdvisory} + ${m.revenueManagement} + ${m.revenueConsulting}`;

// Sums are read as double precision: exact for any realistic amount in cents, and returned
// as numbers, where an integer sum could overflow and a bigint would arrive as a string.
const monthlySums = {
  month: sql<string>`to_char(${m.month}, 'YYYY-MM')`,
  firms: sql<number>`count(*)::int`,
  activeClients: sql<number>`sum(${m.activeClients})::float8`,
  churnedClients: sql<number>`sum(${m.churnedClients})::float8`,
  revenueCents: sql<number>`sum(${revenue})::float8`,
};

/** Filters by fiscal year and month, so the read goes through the (fiscal_year, month) index. */
const inPeriods = (periods: FiscalPeriod[]) =>
  and(
    inArray(
      m.fiscalYear,
      periods.map((p) => p.fiscalYear),
    ),
    inArray(
      m.month,
      periods.flatMap(monthsOf).map((month) => `${month}-01`),
    ),
  );

/** Joins a query on the firms with the attributes they are grouped by. */
const withAttributes = <T extends PgSelect>(query: T) =>
  query
    .innerJoin(specialties, eq(specialties.code, advisoryFirms.specialtyCode))
    .innerJoin(provinces, eq(provinces.id, advisoryFirms.provinceId))
    .innerJoin(
      autonomousCommunities,
      eq(autonomousCommunities.id, provinces.autonomousCommunityId),
    );

const groupColumns = (groupBy: GroupBy): { key: SQL<string>; name: SQL<string> } =>
  groupBy === 'specialty'
    ? { key: sql<string>`${specialties.code}`, name: sql<string>`${specialties.name}` }
    : {
        key: sql<string>`${autonomousCommunities.id}::text`,
        name: sql<string>`${autonomousCommunities.name}`,
      };

export const createPostgresNetworkPerformanceRepository = (
  db: Database,
): NetworkPerformanceRepository => ({
  fiscalYears: async () =>
    (await db.selectDistinct({ fiscalYear: m.fiscalYear }).from(m).orderBy(desc(m.fiscalYear))).map(
      (row) => row.fiscalYear,
    ),

  monthlyTotals: (periods) =>
    db.select(monthlySums).from(m).where(inPeriods(periods)).groupBy(m.month).orderBy(m.month),

  groups: (groupBy) => {
    const { key, name } = groupColumns(groupBy);
    return withAttributes(db.select({ key, name, firms: count() }).from(advisoryFirms).$dynamic())
      .groupBy(key, name)
      .orderBy(name);
  },

  monthlyTotalsByGroup: (groupBy, periods) => {
    const { key } = groupColumns(groupBy);
    return withAttributes(
      db
        .select({ groupKey: key, ...monthlySums })
        .from(m)
        .innerJoin(advisoryFirms, eq(advisoryFirms.id, m.firmId))
        .$dynamic(),
    )
      .where(inPeriods(periods))
      .groupBy(key, m.month)
      .orderBy(key, m.month);
  },

  firmPeriods: async (period, previousFiscalYear) => {
    const periods =
      previousFiscalYear === null
        ? [period]
        : [period, { ...period, fiscalYear: previousFiscalYear }];

    // One row per firm and fiscal year. The left join keeps the firms without data in the
    // period, with a null fiscal year, so they can be reported as missing data.
    const rows = await withAttributes(
      db
        .select({
          id: advisoryFirms.id,
          name: advisoryFirms.name,
          specialty: specialties.name,
          province: provinces.name,
          fiscalYear: m.fiscalYear,
          lastMonth: sql<string | null>`to_char(max(${m.month}), 'YYYY-MM')`,
          lastMonthActiveClients: sql<
            number | null
          >`(array_agg(${m.activeClients} order by ${m.month} desc))[1]`,
          activeClientsSum: sql<number>`coalesce(sum(${m.activeClients}), 0)::float8`,
          monthsWithData: sql<number>`count(${m.month})::int`,
          churnedClients: sql<number>`coalesce(sum(${m.churnedClients}), 0)::float8`,
          revenueCents: sql<number>`coalesce(sum(${revenue}), 0)::float8`,
        })
        .from(advisoryFirms)
        .$dynamic(),
    )
      .leftJoin(m, and(eq(m.firmId, advisoryFirms.id), inPeriods(periods)))
      .groupBy(advisoryFirms.id, specialties.name, provinces.name, m.fiscalYear)
      .orderBy(advisoryFirms.id);

    const firms = new Map<number, FirmPeriod>();
    for (const {
      id,
      name,
      specialty,
      province,
      fiscalYear,
      lastMonth,
      lastMonthActiveClients,
      ...sums
    } of rows) {
      const entry = firms.get(id) ?? {
        firm: { id, name, specialty, province },
        current: null,
        previous: null,
      };
      if (lastMonth !== null && lastMonthActiveClients !== null) {
        const totals = { lastMonth, lastMonthActiveClients, ...sums };
        if (fiscalYear === period.fiscalYear) entry.current = totals;
        else entry.previous = totals;
      }
      firms.set(id, entry);
    }
    return [...firms.values()];
  },
});

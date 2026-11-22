import type {
  AdvisoryFirmRepository,
  FirmCriteria,
} from '@advisory-firms/domain/AdvisoryFirmRepository';
import type { Database } from '@shared/infrastructure/database';
import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm';
import { advisoryFirms as f, provinces, specialties } from './schema';

/** A LIKE pattern for text anywhere, where `%` and `_` are literal, not wildcards. */
const containing = (text: string) => '%' + text.replace(/[\\%_]/g, '\\$&') + '%';

/** Every criterion that is given, together. The search ignores case and accents. */
const whereOf = ({ search, provinceId, specialtyCode }: FirmCriteria): SQL | undefined =>
  and(
    search ? sql`unaccent(${f.name}) ilike unaccent(${containing(search)})` : undefined,
    provinceId === undefined ? undefined : eq(f.provinceId, provinceId),
    specialtyCode === undefined ? undefined : eq(f.specialtyCode, specialtyCode),
  );

const summaryColumns = {
  id: f.id,
  name: f.name,
  province: provinces.name,
  city: f.city,
  employees: f.employees,
  specialty: specialties.name,
};

export const createPostgresAdvisoryFirmRepository = (db: Database): AdvisoryFirmRepository => ({
  page: (criteria, after, limit) =>
    db
      .select(summaryColumns)
      .from(f)
      .innerJoin(provinces, eq(provinces.id, f.provinceId))
      .innerJoin(specialties, eq(specialties.code, f.specialtyCode))
      .where(
        and(
          whereOf(criteria),
          // Keyset pagination: the firms after the last one of the previous page.
          after ? sql`(${f.name}, ${f.id}) > (${after.name}, ${after.id})` : undefined,
        ),
      )
      .orderBy(asc(f.name), asc(f.id))
      .limit(limit),

  byId: async (id) => {
    const [firm] = await db
      .select({ ...summaryColumns, taxId: f.taxId, onboardedOn: f.onboardedOn })
      .from(f)
      .innerJoin(provinces, eq(provinces.id, f.provinceId))
      .innerJoin(specialties, eq(specialties.code, f.specialtyCode))
      .where(eq(f.id, id));
    return firm ?? null;
  },

  count: async (criteria) => {
    const [row] = await db.select({ total: count() }).from(f).where(whereOf(criteria));
    return row?.total ?? 0;
  },

  filters: async () => {
    const [withProvinces, withSpecialties] = await Promise.all([
      db
        .selectDistinct({ id: provinces.id, name: provinces.name })
        .from(provinces)
        .innerJoin(f, eq(f.provinceId, provinces.id))
        .orderBy(provinces.name),
      db
        .selectDistinct({ code: specialties.code, name: specialties.name })
        .from(specialties)
        .innerJoin(f, eq(f.specialtyCode, specialties.code))
        .orderBy(specialties.name),
    ]);
    return { provinces: withProvinces, specialties: withSpecialties };
  },
});

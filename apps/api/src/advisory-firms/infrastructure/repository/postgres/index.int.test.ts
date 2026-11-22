import { startTestDatabase } from '@shared/infrastructure/database/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPostgresAdvisoryFirmRepository } from '.';
import { advisoryFirms, autonomousCommunities, provinces, specialties } from './schema';

const firm = (id: number, name: string, provinceId: number, specialtyCode: string) => ({
  id,
  name,
  taxId: `B0000000${id}`,
  provinceId,
  city: provinceId === 28 ? 'Alcobendas' : 'Dos Hermanas',
  specialtyCode,
  onboardedOn: '2020-01-01',
  employees: id * 2,
});

describe('Postgres advisory firm repository', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;
  let repository: ReturnType<typeof createPostgresAdvisoryFirmRepository>;

  beforeAll(async () => {
    database = await startTestDatabase();
    const { db } = database;
    await db.insert(autonomousCommunities).values([
      { id: 13, name: 'Madrid, Comunidad de' },
      { id: 1, name: 'Andalucía' },
      { id: 9, name: 'Cataluña' },
    ]);
    await db.insert(provinces).values([
      { id: 28, name: 'Madrid', autonomousCommunityId: 13 },
      { id: 41, name: 'Sevilla', autonomousCommunityId: 1 },
      { id: 8, name: 'Barcelona', autonomousCommunityId: 9 },
    ]);
    await db.insert(specialties).values([
      { code: 'fiscal', name: 'Fiscal' },
      { code: 'laboral', name: 'Laboral' },
      { code: 'contable', name: 'Contable' },
    ]);
    await db
      .insert(advisoryFirms)
      .values([
        firm(1, 'Gestoría Martínez & Asociados', 28, 'fiscal'),
        firm(2, 'Asesores del Sur', 41, 'laboral'),
        firm(3, 'Asesores del Sur', 41, 'fiscal'),
        firm(4, 'Consulting 100%', 28, 'laboral'),
      ]);
    repository = createPostgresAdvisoryFirmRepository(database.db);
  }, 120_000);

  afterAll(() => database?.stop());

  it('lists the firms with their basic data, by name and then by id', async () => {
    const firms = await repository.page({}, null, 10);

    expect(firms.map((f) => f.id)).toEqual([2, 3, 4, 1]);
    expect(firms[0]).toEqual({
      id: 2,
      name: 'Asesores del Sur',
      province: 'Sevilla',
      city: 'Dos Hermanas',
      employees: 4,
      specialty: 'Laboral',
    });
  });

  it('pages after a firm, even between firms with the same name', async () => {
    const firms = await repository.page({}, { name: 'Asesores del Sur', id: 2 }, 2);

    expect(firms.map((f) => f.id)).toEqual([3, 4]);
  });

  it('searches by part of the name, ignoring case and accents', async () => {
    const firms = await repository.page({ search: 'MARTINEZ' }, null, 10);

    expect(firms.map((f) => f.id)).toEqual([1]);
  });

  it('takes % and _ in the search literally', async () => {
    expect((await repository.page({ search: '100%' }, null, 10)).map((f) => f.id)).toEqual([4]);
    expect(await repository.count({ search: '%' })).toBe(1);
  });

  it('filters and counts by province and specialty together', async () => {
    const criteria = { provinceId: 41, specialtyCode: 'fiscal' };

    expect((await repository.page(criteria, null, 10)).map((f) => f.id)).toEqual([3]);
    expect(await repository.count(criteria)).toBe(1);
    expect(await repository.count({})).toBe(4);
  });

  it('reads the profile of a firm, or null if it does not exist', async () => {
    expect(await repository.byId(2)).toEqual({
      id: 2,
      name: 'Asesores del Sur',
      taxId: 'B00000002',
      province: 'Sevilla',
      city: 'Dos Hermanas',
      employees: 4,
      specialty: 'Laboral',
      onboardedOn: '2020-01-01',
    });
    expect(await repository.byId(99)).toBeNull();
  });

  it('offers only the provinces and specialties that have firms', async () => {
    expect(await repository.filters()).toEqual({
      provinces: [
        { id: 28, name: 'Madrid' },
        { id: 41, name: 'Sevilla' },
      ],
      specialties: [
        { code: 'fiscal', name: 'Fiscal' },
        { code: 'laboral', name: 'Laboral' },
      ],
    });
  });
});

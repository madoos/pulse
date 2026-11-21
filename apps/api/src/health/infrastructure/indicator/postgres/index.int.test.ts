import { createDatabase } from '@shared/infrastructure/database';
import { startTestDatabase } from '@shared/infrastructure/database/testing';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPostgresHealthIndicator } from '.';

describe('Postgres health indicator', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;

  beforeAll(async () => {
    database = await startTestDatabase();
  }, 120_000);

  afterAll(() => database?.stop());

  it('applies the migrations, including the extensions', async () => {
    const { rows } = await database.db.execute<{ extname: string }>(
      sql`select extname from pg_extension where extname in ('vector', 'unaccent') order by extname`,
    );

    expect(rows.map((row) => row.extname)).toEqual(['unaccent', 'vector']);
  });

  it('reports the database as up', async () => {
    await expect(createPostgresHealthIndicator(database.db).isUp()).resolves.toBe(true);
  });

  it('reports the database as down when it cannot connect', async () => {
    const unreachable = createDatabase('postgres://pulse:pulse@127.0.0.1:1/pulse');

    await expect(createPostgresHealthIndicator(unreachable.db).isUp()).resolves.toBe(false);
    await unreachable.close();
  });
});

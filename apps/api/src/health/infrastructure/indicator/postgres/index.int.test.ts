import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MIGRATIONS_FOLDER, createDatabase } from '@shared/infrastructure/database';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPostgresHealthIndicator } from '.';

describe('Postgres health indicator', () => {
  let container: StartedPostgreSqlContainer;
  let database: ReturnType<typeof createDatabase>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('pgvector/pgvector:0.8.7-pg18-trixie').start();
    database = createDatabase(container.getConnectionUri());
    await migrate(database.db, { migrationsFolder: MIGRATIONS_FOLDER });
  }, 120_000);

  afterAll(async () => {
    await database?.close();
    await container?.stop();
  });

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

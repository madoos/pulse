import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MIGRATIONS_FOLDER, createDatabase } from '@shared/infrastructure/database';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPostgresSessionRepository, createPostgresUserRepository } from '.';

describe('Postgres user and session repositories', () => {
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

  it('creates and finds users, with a unique email', async () => {
    const users = createPostgresUserRepository(database.db);

    const ana = await users.create({ email: 'ana@example.com', passwordHash: 'hash' });

    expect(ana).toEqual({ id: expect.any(String), email: 'ana@example.com', passwordHash: 'hash' });
    expect(await users.findByEmail('ana@example.com')).toEqual(ana);
    expect(await users.findById(ana.id)).toEqual(ana);
    expect(await users.findByEmail('nobody@example.com')).toBeNull();
    await expect(users.create({ email: 'ana@example.com', passwordHash: 'x' })).rejects.toThrow();
  });

  it('creates, finds and revokes sessions', async () => {
    const users = createPostgresUserRepository(database.db);
    const sessions = createPostgresSessionRepository(database.db);
    const bea = await users.create({ email: 'bea@example.com', passwordHash: 'hash' });
    const expiresAt = new Date('2026-11-21T18:00:00Z');

    const session = await sessions.create({ userId: bea.id, expiresAt });

    expect(session).toEqual({ id: expect.any(String), userId: bea.id, expiresAt, revokedAt: null });
    expect(await sessions.findById(session.id)).toEqual(session);

    const revokedAt = new Date('2026-11-21T12:00:00Z');
    await sessions.revoke(session.id, revokedAt);

    expect((await sessions.findById(session.id))?.revokedAt).toEqual(revokedAt);
  });
});

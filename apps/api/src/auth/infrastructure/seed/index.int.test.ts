import { scryptPasswordHasher } from '@auth/infrastructure/crypto';
import { createPostgresUserRepository } from '@auth/infrastructure/repository/postgres';
import { runSeeds } from '@shared/infrastructure/database/seeds';
import { startTestDatabase } from '@shared/infrastructure/database/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createInitialUserSeed } from '.';

describe('initial user seed', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;

  beforeAll(async () => {
    database = await startTestDatabase();
  }, 120_000);

  afterAll(() => database?.stop());

  it('creates the initial user once, so a later change of password does not touch it', async () => {
    const users = createPostgresUserRepository(database.db);

    await runSeeds(database.db, [
      createInitialUserSeed({ email: 'Admin@Example.com', password: 'correct horse battery' }),
    ]);
    await runSeeds(database.db, [
      createInitialUserSeed({ email: 'admin@example.com', password: 'another long password' }),
    ]);

    const admin = await users.findByEmail('admin@example.com');
    expect(admin).not.toBeNull();
    expect(await scryptPasswordHasher.verify('correct horse battery', admin!.passwordHash)).toBe(
      true,
    );
  });
});

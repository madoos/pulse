import { makeCreateUser } from '@auth/application/create-user';
import { scryptPasswordHasher } from '@auth/infrastructure/crypto';
import { createPostgresUserRepository } from '@auth/infrastructure/repository/postgres';
import type { Seed } from '@shared/infrastructure/database/seeds';

export const createInitialUserSeed = (user: { email: string; password: string }): Seed => ({
  id: 'auth/0001-initial-user',
  run: async (db) => {
    const createUser = makeCreateUser({
      users: createPostgresUserRepository(db),
      hasher: scryptPasswordHasher,
    });
    const created = await createUser(user.email, user.password);
    console.log(`Initial user ${created.email} created`);
  },
});

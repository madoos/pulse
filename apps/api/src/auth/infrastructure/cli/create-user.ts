import { makeCreateUser } from '@auth/application/create-user';
import { scryptPasswordHasher } from '@auth/infrastructure/crypto';
import { createPostgresUserRepository } from '@auth/infrastructure/repository/postgres';
import { createDatabase } from '@shared/infrastructure/database';
import { text } from 'node:stream/consumers';
import { z } from 'zod';

const { DATABASE_URL } = z.object({ DATABASE_URL: z.url() }).parse(process.env);
const email = z.email().parse(process.argv[2]);
const password = (await text(process.stdin)).replace(/\r?\n$/, '');

const { db, close } = createDatabase(DATABASE_URL);

try {
  const createUser = makeCreateUser({
    users: createPostgresUserRepository(db),
    hasher: scryptPasswordHasher,
  });
  const user = await createUser(email, password);
  console.log(`User ${user.email} created with id ${user.id}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await close();
}

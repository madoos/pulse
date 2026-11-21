import type { SessionRepository } from '@auth/domain/SessionRepository';
import type { UserRepository } from '@auth/domain/UserRepository';
import type { Database } from '@shared/infrastructure/database';
import { eq } from 'drizzle-orm';
import { sessions, users } from './schema';

const userColumns = { id: users.id, email: users.email, passwordHash: users.passwordHash };
const sessionColumns = {
  id: sessions.id,
  userId: sessions.userId,
  expiresAt: sessions.expiresAt,
  revokedAt: sessions.revokedAt,
};

export const createPostgresUserRepository = (db: Database): UserRepository => ({
  findByEmail: async (email) =>
    (await db.select(userColumns).from(users).where(eq(users.email, email)))[0] ?? null,
  findById: async (id) =>
    (await db.select(userColumns).from(users).where(eq(users.id, id)))[0] ?? null,
  create: async (user) => {
    const [created] = await db.insert(users).values(user).returning(userColumns);
    if (!created) throw new Error('The user was not created');
    return created;
  },
});

export const createPostgresSessionRepository = (db: Database): SessionRepository => ({
  create: async (session) => {
    const [created] = await db.insert(sessions).values(session).returning(sessionColumns);
    if (!created) throw new Error('The session was not created');
    return created;
  },
  findById: async (id) =>
    (await db.select(sessionColumns).from(sessions).where(eq(sessions.id, id)))[0] ?? null,
  revoke: async (id, at) => {
    await db.update(sessions).set({ revokedAt: at }).where(eq(sessions.id, id));
  },
});

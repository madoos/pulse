import type { Session } from '@auth/domain/Session';
import type { SessionRepository } from '@auth/domain/SessionRepository';
import type { User } from '@auth/domain/User';
import type { UserRepository } from '@auth/domain/UserRepository';
import { randomUUID } from 'node:crypto';

export const createInMemoryUserRepository = (): UserRepository => {
  const users = new Map<string, User>();
  return {
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email) ?? null,
    findById: async (id) => users.get(id) ?? null,
    create: async (user) => {
      if ([...users.values()].some((existing) => existing.email === user.email)) {
        throw new Error(`A user with ${user.email} exists`);
      }
      const created = { ...user, id: randomUUID() };
      users.set(created.id, created);
      return { ...created };
    },
  };
};

export const createInMemorySessionRepository = (): SessionRepository => {
  const sessions = new Map<string, Session>();
  return {
    create: async (session) => {
      const created = { ...session, id: randomUUID(), revokedAt: null };
      sessions.set(created.id, created);
      return { ...created };
    },
    findById: async (id) => {
      const session = sessions.get(id);
      return session ? { ...session } : null;
    },
    revoke: async (id, at) => {
      const session = sessions.get(id);
      if (session) sessions.set(id, { ...session, revokedAt: at });
    },
  };
};

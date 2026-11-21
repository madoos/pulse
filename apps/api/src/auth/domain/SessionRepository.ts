import type { Session } from './Session';

export type SessionRepository = {
  create: (session: Omit<Session, 'id' | 'revokedAt'>) => Promise<Session>;
  findById: (id: string) => Promise<Session | null>;
  revoke: (id: string, at: Date) => Promise<void>;
};

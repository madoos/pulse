import type { SessionRepository } from '@auth/domain/SessionRepository';

export type LogOut = (sessionId: string) => Promise<void>;

export const makeLogOut =
  ({
    sessions,
    now = () => new Date(),
  }: {
    sessions: SessionRepository;
    now?: () => Date;
  }): LogOut =>
  (sessionId) =>
    sessions.revoke(sessionId, now());

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const isActive = (session: Session, now: Date) =>
  session.revokedAt === null && session.expiresAt > now;

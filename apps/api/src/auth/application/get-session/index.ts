import { isActive } from '@auth/domain/Session';
import type { SessionRepository } from '@auth/domain/SessionRepository';
import type { TokenSigner } from '@auth/domain/TokenSigner';
import type { UserRepository } from '@auth/domain/UserRepository';

export type CurrentSession = {
  sessionId: string;
  user: { id: string; email: string };
};

export type GetSession = (token: string) => Promise<CurrentSession | null>;

type Dependencies = {
  users: UserRepository;
  sessions: SessionRepository;
  tokens: TokenSigner;
  now?: () => Date;
};

export const makeGetSession =
  ({ users, sessions, tokens, now = () => new Date() }: Dependencies): GetSession =>
  async (token) => {
    const claims = await tokens.verify(token);
    if (!claims) return null;

    const session = await sessions.findById(claims.sessionId);
    if (!session || session.userId !== claims.userId || !isActive(session, now())) return null;

    const user = await users.findById(session.userId);
    if (!user) return null;

    return { sessionId: session.id, user: { id: user.id, email: user.email } };
  };

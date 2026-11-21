import type { PasswordHasher } from '@auth/domain/PasswordHasher';
import { SESSION_TTL_MS } from '@auth/domain/Session';
import type { SessionRepository } from '@auth/domain/SessionRepository';
import type { TokenSigner } from '@auth/domain/TokenSigner';
import { normalizeEmail } from '@auth/domain/User';
import type { UserRepository } from '@auth/domain/UserRepository';

export type LogInResult = {
  user: { id: string; email: string };
  token: string;
  expiresAt: Date;
};

export type LogIn = (email: string, password: string) => Promise<LogInResult | null>;

type Dependencies = {
  users: UserRepository;
  sessions: SessionRepository;
  hasher: PasswordHasher;
  tokens: TokenSigner;
  now?: () => Date;
};

export const makeLogIn = ({
  users,
  sessions,
  hasher,
  tokens,
  now = () => new Date(),
}: Dependencies): LogIn => {
  const unusedHash = hasher.hash('timing-equaliser');

  return async (email, password) => {
    const user = await users.findByEmail(normalizeEmail(email));
    const matches = await hasher.verify(password, user?.passwordHash ?? (await unusedHash));
    if (!user || !matches) return null;

    const expiresAt = new Date(now().getTime() + SESSION_TTL_MS);
    const session = await sessions.create({ userId: user.id, expiresAt });
    const token = await tokens.sign({ userId: user.id, sessionId: session.id, expiresAt });

    return { user: { id: user.id, email: user.email }, token, expiresAt };
  };
};

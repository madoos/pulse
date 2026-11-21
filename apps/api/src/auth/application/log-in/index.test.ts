import { SESSION_TTL_MS } from '@auth/domain/Session';
import { createJwtTokenSigner, scryptPasswordHasher } from '@auth/infrastructure/crypto';
import {
  createInMemorySessionRepository,
  createInMemoryUserRepository,
} from '@auth/infrastructure/repository/in-memory';
import { describe, expect, it } from 'vitest';
import { makeLogIn } from '.';

const now = new Date(Math.floor(Date.now() / 1000) * 1000);
const tokens = createJwtTokenSigner('a-secret-of-at-least-thirty-two-chars');

const setUp = async () => {
  const users = createInMemoryUserRepository();
  const sessions = createInMemorySessionRepository();
  const ana = await users.create({
    email: 'ana@example.com',
    passwordHash: await scryptPasswordHasher.hash('correct horse'),
  });
  const logIn = makeLogIn({
    users,
    sessions,
    hasher: scryptPasswordHasher,
    tokens,
    now: () => now,
  });
  return { logIn, sessions, ana };
};

describe('logIn', () => {
  it('starts a session for the right credentials', async () => {
    const { logIn, sessions, ana } = await setUp();

    const result = await logIn('ana@example.com', 'correct horse');

    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    expect(result?.user).toEqual({ id: ana.id, email: 'ana@example.com' });
    expect(result?.expiresAt).toEqual(expiresAt);
    const claims = await tokens.verify(result?.token ?? '');
    expect(claims).toEqual({ userId: ana.id, sessionId: expect.any(String), expiresAt });
    expect(await sessions.findById(claims?.sessionId ?? '')).toEqual({
      id: claims?.sessionId,
      userId: ana.id,
      expiresAt,
      revokedAt: null,
    });
  });

  it('ignores the case and surrounding spaces of the email', async () => {
    const { logIn } = await setUp();

    expect(await logIn('  Ana@Example.com ', 'correct horse')).not.toBeNull();
  });

  it('rejects a wrong password or an unknown email', async () => {
    const { logIn } = await setUp();

    expect(await logIn('ana@example.com', 'wrong')).toBeNull();
    expect(await logIn('nobody@example.com', 'correct horse')).toBeNull();
  });
});

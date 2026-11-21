import { SESSION_TTL_MS } from '@auth/domain/Session';
import { createJwtTokenSigner, scryptPasswordHasher } from '@auth/infrastructure/crypto';
import {
  createInMemorySessionRepository,
  createInMemoryUserRepository,
} from '@auth/infrastructure/repository/in-memory';
import { describe, expect, it } from 'vitest';
import { makeGetSession } from '.';
import { makeLogIn } from '../log-in';
import { makeLogOut } from '../log-out';

const tokens = createJwtTokenSigner('a-secret-of-at-least-thirty-two-chars');

const setUp = async () => {
  let now = new Date();
  const clock = () => now;
  const users = createInMemoryUserRepository();
  const sessions = createInMemorySessionRepository();
  const ana = await users.create({
    email: 'ana@example.com',
    passwordHash: await scryptPasswordHasher.hash('correct horse'),
  });
  const logIn = makeLogIn({ users, sessions, hasher: scryptPasswordHasher, tokens, now: clock });
  const { token } = (await logIn('ana@example.com', 'correct horse'))!;
  return {
    ana,
    token,
    logOut: makeLogOut({ sessions, now: clock }),
    getSession: makeGetSession({ users, sessions, tokens, now: clock }),
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
  };
};

describe('getSession', () => {
  it('resolves the user of an active session', async () => {
    const { token, getSession, ana } = await setUp();

    expect(await getSession(token)).toEqual({
      sessionId: expect.any(String),
      user: { id: ana.id, email: 'ana@example.com' },
    });
  });

  it('rejects a token that does not verify', async () => {
    const { getSession } = await setUp();

    expect(await getSession('forged')).toBeNull();
  });

  it('rejects an expired session', async () => {
    const { token, getSession, advance } = await setUp();

    advance(SESSION_TTL_MS);

    expect(await getSession(token)).toBeNull();
  });

  it('rejects a session revoked by logging out', async () => {
    const { token, logOut, getSession } = await setUp();

    await logOut((await getSession(token))!.sessionId);

    expect(await getSession(token)).toBeNull();
  });

  it('rejects a token whose session belongs to another user', async () => {
    const { token, getSession } = await setUp();
    const claims = (await tokens.verify(token))!;

    expect(await getSession(await tokens.sign({ ...claims, userId: 'user-2' }))).toBeNull();
  });
});

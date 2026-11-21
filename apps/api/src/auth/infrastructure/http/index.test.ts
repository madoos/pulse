import { makeGetSession } from '@auth/application/get-session';
import { makeLogIn } from '@auth/application/log-in';
import { makeLogOut } from '@auth/application/log-out';
import { createJwtTokenSigner, scryptPasswordHasher } from '@auth/infrastructure/crypto';
import {
  createInMemorySessionRepository,
  createInMemoryUserRepository,
} from '@auth/infrastructure/repository/in-memory';
import { createApp } from '@shared/infrastructure/http';
import { describe, expect, it } from 'vitest';
import { createRequireSession, createSessionRoutes } from '.';

const tokens = createJwtTokenSigner('a-secret-of-at-least-thirty-two-chars');
const hasher = scryptPasswordHasher;

const setUp = async (secure = true) => {
  const users = createInMemoryUserRepository();
  const sessions = createInMemorySessionRepository();
  const ana = await users.create({
    email: 'ana@example.com',
    passwordHash: await hasher.hash('correct horse'),
  });
  const app = createApp([
    createSessionRoutes({
      logIn: makeLogIn({ users, sessions, hasher, tokens }),
      logOut: makeLogOut({ sessions }),
      requireSession: createRequireSession(makeGetSession({ users, sessions, tokens })),
      cookie: { secure },
    }),
  ]);
  return { app, ana };
};

type App = Awaited<ReturnType<typeof setUp>>['app'];

const logIn = (app: App, password = 'correct horse') =>
  app.request('/api/v1/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@example.com', password }),
  });

const cookieOf = (res: Response) => res.headers.get('set-cookie')?.split(';')[0] ?? '';

describe('POST /api/v1/session', () => {
  it('starts a session and sets it in a secure cookie', async () => {
    const { app, ana } = await setUp();

    const res = await logIn(app);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { id: ana.id, email: 'ana@example.com' } });
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api');
    expect(cookie).toMatch(/Max-Age=28[78]\d\d/);
  });

  it('leaves out the Secure attribute when told to', async () => {
    const res = await logIn((await setUp(false)).app);

    expect(res.headers.get('set-cookie')).not.toContain('Secure');
  });

  it('answers 401 as a problem for wrong credentials', async () => {
    const res = await logIn((await setUp()).app, 'wrong');

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('answers 400 for malformed credentials', async () => {
    const res = await (
      await setUp()
    ).app.request('/api/v1/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '' }),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/session', () => {
  it('returns the user of the session in the cookie', async () => {
    const { app, ana } = await setUp();
    const cookie = cookieOf(await logIn(app));

    const res = await app.request('/api/v1/session', { headers: { Cookie: cookie } });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { id: ana.id, email: 'ana@example.com' } });
  });

  it('answers 401 without a session', async () => {
    const res = await (await setUp()).app.request('/api/v1/session');

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/v1/session', () => {
  it('revokes the session and clears the cookie', async () => {
    const { app } = await setUp();
    const cookie = cookieOf(await logIn(app));

    const res = await app.request('/api/v1/session', {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toMatch(/^session=;.*Max-Age=0/);
    expect((await app.request('/api/v1/session', { headers: { Cookie: cookie } })).status).toBe(
      401,
    );
  });
});

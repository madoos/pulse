import type { CurrentSession, GetSession } from '@auth/application/get-session';
import { problem } from '@shared/infrastructure/http/problem';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { SESSION_COOKIE } from './cookie';

declare module 'hono' {
  interface ContextVariableMap {
    session: CurrentSession;
  }
}

export const createRequireSession = (getSession: GetSession) =>
  createMiddleware(async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE);
    const session = token ? await getSession(token) : null;
    if (!session) return problem(c, 401, 'A valid session is required');

    c.set('session', session);
    await next();
  });

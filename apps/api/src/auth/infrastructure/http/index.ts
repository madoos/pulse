import type { LogIn } from '@auth/application/log-in';
import type { LogOut } from '@auth/application/log-out';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { LogInSchema, ProblemSchema, SessionSchema } from '@pulse/contracts';
import { problem } from '@shared/infrastructure/http/problem';
import { deleteCookie, setCookie } from 'hono/cookie';
import type { MiddlewareHandler } from 'hono';
import { SESSION_COOKIE, type CookieOptions } from './cookie';

export { createRequireSession } from './require-session';

const problemContent = { 'application/problem+json': { schema: ProblemSchema } };
const sessionContent = { 'application/json': { schema: SessionSchema } };

type Dependencies = {
  logIn: LogIn;
  logOut: LogOut;
  requireSession: MiddlewareHandler;
  cookie: CookieOptions;
};

export const createSessionRoutes = ({ logIn, logOut, requireSession, cookie }: Dependencies) => {
  const cookieAttributes = {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: 'Strict',
    path: '/api',
  } as const;

  const logInRoute = createRoute({
    method: 'post',
    path: '/session',
    tags: ['Session'],
    summary: 'Log in and start a session',
    request: {
      body: { required: true, content: { 'application/json': { schema: LogInSchema } } },
    },
    responses: {
      200: { description: 'The session started, its cookie is set', content: sessionContent },
      400: { description: 'The credentials are malformed', content: problemContent },
      401: { description: 'The credentials are wrong', content: problemContent },
    },
  });

  const getSessionRoute = createRoute({
    method: 'get',
    path: '/session',
    tags: ['Session'],
    summary: 'Get the active session',
    middleware: [requireSession] as const,
    responses: {
      200: { description: 'The active session', content: sessionContent },
      401: { description: 'There is no active session', content: problemContent },
    },
  });

  const logOutRoute = createRoute({
    method: 'delete',
    path: '/session',
    tags: ['Session'],
    summary: 'Log out and revoke the session',
    middleware: [requireSession] as const,
    responses: {
      204: { description: 'The session was revoked, its cookie is cleared' },
      401: { description: 'There is no active session', content: problemContent },
    },
  });

  return new OpenAPIHono()
    .openapi(logInRoute, async (c) => {
      const { email, password } = c.req.valid('json');
      const result = await logIn(email, password);
      if (!result) return problem(c, 401, 'The email or the password is wrong');

      setCookie(c, SESSION_COOKIE, result.token, {
        ...cookieAttributes,
        maxAge: Math.floor((result.expiresAt.getTime() - Date.now()) / 1000),
      });
      return c.json({ user: result.user }, 200);
    })
    .openapi(getSessionRoute, (c) => c.json({ user: c.get('session').user }, 200))
    .openapi(logOutRoute, async (c) => {
      await logOut(c.get('session').sessionId);
      deleteCookie(c, SESSION_COOKIE, cookieAttributes);
      return c.body(null, 204);
    });
};

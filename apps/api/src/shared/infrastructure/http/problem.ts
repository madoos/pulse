import type { Problem } from '@pulse/contracts';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const titles: Partial<Record<ContentfulStatusCode, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export const problem = <S extends ContentfulStatusCode>(c: Context, status: S, detail?: string) => {
  const body: Problem = {
    type: 'about:blank',
    title: titles[status] ?? 'Error',
    status,
    instance: c.req.path,
    ...(detail ? { detail } : {}),
  };
  return c.json(body, status, { 'Content-Type': 'application/problem+json' });
};

import type { Problem } from '@pulse/contracts';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const titles: Partial<Record<ContentfulStatusCode, string>> = {
  400: 'Bad Request',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export const problem = (c: Context, status: ContentfulStatusCode, detail?: string) => {
  const body: Problem = {
    type: 'about:blank',
    title: titles[status] ?? 'Error',
    status,
    instance: c.req.path,
    ...(detail ? { detail } : {}),
  };
  return c.body(JSON.stringify(body), status, { 'Content-Type': 'application/problem+json' });
};

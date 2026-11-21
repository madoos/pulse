import { serve } from '@hono/node-server';
import type { OpenAPIHono } from '@hono/zod-openapi';

export const startServer = (app: OpenAPIHono, port: number) =>
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  });

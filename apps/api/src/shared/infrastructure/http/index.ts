import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { problem } from './problem';

export const API_VERSION = 'v1';

export const API_BASE_PATH = `/api/${API_VERSION}`;

export type AppOptions = {
  corsOrigin?: string;
};

export const createApp = (moduleRoutes: OpenAPIHono[], options: AppOptions = {}) => {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) return problem(c, 400, result.error.message);
    },
  });
  const api = app.basePath(API_BASE_PATH);

  if (options.corsOrigin) {
    api.use('*', cors({ origin: options.corsOrigin, credentials: true }));
  }

  for (const routes of moduleRoutes) api.route('/', routes);

  api.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Pulse API', version: API_VERSION },
  });
  api.get('/docs', swaggerUI({ url: `${API_BASE_PATH}/openapi.json` }));

  app.notFound((c) => problem(c, 404));
  app.onError((error, c) => {
    console.error(error);
    return problem(c, 500);
  });

  return app;
};
export { problem } from './problem';
export { startServer } from './server';

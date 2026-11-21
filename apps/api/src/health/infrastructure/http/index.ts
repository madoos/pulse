import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { CheckHealth } from '@health/application/check-health';
import { HealthSchema } from '@pulse/contracts';

const checkHealthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Check that the service is up',
  responses: {
    200: {
      description: 'The service is up',
      content: { 'application/json': { schema: HealthSchema } },
    },
  },
});

export const createHealthRoutes = (checkHealth: CheckHealth) =>
  new OpenAPIHono().openapi(checkHealthRoute, (c) => c.json(checkHealth(), 200));

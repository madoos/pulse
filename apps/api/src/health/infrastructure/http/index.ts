import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { CheckHealth } from '@health/application/check-health';
import { HealthSchema } from '@pulse/contracts';

const checkHealthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Check that the service and its dependencies are up',
  responses: {
    200: {
      description: 'The service is up',
      content: { 'application/json': { schema: HealthSchema } },
    },
    503: {
      description: 'A dependency of the service is down',
      content: { 'application/json': { schema: HealthSchema } },
    },
  },
});

export const createHealthRoutes = (checkHealth: CheckHealth) =>
  new OpenAPIHono().openapi(checkHealthRoute, async (c) => {
    const health = await checkHealth();
    return health.status === 'ok' ? c.json(health, 200) : c.json(health, 503);
  });

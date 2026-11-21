import { checkHealth } from '@health/application/check-health';
import { createApp } from '@shared/infrastructure/http';
import { describe, expect, it } from 'vitest';
import { createHealthRoutes } from '.';

const app = createApp([createHealthRoutes(checkHealth)]);

describe('GET /api/v1/health', () => {
  it('reports that the service is up', async () => {
    const res = await app.request('/api/v1/health');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('is documented in the OpenAPI specification', async () => {
    const spec = (await (await app.request('/api/v1/openapi.json')).json()) as {
      paths: Record<string, { get?: unknown }>;
      components: { schemas: Record<string, unknown> };
    };

    expect(spec.paths['/api/v1/health']?.get).toBeDefined();
    expect(spec.components.schemas.Health).toBeDefined();
  });
});

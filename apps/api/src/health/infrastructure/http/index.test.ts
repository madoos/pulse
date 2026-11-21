import type { CheckHealth } from '@health/application/check-health';
import { createApp } from '@shared/infrastructure/http';
import { describe, expect, it } from 'vitest';
import { createHealthRoutes } from '.';

const appWith = (checkHealth: CheckHealth) => createApp([createHealthRoutes(checkHealth)]);

describe('GET /api/v1/health', () => {
  it('reports that the service is up', async () => {
    const res = await appWith(async () => ({ status: 'ok' })).request('/api/v1/health');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('answers 503 when a dependency is down', async () => {
    const res = await appWith(async () => ({ status: 'down' })).request('/api/v1/health');

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'down' });
  });

  it('is documented in the OpenAPI specification', async () => {
    const res = await appWith(async () => ({ status: 'ok' })).request('/api/v1/openapi.json');
    const spec = (await res.json()) as {
      paths: Record<string, { get?: unknown }>;
      components: { schemas: Record<string, unknown> };
    };

    expect(spec.paths['/api/v1/health']?.get).toBeDefined();
    expect(spec.components.schemas.Health).toBeDefined();
  });
});

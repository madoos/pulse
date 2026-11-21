import { createApp } from '@shared/infrastructure/http';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createPerformanceRoutes } from '.';

const summary = { activeClients: 100, revenue: 1000, revenuePerClient: 10, churnRate: 0.01 };

const setUp = (authenticated = true) => {
  const dependencies = {
    listFiscalYears: vi.fn(async () => [2025, 2024]),
    getNetworkPerformance: vi.fn(async () => ({
      years: [{ fiscalYear: 2025, summary, months: [] }],
    })),
    getNetworkGroups: vi.fn(async () => ({ groups: [] })),
    getNetworkHighlights: vi.fn(async () => ({
      previousFiscalYear: 2024,
      needsAttention: [],
      standouts: [],
    })),
  };
  const requireSession: MiddlewareHandler = async (c, next) =>
    authenticated ? next() : c.json({ status: 401 }, 401);
  const app = createApp([createPerformanceRoutes({ ...dependencies, requireSession })]);
  return { app, ...dependencies };
};

describe('performance routes', () => {
  it('lists the fiscal years', async () => {
    const res = await setUp().app.request('/api/v1/fiscal-years');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fiscalYears: [2025, 2024] });
  });

  it('reads the network for a period and a compared year from the query', async () => {
    const { app, getNetworkPerformance } = setUp();

    const res = await app.request(
      '/api/v1/network/performance?fiscalYear=2025&compareWith=2024&fromMonth=4&toMonth=6',
    );

    expect(res.status).toBe(200);
    expect(getNetworkPerformance).toHaveBeenCalledWith({
      fiscalYear: 2025,
      compareWith: 2024,
      fromMonth: 4,
      toMonth: 6,
    });
  });

  it('rejects a range of months that goes backwards', async () => {
    const res = await setUp().app.request(
      '/api/v1/network/performance?fiscalYear=2025&fromMonth=6&toMonth=4',
    );

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('application/problem+json');
  });

  it('groups the network by specialty', async () => {
    const { app, getNetworkGroups } = setUp();

    const res = await app.request(
      '/api/v1/network/performance/groups?fiscalYear=2025&groupBy=specialty',
    );

    expect(res.status).toBe(200);
    expect(getNetworkGroups).toHaveBeenCalledWith({
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
      groupBy: 'specialty',
    });
  });

  it('requires a way to group', async () => {
    const res = await setUp().app.request('/api/v1/network/performance/groups?fiscalYear=2025');

    expect(res.status).toBe(400);
  });

  it('returns the highlights of a period', async () => {
    const res = await setUp().app.request('/api/v1/network/highlights?fiscalYear=2025');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      previousFiscalYear: 2024,
      needsAttention: [],
      standouts: [],
    });
  });

  it('requires a session', async () => {
    const res = await setUp(false).app.request('/api/v1/network/highlights?fiscalYear=2025');

    expect(res.status).toBe(401);
  });

  it('is documented in the OpenAPI specification', async () => {
    const res = await setUp().app.request('/api/v1/openapi.json');
    const spec = (await res.json()) as { paths: Record<string, unknown> };

    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([
        '/api/v1/fiscal-years',
        '/api/v1/network/performance',
        '/api/v1/network/performance/groups',
        '/api/v1/network/highlights',
      ]),
    );
  });
});

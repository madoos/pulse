import { AdvisoryFirmNotFoundError } from '@advisory-firms/application/get-advisory-firm';
import { InvalidCursorError } from '@advisory-firms/application/list-advisory-firms';
import { createApp } from '@shared/infrastructure/http';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createAdvisoryFirmRoutes } from '.';

const page = {
  items: [
    { id: 1, name: 'A', province: 'Madrid', city: 'Madrid', employees: 3, specialty: 'Fiscal' },
  ],
  total: 1,
  nextCursor: null,
};

const setUp = (authenticated = true) => {
  const dependencies = {
    listAdvisoryFirms: vi.fn(async () => page),
    listFirmFilters: vi.fn(async () => ({ provinces: [], specialties: [] })),
    getAdvisoryFirm: vi.fn(async (id: number) => ({
      ...page.items[0]!,
      id,
      taxId: 'B1',
      onboardedOn: '2020-01-01',
    })),
  };
  const requireSession: MiddlewareHandler = async (c, next) =>
    authenticated ? next() : c.json({ status: 401 }, 401);
  const app = createApp([createAdvisoryFirmRoutes({ ...dependencies, requireSession })]);
  return { app, ...dependencies };
};

describe('advisory firm routes', () => {
  it('lists a page of firms with the search and the filters of the query', async () => {
    const { app, listAdvisoryFirms } = setUp();

    const res = await app.request(
      '/api/v1/advisory-firms?search=gest&province=28&specialty=fiscal&cursor=abc&limit=10',
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(page);
    expect(listAdvisoryFirms).toHaveBeenCalledWith({
      search: 'gest',
      province: 28,
      specialty: 'fiscal',
      cursor: 'abc',
      limit: 10,
    });
  });

  it('answers a cursor it did not make with a 400 problem', async () => {
    const { app, listAdvisoryFirms } = setUp();
    listAdvisoryFirms.mockRejectedValueOnce(new InvalidCursorError());

    const res = await app.request('/api/v1/advisory-firms?cursor=abc');

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('application/problem+json');
  });

  it('rejects a province that is not an id', async () => {
    const res = await setUp().app.request('/api/v1/advisory-firms?province=Madrid');

    expect(res.status).toBe(400);
  });

  it('lists the values to filter by', async () => {
    const res = await setUp().app.request('/api/v1/advisory-firms/filters');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ provinces: [], specialties: [] });
  });

  it('gets the profile of a firm by its id', async () => {
    const { app, getAdvisoryFirm } = setUp();

    const res = await app.request('/api/v1/advisory-firms/7');

    expect(res.status).toBe(200);
    expect(getAdvisoryFirm).toHaveBeenCalledWith(7);
  });

  it('answers a firm that does not exist with a 404 problem', async () => {
    const { app, getAdvisoryFirm } = setUp();
    getAdvisoryFirm.mockRejectedValueOnce(new AdvisoryFirmNotFoundError(7));

    expect((await app.request('/api/v1/advisory-firms/7')).status).toBe(404);
  });

  it('requires a session', async () => {
    const res = await setUp(false).app.request('/api/v1/advisory-firms');

    expect(res.status).toBe(401);
  });
});

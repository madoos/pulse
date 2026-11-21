import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import { API_BASE_PATH, createApp } from '.';

const failingRoutes = new OpenAPIHono();
failingRoutes.get('/boom', () => {
  throw new Error('boom');
});
const app = createApp([failingRoutes]);

describe('HTTP app', () => {
  it('serves the OpenAPI specification and the Swagger UI under the versioned prefix', async () => {
    expect(API_BASE_PATH).toBe('/api/v1');
    expect((await app.request('/api/v1/openapi.json')).status).toBe(200);
    expect((await app.request('/api/v1/docs')).status).toBe(200);
  });

  it('documents the version of the API contract', async () => {
    const spec = (await (await app.request('/api/v1/openapi.json')).json()) as {
      info: { version: string };
    };

    expect(spec.info.version).toBe('v1');
  });

  it('serves module routes only under the versioned prefix', async () => {
    expect((await app.request('/api/v1/boom')).status).toBe(500);
    expect((await app.request('/boom')).status).toBe(404);
  });

  it('answers unknown routes with an RFC 9457 problem', async () => {
    const res = await app.request('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await res.json()).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: '/does-not-exist',
    });
  });

  it('answers unexpected errors with an RFC 9457 problem without leaking details', async () => {
    const res = await app.request('/api/v1/boom');

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      instance: '/api/v1/boom',
    });
  });

  it('allows cross-origin requests only from the configured origin', async () => {
    const withCors = createApp([failingRoutes], { corsOrigin: 'http://localhost:8080' });
    const headers = { Origin: 'http://localhost:8080' };

    const allowed = await withCors.request('/api/v1/openapi.json', { headers });
    const withoutCors = await app.request('/api/v1/openapi.json', { headers });

    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');
    expect(withoutCors.headers.get('access-control-allow-origin')).toBeNull();
  });
});

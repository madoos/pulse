import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createRequest, noContent } from './request';

const request = createRequest('https://api.test/api/v1');

const respondWith = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

const passThrough = { parse: (data: unknown) => data };
const strict = {
  parse: (data: unknown) => {
    if (typeof data !== 'object' || data === null || !('id' in data)) throw new Error('invalid');
    return data;
  },
};

afterEach(() => vi.restoreAllMocks());

describe('request', () => {
  it('calls the versioned API and returns the parsed response', async () => {
    const fetch = respondWith(200, { id: 1 });

    await expect(firstValueFrom(request('GET', '/things', strict))).resolves.toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/v1/things', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('sends the body as JSON', async () => {
    const fetch = respondWith(200, { id: 1 });

    await firstValueFrom(request('POST', '/things', passThrough, { name: 'a' }));

    expect(fetch).toHaveBeenCalledWith('https://api.test/api/v1/things', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"a"}',
    });
  });

  it('accepts an empty response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      firstValueFrom(request('DELETE', '/things/1', noContent)),
    ).resolves.toBeUndefined();
  });

  it('fails with the status when the API answers with an error', async () => {
    respondWith(503, { status: 503 });

    await expect(firstValueFrom(request('GET', '/things', passThrough))).rejects.toEqual(
      new ApiError(503),
    );
  });

  it('fails when the response does not match the schema', async () => {
    respondWith(200, { name: 'no id' });

    await expect(firstValueFrom(request('GET', '/things', strict))).rejects.toThrow('invalid');
  });
});

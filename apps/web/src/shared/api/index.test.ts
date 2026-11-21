import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpApi } from '.';

afterEach(() => vi.restoreAllMocks());

describe('createHttpApi', () => {
  it('builds every entity on the same API URL', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify({ status: 'ok' })));
    const api = createHttpApi('https://api.test/api/v1');

    await firstValueFrom(api.health.get());
    await firstValueFrom(api.session.delete());

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.test/api/v1/health',
      'https://api.test/api/v1/session',
    ]);
  });
});

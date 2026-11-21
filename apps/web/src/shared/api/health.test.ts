import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHealthApi } from './health';
import { createRequest } from './request';

const health = createHealthApi(createRequest('https://api.test/api/v1'));

afterEach(() => vi.restoreAllMocks());

describe('health', () => {
  it('gets the health of the API', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })));

    await expect(firstValueFrom(health.get())).resolves.toEqual({ status: 'ok' });
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/v1/health', {
      method: 'GET',
      credentials: 'include',
    });
  });
});

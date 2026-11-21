import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequest } from './request';
import { createSessionApi } from './session';

const session = createSessionApi(createRequest('https://api.test/api/v1'));
const body = { user: { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' } };

afterEach(() => vi.restoreAllMocks());

describe('session', () => {
  it('gets the active session', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body)));

    await expect(firstValueFrom(session.get())).resolves.toEqual(body);
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/v1/session', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('starts a session with the credentials', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body)));

    await firstValueFrom(session.post({ email: 'ana@example.com', password: 'secret' }));

    expect(fetch).toHaveBeenCalledWith('https://api.test/api/v1/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email":"ana@example.com","password":"secret"}',
    });
  });

  it('ends the session', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(firstValueFrom(session.delete())).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/v1/session', {
      method: 'DELETE',
      credentials: 'include',
    });
  });
});

import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createAdvisoryFirmsApi } from './advisoryFirms';
import type { Request } from './request';

describe('advisory firms api', () => {
  it('asks for a page with the search, the filters and the cursor that are given', async () => {
    const request = vi.fn(() => of({})) as unknown as Request;
    const api = createAdvisoryFirmsApi(request);

    await firstValueFrom(api.list({ search: '', province: 28, cursor: 'abc' }));
    await firstValueFrom(api.list({}));
    await firstValueFrom(api.filters());

    expect(vi.mocked(request).mock.calls.map(([, path]) => path)).toEqual([
      '/advisory-firms?province=28&cursor=abc',
      '/advisory-firms',
      '/advisory-firms/filters',
    ]);
  });
});

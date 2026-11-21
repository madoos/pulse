import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createNetworkApi } from './network';
import type { Request } from './request';

describe('network api', () => {
  it('sends the filters in the query string, leaving out the empty ones', async () => {
    const request = vi.fn(() => of({ years: [] })) as unknown as Request;
    const api = createNetworkApi(request);

    await firstValueFrom(api.performance({ fiscalYear: 2025, fromMonth: 4, toMonth: 3 }));

    expect(request).toHaveBeenCalledWith(
      'GET',
      '/network/performance?fiscalYear=2025&fromMonth=4&toMonth=3',
      expect.anything(),
    );
  });

  it('asks for the groups and the highlights', async () => {
    const request = vi.fn(() => of({})) as unknown as Request;
    const api = createNetworkApi(request);

    await firstValueFrom(
      api.groups({
        fiscalYear: 2025,
        compareWith: 2024,
        fromMonth: 4,
        toMonth: 6,
        groupBy: 'specialty',
      }),
    );
    await firstValueFrom(api.highlights({ fiscalYear: 2025, fromMonth: 4, toMonth: 3 }));
    await firstValueFrom(api.fiscalYears());

    expect(vi.mocked(request).mock.calls.map(([, path]) => path)).toEqual([
      '/network/performance/groups?fiscalYear=2025&compareWith=2024&fromMonth=4&toMonth=6&groupBy=specialty',
      '/network/highlights?fiscalYear=2025&fromMonth=4&toMonth=3',
      '/fiscal-years',
    ]);
  });
});

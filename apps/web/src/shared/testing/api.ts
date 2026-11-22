import { of, throwError } from 'rxjs';
import type { Api } from '@shared/api';
import { ApiError } from '@shared/api';

type FakeApi = { [Entity in keyof Api]?: Partial<Api[Entity]> };

const summary = { activeClients: 0, revenue: 0, revenuePerClient: null, churnRate: null };

export const createFakeApi = ({ advisoryFirms, health, network, session }: FakeApi = {}): Api => ({
  advisoryFirms: {
    list: () => of({ items: [], total: 0, nextCursor: null }),
    filters: () => of({ provinces: [], specialties: [] }),
    ...advisoryFirms,
  },
  health: { get: () => of({ status: 'ok' }), ...health },
  network: {
    fiscalYears: () => of({ fiscalYears: [2025, 2024] }),
    performance: (query) => of({ years: [{ fiscalYear: query.fiscalYear, summary, months: [] }] }),
    groups: () => of({ groups: [] }),
    highlights: () => of({ previousFiscalYear: null, needsAttention: [], standouts: [] }),
    ...network,
  },
  session: {
    get: () => throwError(() => new ApiError(401)),
    post: () => throwError(() => new ApiError(401)),
    delete: () => of(undefined),
    ...session,
  },
});

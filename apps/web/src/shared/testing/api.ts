import { of, throwError } from 'rxjs';
import type { Api } from '@shared/api';
import { ApiError } from '@shared/api';

type FakeApi = { [Entity in keyof Api]?: Partial<Api[Entity]> };

const summary = { activeClients: 0, revenue: 0, revenuePerClient: null, churnRate: null };

export const createFakeApi = ({ advisoryFirms, health, network, session }: FakeApi = {}): Api => ({
  advisoryFirms: {
    list: () => of({ items: [], total: 0, nextCursor: null }),
    filters: () => of({ provinces: [], specialties: [] }),
    get: (id) =>
      of({
        id,
        name: `Asesoría ${id}`,
        taxId: 'B00000000',
        province: 'Madrid',
        city: 'Madrid',
        specialty: 'Fiscal',
        onboardedOn: '2020-01-01',
        employees: 10,
      }),
    performance: (_id, query) =>
      of({
        years: [
          {
            fiscalYear: query.fiscalYear,
            summary: { ...summary, taxFilings: 0, revenuePerEmployee: null, incidentRate: null },
            months: [],
          },
        ],
        sixMonthsAgo: null,
        specialty: {
          firms: 0,
          summary: { ...summary, taxFilings: 0, revenuePerEmployee: null, incidentRate: null },
          months: [],
        },
        alerts: [],
        alertsComparedWith: null,
      }),
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

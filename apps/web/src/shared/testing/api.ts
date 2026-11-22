import { of, throwError } from 'rxjs';
import type { Api } from '@shared/api';
import { ApiError } from '@shared/api';

type FakeApi = { [Entity in keyof Api]?: Partial<Api[Entity]> };

const summary = { activeClients: 0, revenue: 0, revenuePerClient: null, churnRate: null };

export const createFakeApi = ({
  advisoryFirms,
  health,
  network,
  session,
  supportAssistant,
}: FakeApi = {}): Api => ({
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
  supportAssistant: {
    start: (firmId) => of({ id: '6b1f5a3e-2c4d-4e8f-9a0b-1c2d3e4f5a6b', firmId, messages: [] }),
    ask: (_firmId, _conversationId, question) =>
      of({
        id: '7c2a6b4f-3d5e-4f9a-8b1c-2d3e4f5a6b7c',
        question,
        answer: 'Sin incidencias.',
        outcome: 'answered',
        sources: [],
        createdAt: '2026-11-22T10:00:00.000Z',
      }),
    ...supportAssistant,
  },
});

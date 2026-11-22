import {
  FiscalYearsSchema,
  NetworkGroupsSchema,
  NetworkHighlightsSchema,
  NetworkPerformanceSchema,
  type FiscalYears,
  type NetworkGroups,
  type NetworkGroupsQuery,
  type NetworkHighlights,
  type NetworkPerformance,
  type NetworkPerformanceQuery,
  type PeriodQuery,
} from '@pulse/contracts';
import type { Observable } from 'rxjs';
import { toSearch, type Request } from './request';

export type NetworkApi = {
  fiscalYears: () => Observable<FiscalYears>;
  performance: (query: NetworkPerformanceQuery) => Observable<NetworkPerformance>;
  groups: (query: NetworkGroupsQuery) => Observable<NetworkGroups>;
  highlights: (query: PeriodQuery) => Observable<NetworkHighlights>;
};

export const createNetworkApi = (request: Request): NetworkApi => ({
  fiscalYears: () => request('GET', '/fiscal-years', FiscalYearsSchema),
  performance: (query) =>
    request('GET', `/network/performance${toSearch(query)}`, NetworkPerformanceSchema),
  groups: (query) =>
    request('GET', `/network/performance/groups${toSearch(query)}`, NetworkGroupsSchema),
  highlights: (query) =>
    request('GET', `/network/highlights${toSearch(query)}`, NetworkHighlightsSchema),
});

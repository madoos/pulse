import {
  AdvisoryFirmSchema,
  FirmPerformanceSchema,
  type AdvisoryFirm,
  type FirmPerformance,
  type NetworkPerformanceQuery,
  AdvisoryFirmFiltersSchema,
  AdvisoryFirmsPageSchema,
  type AdvisoryFirmFilters,
  type AdvisoryFirmsPage,
  type AdvisoryFirmsQuery,
} from '@pulse/contracts';
import type { Observable } from 'rxjs';
import { toSearch, type Request } from './request';

export type AdvisoryFirmsApi = {
  list: (query: AdvisoryFirmsQuery) => Observable<AdvisoryFirmsPage>;
  filters: () => Observable<AdvisoryFirmFilters>;
  get: (id: number) => Observable<AdvisoryFirm>;
  performance: (id: number, query: NetworkPerformanceQuery) => Observable<FirmPerformance>;
};

export const createAdvisoryFirmsApi = (request: Request): AdvisoryFirmsApi => ({
  list: (query) => request('GET', `/advisory-firms${toSearch(query)}`, AdvisoryFirmsPageSchema),
  filters: () => request('GET', '/advisory-firms/filters', AdvisoryFirmFiltersSchema),
  get: (id) => request('GET', `/advisory-firms/${id}`, AdvisoryFirmSchema),
  performance: (id, query) =>
    request('GET', `/advisory-firms/${id}/performance${toSearch(query)}`, FirmPerformanceSchema),
});

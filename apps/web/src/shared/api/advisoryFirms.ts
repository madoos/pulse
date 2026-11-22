import {
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
};

export const createAdvisoryFirmsApi = (request: Request): AdvisoryFirmsApi => ({
  list: (query) => request('GET', `/advisory-firms${toSearch(query)}`, AdvisoryFirmsPageSchema),
  filters: () => request('GET', '/advisory-firms/filters', AdvisoryFirmFiltersSchema),
});

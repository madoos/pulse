import { createAdvisoryFirmsApi, type AdvisoryFirmsApi } from './advisoryFirms';
import { createHealthApi, type HealthApi } from './health';
import { createNetworkApi, type NetworkApi } from './network';
import { createRequest } from './request';
import { createSessionApi, type SessionApi } from './session';

export type Api = {
  advisoryFirms: AdvisoryFirmsApi;
  health: HealthApi;
  network: NetworkApi;
  session: SessionApi;
};

export const createHttpApi = (baseUrl: string): Api => {
  const request = createRequest(baseUrl);
  return {
    advisoryFirms: createAdvisoryFirmsApi(request),
    health: createHealthApi(request),
    network: createNetworkApi(request),
    session: createSessionApi(request),
  };
};

export { ApiError } from './request';

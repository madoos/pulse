import { createAdvisoryFirmsApi, type AdvisoryFirmsApi } from './advisoryFirms';
import { createHealthApi, type HealthApi } from './health';
import { createNetworkApi, type NetworkApi } from './network';
import { createRequest } from './request';
import { createSessionApi, type SessionApi } from './session';
import { createSupportAssistantApi, type SupportAssistantApi } from './supportAssistant';

export type Api = {
  advisoryFirms: AdvisoryFirmsApi;
  health: HealthApi;
  network: NetworkApi;
  session: SessionApi;
  supportAssistant: SupportAssistantApi;
};

export const createHttpApi = (baseUrl: string): Api => {
  const request = createRequest(baseUrl);
  return {
    advisoryFirms: createAdvisoryFirmsApi(request),
    health: createHealthApi(request),
    network: createNetworkApi(request),
    session: createSessionApi(request),
    supportAssistant: createSupportAssistantApi(request),
  };
};

export { ApiError } from './request';

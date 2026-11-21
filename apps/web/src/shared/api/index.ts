import { createHealthApi, type HealthApi } from './health';
import { createRequest } from './request';
import { createSessionApi, type SessionApi } from './session';

export type Api = {
  health: HealthApi;
  session: SessionApi;
};

export const createHttpApi = (baseUrl: string): Api => {
  const request = createRequest(baseUrl);
  return { health: createHealthApi(request), session: createSessionApi(request) };
};

export { ApiError } from './request';

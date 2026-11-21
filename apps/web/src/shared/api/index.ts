import { createHealthApi, type HealthApi } from './health';
import { createRequest } from './request';

export type Api = {
  health: HealthApi;
};

export const createHttpApi = (baseUrl: string): Api => {
  const request = createRequest(baseUrl);
  return { health: createHealthApi(request) };
};

export { ApiError } from './request';

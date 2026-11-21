import { HealthSchema, type Health } from '@pulse/contracts';
import type { Observable } from 'rxjs';
import type { Request } from './request';

export type HealthApi = {
  get: () => Observable<Health>;
};

export const createHealthApi = (request: Request): HealthApi => ({
  get: () => request('GET', '/health', HealthSchema),
});

import { SessionSchema, type LogIn, type Session } from '@pulse/contracts';
import type { Observable } from 'rxjs';
import { noContent, type Request } from './request';

export type SessionApi = {
  get: () => Observable<Session>;
  post: (credentials: LogIn) => Observable<Session>;
  delete: () => Observable<void>;
};

export const createSessionApi = (request: Request): SessionApi => ({
  get: () => request('GET', '/session', SessionSchema),
  post: (credentials) => request('POST', '/session', SessionSchema, credentials),
  delete: () => request('DELETE', '/session', noContent),
});

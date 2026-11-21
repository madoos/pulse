import { defer, type Observable } from 'rxjs';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Schema<T> = { parse: (data: unknown) => T };

export type Request = <T>(
  method: Method,
  path: string,
  schema: Schema<T>,
  body?: unknown,
) => Observable<T>;

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API request failed with status ${status}`);
  }
}

export const createRequest =
  (baseUrl: string): Request =>
  (method, path, schema, body) =>
    defer(async () => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        ...(body === undefined
          ? {}
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new ApiError(response.status);
      return schema.parse(await response.json());
    });

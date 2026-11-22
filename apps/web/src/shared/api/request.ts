import { defer, type Observable } from 'rxjs';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Schema<T> = { parse: (data: unknown) => T };

export const noContent: Schema<void> = { parse: () => undefined };

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
        credentials: 'include',
        ...(body === undefined
          ? {}
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new ApiError(response.status);
      return schema.parse(response.status === 204 ? undefined : await response.json());
    });

/** The query string of a request, leaving out the values that are not given. */
export const toSearch = (query: Record<string, string | number | null | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : '';
};

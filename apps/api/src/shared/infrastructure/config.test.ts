import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('defaults to production on port 3000', () => {
    expect(loadConfig({})).toEqual({ NODE_ENV: 'production', PORT: 3000 });
  });

  it('requires the allowed CORS origin in development', () => {
    expect(() => loadConfig({ NODE_ENV: 'development' })).toThrow('CORS_ORIGIN');
    expect(
      loadConfig({ NODE_ENV: 'development', CORS_ORIGIN: 'http://localhost:8080' }),
    ).toMatchObject({ NODE_ENV: 'development', CORS_ORIGIN: 'http://localhost:8080' });
  });
});

import { describe, expect, it } from 'vitest';
import { loadConfig } from '.';

describe('loadConfig', () => {
  it('reads the API URL from the runtime config', () => {
    expect(loadConfig({ apiUrl: 'https://example.test/api/v1/' })).toMatchObject({
      apiUrl: 'https://example.test/api/v1',
    });
  });

  it('fails when the API URL is missing', () => {
    expect(() => loadConfig({})).toThrow('apiUrl');
  });

  it('runs in development without error monitoring unless the deployment says otherwise', () => {
    expect(loadConfig({ apiUrl: '/api/v1' })).toEqual({
      apiUrl: '/api/v1',
      environment: 'development',
      sentryDsn: undefined,
    });
  });

  it('reads the environment and the Sentry DSN of the deployment', () => {
    const deployment = {
      environment: 'production',
      sentryDsn: 'https://key@o1.ingest.sentry.io/1',
    };

    expect(loadConfig({ apiUrl: '/api/v1', ...deployment })).toMatchObject(deployment);
  });

  it('treats empty values as missing', () => {
    expect(loadConfig({ apiUrl: '/api/v1', environment: '', sentryDsn: '' })).toMatchObject({
      environment: 'development',
      sentryDsn: undefined,
    });
  });
});

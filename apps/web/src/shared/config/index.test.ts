import { describe, expect, it } from 'vitest';
import { loadConfig } from '.';

describe('loadConfig', () => {
  it('reads the API URL from the runtime config', () => {
    expect(loadConfig({ apiUrl: 'https://example.test/api/v1/' })).toEqual({
      apiUrl: 'https://example.test/api/v1',
    });
  });

  it('fails when the API URL is missing', () => {
    expect(() => loadConfig({})).toThrow('apiUrl');
  });
});

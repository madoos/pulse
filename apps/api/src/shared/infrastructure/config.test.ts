import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const DATABASE_URL = 'postgres://pulse:pulse@localhost:5432/pulse';
const JWT_SECRET = 'a-secret-of-at-least-thirty-two-chars';
const required = { DATABASE_URL, JWT_SECRET };

describe('loadConfig', () => {
  it('defaults to production on port 3000', () => {
    expect(loadConfig(required)).toEqual({ NODE_ENV: 'production', PORT: 3000, ...required });
  });

  it('requires the database URL', () => {
    expect(() => loadConfig({ JWT_SECRET })).toThrow('DATABASE_URL');
  });

  it('requires a signing secret of at least 32 characters', () => {
    expect(() => loadConfig({ DATABASE_URL })).toThrow('JWT_SECRET');
    expect(() => loadConfig({ DATABASE_URL, JWT_SECRET: 'short' })).toThrow('JWT_SECRET');
  });

  it('requires the allowed CORS origin in development', () => {
    expect(() => loadConfig({ ...required, NODE_ENV: 'development' })).toThrow('CORS_ORIGIN');
    expect(
      loadConfig({ ...required, NODE_ENV: 'development', CORS_ORIGIN: 'http://localhost:8080' }),
    ).toMatchObject({ NODE_ENV: 'development', CORS_ORIGIN: 'http://localhost:8080' });
  });
});

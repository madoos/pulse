import * as Sentry from '@sentry/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PERSONAL_OR_BUSINESS_DATA, startErrorMonitoring } from '.';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  reactErrorHandler: vi.fn(() => vi.fn()),
  ErrorBoundary: vi.fn(),
}));

const DSN = 'https://key@o1.ingest.sentry.io/1';

describe('startErrorMonitoring', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not start Sentry in development, even with a DSN', () => {
    expect(startErrorMonitoring({ environment: 'development', dsn: DSN })).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not start Sentry without a DSN', () => {
    expect(startErrorMonitoring({ environment: 'production' })).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts Sentry in production with the release, without personal data', () => {
    expect(
      startErrorMonitoring({ environment: 'production', dsn: DSN, release: 'web@1.2.3' }),
    ).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: DSN,
      environment: 'production',
      release: 'web@1.2.3',
      dataCollection: NO_PERSONAL_OR_BUSINESS_DATA,
    });
  });
});

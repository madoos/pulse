import * as Sentry from '@sentry/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createErrorReporter, NO_PERSONAL_OR_BUSINESS_DATA } from '.';

vi.mock('@sentry/node', () => ({ init: vi.fn(), captureException: vi.fn() }));

const DSN = 'https://key@o1.ingest.sentry.io/1';

describe('createErrorReporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not start Sentry without a DSN', () => {
    const report = createErrorReporter({ enabled: true, environment: 'production' });

    report(new Error('boom'));

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('does not start Sentry outside production, even with a DSN', () => {
    const report = createErrorReporter({ enabled: false, dsn: DSN, environment: 'development' });

    report(new Error('boom'));

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('starts Sentry with the environment and the release, without personal data', () => {
    createErrorReporter({
      enabled: true,
      dsn: DSN,
      environment: 'production',
      release: 'api@1.2.3',
    });

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: DSN,
      environment: 'production',
      release: 'api@1.2.3',
      dataCollection: NO_PERSONAL_OR_BUSINESS_DATA,
    });
  });

  it('reports errors to Sentry', () => {
    const error = new Error('boom');

    createErrorReporter({ enabled: true, dsn: DSN, environment: 'production' })(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});

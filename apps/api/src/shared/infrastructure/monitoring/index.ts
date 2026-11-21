import * as Sentry from '@sentry/node';
import type { NodeOptions } from '@sentry/node';

export type MonitoringOptions = {
  /** Errors are sent only when enabled (in production) and a DSN is configured. */
  enabled: boolean;
  dsn?: string;
  environment: string;
  release?: string;
};

export type ErrorReporter = (error: unknown) => void;

/**
 * Events carry the error and its stack trace, but no personal or business data: Sentry collects
 * users, cookies, headers, bodies, query parameters, database queries and local variables by default.
 */
export const NO_PERSONAL_OR_BUSINESS_DATA: NodeOptions['dataCollection'] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  stackFrameVariables: false,
};

/**
 * Starts error monitoring with Sentry and returns the function that reports an error.
 * Outside production, or without a DSN, nothing is sent and errors are only logged.
 */
export const createErrorReporter = ({
  enabled,
  dsn,
  environment,
  release,
}: MonitoringOptions): ErrorReporter => {
  if (!enabled || !dsn) return () => {};

  Sentry.init({
    dsn,
    environment,
    release,
    dataCollection: NO_PERSONAL_OR_BUSINESS_DATA,
  });

  return (error) => {
    Sentry.captureException(error);
  };
};

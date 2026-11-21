import * as Sentry from '@sentry/react';

export type MonitoringOptions = {
  environment: string;
  dsn?: string;
  release?: string;
};

/**
 * Events carry the error and its stack trace, but no personal or business data: Sentry collects
 * users, cookies, headers, bodies and query parameters by default.
 */
export const NO_PERSONAL_OR_BUSINESS_DATA: Sentry.BrowserOptions['dataCollection'] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  stackFrameVariables: false,
};

/**
 * Starts error monitoring with Sentry, only in production and with a DSN.
 * Returns whether it started; in development nothing is sent.
 */
export const startErrorMonitoring = ({ environment, dsn, release }: MonitoringOptions): boolean => {
  if (environment !== 'production' || !dsn) return false;

  Sentry.init({ dsn, environment, release, dataCollection: NO_PERSONAL_OR_BUSINESS_DATA });
  return true;
};

/** React root options that report the errors React catches, uncaught or recovered. */
export const reactErrorHandlers = {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
};

export const ErrorBoundary = Sentry.ErrorBoundary;

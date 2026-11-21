export type Config = {
  apiUrl: string;
  /** Where the web runs: `production` only in the deployment. */
  environment: string;
  /** Sentry DSN for error monitoring, set only in the deployment. */
  sentryDsn?: string;
};

declare global {
  interface Window {
    __CONFIG__?: Partial<Config>;
  }
}

export const loadConfig = (runtime: Partial<Config> | undefined = window.__CONFIG__): Config => {
  if (!runtime?.apiUrl) throw new Error('Missing runtime config: apiUrl');
  return {
    apiUrl: runtime.apiUrl.replace(/\/$/, ''),
    environment: runtime.environment || 'development',
    sentryDsn: runtime.sentryDsn || undefined,
  };
};

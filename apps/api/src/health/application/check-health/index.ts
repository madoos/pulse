import type { HealthIndicator } from '@health/domain/HealthIndicator';
import type { HealthStatus } from '@health/domain/HealthStatus';

export type CheckHealth = () => Promise<HealthStatus>;

export const makeCheckHealth =
  (indicators: HealthIndicator[]): CheckHealth =>
  async () => {
    const results = await Promise.all(indicators.map((indicator) => indicator.isUp()));
    return { status: results.every(Boolean) ? 'ok' : 'down' };
  };

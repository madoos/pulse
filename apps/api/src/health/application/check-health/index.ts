import type { HealthStatus } from '@health/domain/HealthStatus';

export type CheckHealth = () => HealthStatus;

export const checkHealth: CheckHealth = () => ({ status: 'ok' });

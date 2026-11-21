import type { HealthIndicator } from '@health/domain/HealthIndicator';
import { describe, expect, it } from 'vitest';
import { makeCheckHealth } from '.';

const indicator = (isUp: boolean): HealthIndicator => ({
  name: 'test',
  isUp: async () => isUp,
});

describe('checkHealth', () => {
  it('reports the service as up when every indicator is up', async () => {
    await expect(makeCheckHealth([indicator(true), indicator(true)])()).resolves.toEqual({
      status: 'ok',
    });
  });

  it('reports the service as down when any indicator is down', async () => {
    await expect(makeCheckHealth([indicator(true), indicator(false)])()).resolves.toEqual({
      status: 'down',
    });
  });
});

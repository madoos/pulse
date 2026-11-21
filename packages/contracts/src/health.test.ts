import { describe, expect, it } from 'vitest';
import { HealthSchema } from './health';

describe('HealthSchema', () => {
  it('accepts a healthy and an unhealthy status', () => {
    expect(HealthSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
    expect(HealthSchema.parse({ status: 'down' })).toEqual({ status: 'down' });
  });

  it('rejects any other status', () => {
    expect(HealthSchema.safeParse({ status: 'unknown' }).success).toBe(false);
  });
});

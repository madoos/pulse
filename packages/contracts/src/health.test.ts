import { describe, expect, it } from 'vitest';
import { HealthSchema } from './health';

describe('HealthSchema', () => {
  it('accepts a healthy status', () => {
    expect(HealthSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it('rejects any other status', () => {
    expect(HealthSchema.safeParse({ status: 'down' }).success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { checkHealth } from '.';

describe('checkHealth', () => {
  it('reports that the service is up', () => {
    expect(checkHealth()).toEqual({ status: 'ok' });
  });
});

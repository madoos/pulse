import { describe, expect, it } from 'vitest';
import {
  checkFailed,
  checkRequested,
  checkSucceeded,
  systemStatusSlice,
} from './systemStatus.slice';

const reduce = systemStatusSlice.reducer;

describe('system status slice', () => {
  it('starts checking', () => {
    expect(reduce(undefined, { type: 'unknown' })).toEqual({ status: 'checking' });
  });

  it('checks again when asked', () => {
    expect(reduce({ status: 'down' }, checkRequested())).toEqual({ status: 'checking' });
  });

  it('is up when the check succeeds', () => {
    expect(reduce({ status: 'checking' }, checkSucceeded())).toEqual({ status: 'up' });
  });

  it('is down when the check fails', () => {
    expect(reduce({ status: 'checking' }, checkFailed())).toEqual({ status: 'down' });
  });
});

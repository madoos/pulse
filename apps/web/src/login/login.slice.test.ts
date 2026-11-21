import { describe, expect, it } from 'vitest';
import { loginFailed, loginRequested, loginSlice, loginSucceeded } from './login.slice';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };
const credentials = { email: 'ana@example.com', password: 'correct horse' };
const reduce = loginSlice.reducer;

describe('login slice', () => {
  it('starts idle', () => {
    expect(reduce(undefined, { type: 'unknown' })).toEqual({ status: 'idle' });
  });

  it('is submitting while the credentials are checked', () => {
    expect(reduce({ status: 'rejected' }, loginRequested(credentials))).toEqual({
      status: 'submitting',
    });
  });

  it('goes back to idle when the login succeeds', () => {
    expect(reduce({ status: 'submitting' }, loginSucceeded(ana))).toEqual({ status: 'idle' });
  });

  it('keeps why the login failed', () => {
    expect(reduce({ status: 'submitting' }, loginFailed('rejected'))).toEqual({
      status: 'rejected',
    });
    expect(reduce({ status: 'submitting' }, loginFailed('unavailable'))).toEqual({
      status: 'unavailable',
    });
  });
});

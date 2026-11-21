import { loginSucceeded } from '@login/login.slice';
import { describe, expect, it } from 'vitest';
import {
  loggedOut,
  sessionFound,
  sessionMissing,
  sessionRequested,
  sessionSlice,
  type SessionState,
} from './session.slice';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };
const reduce = sessionSlice.reducer;
const authenticated: SessionState = { status: 'authenticated', user: ana };

describe('session slice', () => {
  it('starts without knowing whether there is a session', () => {
    expect(reduce(undefined, { type: 'unknown' })).toEqual({ status: 'unknown', user: null });
  });

  it('is checking while the session is requested', () => {
    expect(reduce(undefined, sessionRequested())).toEqual({ status: 'checking', user: null });
  });

  it('keeps the user of the session found', () => {
    expect(reduce(undefined, sessionFound(ana))).toEqual(authenticated);
  });

  it('is anonymous when there is no session', () => {
    expect(reduce(undefined, sessionMissing())).toEqual({ status: 'anonymous', user: null });
  });

  it('starts a session when the login succeeds', () => {
    expect(reduce(undefined, loginSucceeded(ana))).toEqual(authenticated);
  });

  it('forgets the user when logging out', () => {
    expect(reduce(authenticated, loggedOut())).toEqual({ status: 'anonymous', user: null });
  });
});

import type { Action } from '@reduxjs/toolkit';
import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { of, throwError } from 'rxjs';
import { describe, it } from 'vitest';
import { getSessionEpic, logOutEpic } from './session.epics';
import {
  logOutRequested,
  loggedOut,
  sessionFound,
  sessionMissing,
  sessionRequested,
} from './session.slice';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };
const once = (action: Action) => ({
  marbles: '-a',
  values: { a: action },
});

describe('getSessionEpic', () => {
  it('finds the active session', () => {
    expectEpic(getSessionEpic, {
      api: () => createFakeApi({ session: { get: () => of({ user: ana }) } }),
      actions: once(sessionRequested()),
      expected: { marbles: '-b', values: { b: sessionFound(ana) } },
    });
  });

  it('reports a missing session when the API rejects it', () => {
    expectEpic(getSessionEpic, {
      api: () => createFakeApi(),
      actions: once(sessionRequested()),
      expected: { marbles: '-b', values: { b: sessionMissing() } },
    });
  });
});

describe('logOutEpic', () => {
  it('logs out', () => {
    expectEpic(logOutEpic, {
      api: () => createFakeApi(),
      actions: once(logOutRequested()),
      expected: { marbles: '-b', values: { b: loggedOut() } },
    });
  });

  it('logs out even when the API cannot be reached', () => {
    expectEpic(logOutEpic, {
      api: () =>
        createFakeApi({ session: { delete: () => throwError(() => new Error('offline')) } }),
      actions: once(logOutRequested()),
      expected: { marbles: '-b', values: { b: loggedOut() } },
    });
  });
});

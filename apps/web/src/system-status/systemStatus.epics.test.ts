import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { of, throwError } from 'rxjs';
import { describe, it } from 'vitest';
import { checkSystemStatusEpic } from './systemStatus.epics';
import { checkFailed, checkRequested, checkSucceeded } from './systemStatus.slice';

const requested = (marbles: string) => ({ marbles, values: { a: checkRequested() } });

describe('checkSystemStatusEpic', () => {
  it('reports the API as up when the health check succeeds', () => {
    expectEpic(checkSystemStatusEpic, {
      api: () => createFakeApi({ health: { get: () => of({ status: 'ok' }) } }),
      actions: requested('-a'),
      expected: { marbles: '-b', values: { b: checkSucceeded() } },
    });
  });

  it('reports the API as down when the health check fails', () => {
    expectEpic(checkSystemStatusEpic, {
      api: () => createFakeApi({ health: { get: () => throwError(() => new Error('down')) } }),
      actions: requested('-a'),
      expected: { marbles: '-b', values: { b: checkFailed() } },
    });
  });

  it('cancels a pending check when a new one is requested', () => {
    expectEpic(checkSystemStatusEpic, {
      api: (cold) =>
        createFakeApi({ health: { get: () => cold('---h', { h: { status: 'ok' } }) } }),
      actions: requested('-a-a'),
      expected: { marbles: '------b', values: { b: checkSucceeded() } },
    });
  });
});

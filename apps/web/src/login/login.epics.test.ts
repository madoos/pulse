import { ApiError } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { throwError } from 'rxjs';
import { describe, it } from 'vitest';
import { loginEpic } from './login.epics';
import { loginFailed, loginRequested, loginSucceeded } from './login.slice';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };
const credentials = { email: 'ana@example.com', password: 'correct horse' };
const requested = { marbles: '-a', values: { a: loginRequested(credentials) } };

describe('loginEpic', () => {
  it('logs in and ignores new attempts while one is pending', () => {
    expectEpic(loginEpic, {
      api: (cold) => createFakeApi({ session: { post: () => cold('---s', { s: { user: ana } }) } }),
      actions: { marbles: '-a-a', values: requested.values },
      expected: { marbles: '----b', values: { b: loginSucceeded(ana) } },
    });
  });

  it('reports wrong credentials', () => {
    expectEpic(loginEpic, {
      api: () => createFakeApi(),
      actions: requested,
      expected: { marbles: '-b', values: { b: loginFailed('rejected') } },
    });
  });

  it('reports an unavailable API', () => {
    expectEpic(loginEpic, {
      api: () => createFakeApi({ session: { post: () => throwError(() => new ApiError(503)) } }),
      actions: requested,
      expected: { marbles: '-b', values: { b: loginFailed('unavailable') } },
    });
  });
});

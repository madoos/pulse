import type { Action } from '@reduxjs/toolkit';
import { ApiError, type Api } from '@shared/api';
import type { Epic } from 'redux-observable';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';
import { loginFailed, loginRequested, loginSucceeded } from './login.slice';

export const loginEpic: Epic<Action, Action, unknown, { api: Api }> = (action$, _state$, { api }) =>
  action$.pipe(
    filter(loginRequested.match),
    exhaustMap(({ payload }) =>
      api.session.post(payload).pipe(
        map(({ user }) => loginSucceeded(user)),
        catchError((error: unknown) =>
          of(
            loginFailed(
              error instanceof ApiError && [400, 401].includes(error.status)
                ? 'rejected'
                : 'unavailable',
            ),
          ),
        ),
      ),
    ),
  );

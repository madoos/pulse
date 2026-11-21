import type { Action } from '@reduxjs/toolkit';
import type { Api } from '@shared/api';
import type { Epic } from 'redux-observable';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { checkFailed, checkRequested, checkSucceeded } from './systemStatus.slice';

export const checkSystemStatusEpic: Epic<Action, Action, unknown, { api: Api }> = (
  action$,
  _state$,
  { api },
) =>
  action$.pipe(
    filter(checkRequested.match),
    switchMap(() =>
      api.health.get().pipe(
        map(() => checkSucceeded()),
        catchError(() => of(checkFailed())),
      ),
    ),
  );

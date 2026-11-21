import type { Action } from '@reduxjs/toolkit';
import type { Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import { catchError, exhaustMap, filter, map, of, switchMap } from 'rxjs';
import {
  logOutRequested,
  loggedOut,
  sessionFound,
  sessionMissing,
  sessionRequested,
} from './session.slice';

type SessionEpic = Epic<Action, Action, unknown, { api: Api }>;

export const getSessionEpic: SessionEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(sessionRequested.match),
    switchMap(() =>
      api.session.get().pipe(
        map(({ user }) => sessionFound(user)),
        catchError(() => of(sessionMissing())),
      ),
    ),
  );

export const logOutEpic: SessionEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(logOutRequested.match),
    exhaustMap(() =>
      api.session.delete().pipe(
        map(() => loggedOut()),
        catchError(() => of(loggedOut())),
      ),
    ),
  );

export const sessionEpic = combineEpics(getSessionEpic, logOutEpic);

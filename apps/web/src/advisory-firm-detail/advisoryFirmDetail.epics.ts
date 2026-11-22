import type { Action } from '@reduxjs/toolkit';
import { sameQuery } from '@shared/period-filters/period.filters';
import { ApiError, type Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import { catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import {
  firmFailed,
  firmFiltersChanged,
  firmLoaded,
  firmNotFound,
  firmPerformanceFailed,
  firmPerformanceLoaded,
  firmPerformanceRequested,
  firmRequested,
} from './advisoryFirmDetail.slice';

type DetailEpic = Epic<Action, Action, unknown, { api: Api }>;

/** Opening another firm cancels the request of the previous one. */
export const loadFirmEpic: DetailEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(firmRequested.match),
    switchMap(({ payload }) =>
      api.advisoryFirms.get(payload).pipe(
        map((firm) => firmLoaded(firm)),
        catchError((error: unknown) =>
          of(error instanceof ApiError && error.status === 404 ? firmNotFound() : firmFailed()),
        ),
      ),
    ),
  );

/** The performance only reloads when the firm or the filters change. */
export const requestFirmPerformanceEpic: DetailEpic = (action$) =>
  action$.pipe(
    filter(firmFiltersChanged.match),
    map(({ payload }) => payload),
    distinctUntilChanged(sameQuery),
    map((request) => firmPerformanceRequested(request)),
  );

export const loadFirmPerformanceEpic: DetailEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(firmPerformanceRequested.match),
    switchMap(({ payload: { firmId, query } }) =>
      api.advisoryFirms.performance(firmId, query).pipe(
        map((performance) => firmPerformanceLoaded(performance)),
        catchError(() => of(firmPerformanceFailed())),
      ),
    ),
  );

export const advisoryFirmDetailEpic = combineEpics(
  loadFirmEpic,
  requestFirmPerformanceEpic,
  loadFirmPerformanceEpic,
);

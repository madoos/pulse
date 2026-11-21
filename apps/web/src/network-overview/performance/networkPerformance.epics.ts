import type { Action } from '@reduxjs/toolkit';
import { performanceQueryOf, sameQuery } from '@network-overview/networkOverview.filters';
import { networkFiltersChanged } from '@network-overview/networkOverview.slice';
import type { Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import { catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import {
  performanceFailed,
  performanceLoaded,
  performanceRequested,
} from './networkPerformance.slice';

type NetworkEpic = Epic<Action, Action, unknown, { api: Api }>;

/** Asks for the network again only when its query changes: grouping does not reload it. */
export const requestPerformanceEpic: NetworkEpic = (action$) =>
  action$.pipe(
    filter(networkFiltersChanged.match),
    map(({ payload }) => performanceQueryOf(payload)),
    distinctUntilChanged(sameQuery),
    map((query) => performanceRequested(query)),
  );

/** Loads the network, cancelling the request of a previous query. */
export const loadPerformanceEpic: NetworkEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(performanceRequested.match),
    switchMap(({ payload }) =>
      api.network.performance(payload).pipe(
        map((data) => performanceLoaded(data)),
        catchError(() => of(performanceFailed())),
      ),
    ),
  );

export const networkPerformanceEpic = combineEpics(requestPerformanceEpic, loadPerformanceEpic);

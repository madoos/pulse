import type { Action } from '@reduxjs/toolkit';
import { periodQueryOf, sameQuery } from '@network-overview/networkOverview.filters';
import { networkFiltersChanged } from '@network-overview/networkOverview.slice';
import type { Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import { catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { highlightsFailed, highlightsLoaded, highlightsRequested } from './networkHighlights.slice';

type NetworkEpic = Epic<Action, Action, unknown, { api: Api }>;

/** The highlights depend only on the period: comparing or grouping does not reload them. */
export const requestHighlightsEpic: NetworkEpic = (action$) =>
  action$.pipe(
    filter(networkFiltersChanged.match),
    map(({ payload }) => periodQueryOf(payload)),
    distinctUntilChanged(sameQuery),
    map((query) => highlightsRequested(query)),
  );

export const loadHighlightsEpic: NetworkEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(highlightsRequested.match),
    switchMap(({ payload }) =>
      api.network.highlights(payload).pipe(
        map((data) => highlightsLoaded(data)),
        catchError(() => of(highlightsFailed())),
      ),
    ),
  );

export const networkHighlightsEpic = combineEpics(requestHighlightsEpic, loadHighlightsEpic);

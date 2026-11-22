import type { Action } from '@reduxjs/toolkit';
import type { Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  merge,
  of,
  repeat,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  firmFiltersFailed,
  firmFiltersLoaded,
  firmFiltersRequested,
  firmsListingClosed,
  firmsQueryChanged,
  firstPageFailed,
  firstPageLoaded,
  firstPageRequested,
  nextPageFailed,
  nextPageLoaded,
  nextPageRequested,
  type FirmsQuery,
} from './firmsListing.slice';

type FirmsEpic = Epic<Action, Action, unknown, { api: Api }>;

/** How long the search waits for the user to stop typing before asking the API. */
export const SEARCH_DEBOUNCE_MS = 300;

export const sameFirmsQuery = (a: FirmsQuery, b: FirmsQuery) =>
  a.search.trim() === b.search.trim() && a.province === b.province && a.specialty === b.specialty;

const toApiQuery = ({ search, province, specialty }: FirmsQuery) => ({
  search: search.trim() || undefined,
  province: province ?? undefined,
  specialty: specialty ?? undefined,
});

/**
 * Asks for the first page once the user stops typing, and only if the query changed.
 * Closing the drawer forgets the last query, so opening it again loads the listing.
 */
export const requestFirstPageEpic: FirmsEpic = (action$) =>
  action$.pipe(
    filter(firmsQueryChanged.match),
    map(({ payload }) => payload),
    debounceTime(SEARCH_DEBOUNCE_MS),
    distinctUntilChanged(sameFirmsQuery),
    map((query) => firstPageRequested(query)),
    takeUntil(action$.pipe(filter(firmsListingClosed.match))),
    repeat(),
  );

/** A new query cancels the request of the previous one, so a slow answer never wins. */
export const loadFirstPageEpic: FirmsEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(firstPageRequested.match),
    switchMap(({ payload }) =>
      api.advisoryFirms.list(toApiQuery(payload)).pipe(
        map((page) => firstPageLoaded(page)),
        catchError(() => of(firstPageFailed())),
        takeUntil(action$.pipe(filter(firmsListingClosed.match))),
      ),
    ),
  );

/**
 * Asks for the next page while none is loading: scrolling fast never asks twice. A new
 * query or closing the drawer drops the page in flight.
 */
export const loadNextPageEpic: FirmsEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(nextPageRequested.match),
    exhaustMap(({ payload: { query, cursor } }) =>
      api.advisoryFirms.list({ ...toApiQuery(query), cursor }).pipe(
        map((page) => nextPageLoaded(page)),
        catchError(() => of(nextPageFailed())),
        takeUntil(
          merge(
            action$.pipe(filter(firstPageRequested.match)),
            action$.pipe(filter(firmsListingClosed.match)),
          ),
        ),
      ),
    ),
  );

export const loadFirmFiltersEpic: FirmsEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(firmFiltersRequested.match),
    exhaustMap(() =>
      api.advisoryFirms.filters().pipe(
        map((filters) => firmFiltersLoaded(filters)),
        catchError(() => of(firmFiltersFailed())),
      ),
    ),
  );

export const firmsListingEpic = combineEpics(
  requestFirstPageEpic,
  loadFirstPageEpic,
  loadNextPageEpic,
  loadFirmFiltersEpic,
);

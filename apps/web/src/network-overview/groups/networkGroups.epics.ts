import type { NetworkGroupsQuery } from '@pulse/contracts';
import type { Action } from '@reduxjs/toolkit';
import { groupsQueryOf, sameQuery } from '@network-overview/networkOverview.filters';
import { networkFiltersChanged } from '@network-overview/networkOverview.slice';
import type { Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import { catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { groupsFailed, groupsLoaded, groupsRequested } from './networkGroups.slice';

type NetworkEpic = Epic<Action, Action, unknown, { api: Api }>;

/** Asks for the groups only while the network is grouped, and only when their query changes. */
export const requestGroupsEpic: NetworkEpic = (action$) =>
  action$.pipe(
    filter(networkFiltersChanged.match),
    map(({ payload }) => groupsQueryOf(payload)),
    filter((query): query is NetworkGroupsQuery => query !== null),
    distinctUntilChanged(sameQuery),
    map((query) => groupsRequested(query)),
  );

export const loadGroupsEpic: NetworkEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(groupsRequested.match),
    switchMap(({ payload }) =>
      api.network.groups(payload).pipe(
        map((data) => groupsLoaded(data)),
        catchError(() => of(groupsFailed())),
      ),
    ),
  );

export const networkGroupsEpic = combineEpics(requestGroupsEpic, loadGroupsEpic);

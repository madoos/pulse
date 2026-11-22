import type { Action } from '@reduxjs/toolkit';
import type { Api } from '@shared/api';
import type { Epic } from 'redux-observable';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { fiscalYearsFailed, fiscalYearsLoaded, fiscalYearsRequested } from './fiscalYears.slice';

export const loadFiscalYearsEpic: Epic<Action, Action, unknown, { api: Api }> = (
  action$,
  _state$,
  { api },
) =>
  action$.pipe(
    filter(fiscalYearsRequested.match),
    switchMap(() =>
      api.network.fiscalYears().pipe(
        map(({ fiscalYears }) => fiscalYearsLoaded(fiscalYears)),
        catchError(() => of(fiscalYearsFailed())),
      ),
    ),
  );

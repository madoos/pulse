import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { of, throwError } from 'rxjs';
import { describe, it } from 'vitest';
import { loadFiscalYearsEpic } from './networkOverview.epics';
import {
  fiscalYearsFailed,
  fiscalYearsLoaded,
  fiscalYearsRequested,
} from './networkOverview.slice';

const requested = { marbles: '-a', values: { a: fiscalYearsRequested() } };

describe('loadFiscalYearsEpic', () => {
  it('loads the fiscal years', () => {
    expectEpic(loadFiscalYearsEpic, {
      api: () =>
        createFakeApi({ network: { fiscalYears: () => of({ fiscalYears: [2025, 2024] }) } }),
      actions: requested,
      expected: { marbles: '-b', values: { b: fiscalYearsLoaded([2025, 2024]) } },
    });
  });

  it('fails when the API does not answer', () => {
    expectEpic(loadFiscalYearsEpic, {
      api: () =>
        createFakeApi({ network: { fiscalYears: () => throwError(() => new Error('down')) } }),
      actions: requested,
      expected: { marbles: '-b', values: { b: fiscalYearsFailed() } },
    });
  });
});

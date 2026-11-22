import { ApiError } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { throwError } from 'rxjs';
import { describe, it } from 'vitest';
import {
  loadFirmEpic,
  loadFirmPerformanceEpic,
  requestFirmPerformanceEpic,
} from './advisoryFirmDetail.epics';
import {
  firmFailed,
  firmFiltersChanged,
  firmNotFound,
  firmPerformanceFailed,
  firmPerformanceRequested,
  firmRequested,
} from './advisoryFirmDetail.slice';

const request = (firmId: number, fiscalYear: number) => ({
  firmId,
  query: { fiscalYear, fromMonth: 4, toMonth: 3 },
});

describe('loadFirmEpic', () => {
  it('tells a firm that does not exist from an API that does not answer', () => {
    expectEpic(loadFirmEpic, {
      api: () =>
        createFakeApi({
          advisoryFirms: {
            get: (id) => throwError(() => (id === 1 ? new ApiError(404) : new Error('down'))),
          },
        }),
      actions: { marbles: '-a-b', values: { a: firmRequested(1), b: firmRequested(2) } },
      expected: { marbles: '-n-f', values: { n: firmNotFound(), f: firmFailed() } },
    });
  });
});

describe('requestFirmPerformanceEpic', () => {
  it('reloads only when the firm or the filters change', () => {
    expectEpic(requestFirmPerformanceEpic, {
      api: () => createFakeApi(),
      actions: {
        marbles: '-aabc',
        values: {
          a: firmFiltersChanged(request(7, 2025)),
          b: firmFiltersChanged(request(7, 2024)),
          c: firmFiltersChanged(request(8, 2024)),
        },
      },
      expected: {
        marbles: '-a-bc',
        values: {
          a: firmPerformanceRequested(request(7, 2025)),
          b: firmPerformanceRequested(request(7, 2024)),
          c: firmPerformanceRequested(request(8, 2024)),
        },
      },
    });
  });
});

describe('loadFirmPerformanceEpic', () => {
  it('fails when the API does not answer', () => {
    expectEpic(loadFirmPerformanceEpic, {
      api: () =>
        createFakeApi({
          advisoryFirms: { performance: () => throwError(() => new Error('down')) },
        }),
      actions: { marbles: '-a', values: { a: firmPerformanceRequested(request(7, 2025)) } },
      expected: { marbles: '-b', values: { b: firmPerformanceFailed() } },
    });
  });
});

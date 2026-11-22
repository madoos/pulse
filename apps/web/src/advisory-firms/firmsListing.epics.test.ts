import type { AdvisoryFirmsPage } from '@pulse/contracts';
import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import {
  loadFirmFiltersEpic,
  loadFirstPageEpic,
  loadNextPageEpic,
  requestFirstPageEpic,
} from './firmsListing.epics';
import {
  firmFiltersFailed,
  firmFiltersRequested,
  firmsListingClosed,
  firmsQueryChanged,
  firstPageFailed,
  firstPageLoaded,
  firstPageRequested,
  nextPageLoaded,
  nextPageRequested,
  type FirmsQuery,
} from './firmsListing.slice';

const query = (search: string, province: number | null = null): FirmsQuery => ({
  search,
  province,
  specialty: null,
});

const page = (ids: number[], nextCursor: string | null = null): AdvisoryFirmsPage => ({
  items: ids.map((id) => ({
    id,
    name: `Asesoría ${id}`,
    province: 'Madrid',
    city: 'Madrid',
    employees: 5,
    specialty: 'Fiscal',
  })),
  total: 60,
  nextCursor,
});

describe('requestFirstPageEpic', () => {
  it('asks once the user stops typing, and not again for the same query', () => {
    expectEpic(requestFirstPageEpic, {
      api: () => createFakeApi(),
      actions: {
        hot: true,
        marbles: '-a 100ms b 400ms c',
        values: {
          a: firmsQueryChanged(query('ge')),
          b: firmsQueryChanged(query('gestor')),
          c: firmsQueryChanged(query('gestor ')),
        },
      },
      expected: { marbles: '402ms r', values: { r: firstPageRequested(query('gestor')) } },
    });
  });

  it('asks for the same query again after the drawer is closed and opened', () => {
    expectEpic(requestFirstPageEpic, {
      api: () => createFakeApi(),
      actions: {
        hot: true,
        marbles: '-a 400ms x 10ms a',
        values: { a: firmsQueryChanged(query('')), x: firmsListingClosed() },
      },
      expected: { marbles: '301ms r 411ms r', values: { r: firstPageRequested(query('')) } },
    });
  });

  it('drops a search that was still being typed when the drawer closed', () => {
    expectEpic(requestFirstPageEpic, {
      api: () => createFakeApi(),
      actions: {
        hot: true,
        marbles: '-a 100ms x',
        values: { a: firmsQueryChanged(query('ge')), x: firmsListingClosed() },
      },
      expected: { marbles: '', values: {} },
    });
  });
});

describe('loadFirstPageEpic', () => {
  it('sends the search and the filters that are set', () => {
    const list = vi.fn();
    expectEpic(loadFirstPageEpic, {
      api: (cold) =>
        createFakeApi({
          advisoryFirms: {
            list: (q) => {
              list(q);
              return cold('--p', { p: page([1]) });
            },
          },
        }),
      actions: { marbles: '-a', values: { a: firstPageRequested(query(' martínez ', 28)) } },
      expected: { marbles: '---b', values: { b: firstPageLoaded(page([1])) } },
    });
    expect(list).toHaveBeenCalledWith({ search: 'martínez', province: 28, specialty: undefined });
  });

  it('cancels the previous query, so a slow answer never wins', () => {
    expectEpic(loadFirstPageEpic, {
      api: (cold) =>
        createFakeApi({
          advisoryFirms: {
            list: ({ search }) =>
              search === 'slow' ? cold('-----p', { p: page([1]) }) : cold('-p', { p: page([2]) }),
          },
        }),
      actions: {
        marbles: '-a-b',
        values: { a: firstPageRequested(query('slow')), b: firstPageRequested(query('fast')) },
      },
      expected: { marbles: '----c', values: { c: firstPageLoaded(page([2])) } },
    });
  });

  it('fails when the API does not answer', () => {
    expectEpic(loadFirstPageEpic, {
      api: () =>
        createFakeApi({ advisoryFirms: { list: () => throwError(() => new Error('down')) } }),
      actions: { marbles: '-a', values: { a: firstPageRequested(query('')) } },
      expected: { marbles: '-b', values: { b: firstPageFailed() } },
    });
  });

  it('drops the answer when the drawer closes', () => {
    expectEpic(loadFirstPageEpic, {
      api: (cold) =>
        createFakeApi({ advisoryFirms: { list: () => cold('---p', { p: page([1]) }) } }),
      actions: {
        marbles: '-a-x',
        values: { a: firstPageRequested(query('')), x: firmsListingClosed() },
      },
      expected: { marbles: '', values: {} },
    });
  });
});

describe('loadNextPageEpic', () => {
  const next = nextPageRequested({ query: query('', 28), cursor: 'c1' });

  it('asks for the page after the cursor, only once while it loads', () => {
    const list = vi.fn();
    expectEpic(loadNextPageEpic, {
      api: (cold) =>
        createFakeApi({
          advisoryFirms: {
            list: (q) => {
              list(q);
              return cold('---p', { p: page([31], 'c2') });
            },
          },
        }),
      actions: { marbles: '-aa', values: { a: next } },
      expected: { marbles: '----b', values: { b: nextPageLoaded(page([31], 'c2')) } },
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({
      search: undefined,
      province: 28,
      specialty: undefined,
      cursor: 'c1',
    });
  });

  it('drops the page of the previous query when a new one is asked for', () => {
    expectEpic(loadNextPageEpic, {
      api: (cold) =>
        createFakeApi({ advisoryFirms: { list: () => cold('---p', { p: page([31]) }) } }),
      actions: {
        marbles: '-a-b',
        values: { a: next, b: firstPageRequested(query('other')) },
      },
      expected: { marbles: '', values: {} },
    });
  });
});

describe('loadFirmFiltersEpic', () => {
  it('fails when the API does not answer', () => {
    expectEpic(loadFirmFiltersEpic, {
      api: () =>
        createFakeApi({ advisoryFirms: { filters: () => throwError(() => new Error('down')) } }),
      actions: { marbles: '-a', values: { a: firmFiltersRequested() } },
      expected: { marbles: '-b', values: { b: firmFiltersFailed() } },
    });
  });
});

import { createFakeApi } from '@shared/testing/api';
import { checkRequested } from '@system-status/systemStatus.slice';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from './store';

describe('createStore', () => {
  it('starts with the state of every feature', () => {
    expect(createStore({ api: createFakeApi() }).getState()).toEqual({
      advisoryFirmDetail: {
        profile: { status: 'idle', id: null, data: null },
        performance: { status: 'idle', request: null, data: null },
      },
      firmsListing: {
        query: null,
        status: 'idle',
        items: [],
        total: 0,
        nextCursor: null,
        isLoadingMore: false,
        moreFailed: false,
        filters: { status: 'idle', data: null },
      },
      login: { status: 'idle' },
      fiscalYears: { status: 'idle', years: [] },
      networkPerformance: { status: 'idle', query: null, data: null },
      networkGroups: {
        status: 'idle',
        query: null,
        data: null,
        sort: { column: 'revenuePerFirm', direction: 'descending' },
      },
      networkHighlights: { status: 'idle', query: null, data: null, alertFilter: 'all' },
      session: { status: 'unknown', user: null },
      systemStatus: { status: 'checking' },
    });
  });

  it('runs the epics with the injected API', () => {
    const getHealth = vi.fn(() => of({ status: 'ok' as const }));
    const store = createStore({ api: createFakeApi({ health: { get: getHealth } }) });

    store.dispatch(checkRequested());

    expect(getHealth).toHaveBeenCalledOnce();
    expect(store.getState().systemStatus).toEqual({ status: 'up' });
  });
});

import { createFakeApi } from '@shared/testing/api';
import { checkRequested } from '@system-status/systemStatus.slice';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from './store';

describe('createStore', () => {
  it('starts with the state of every feature', () => {
    expect(createStore({ api: createFakeApi() }).getState()).toEqual({
      login: { status: 'idle' },
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

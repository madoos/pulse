import { createStore } from '@app/store';
import type { Api } from '@shared/api';
import type { Action } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { StateObservable } from 'redux-observable';
import { NEVER, of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { SystemStatus } from './SystemStatus';
import { SystemStatusContainer } from './SystemStatus.container';
import { checkSystemStatusEpic } from './systemStatus.epics';
import { checkFailed, checkRequested, checkSucceeded } from './systemStatus.slice';

const healthy: Api = { health: { get: () => of({ status: 'ok' }) } };

describe('SystemStatus', () => {
  it('shows that the API is up', () => {
    render(<SystemStatus status="up" onRetry={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('API operativa');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('offers a retry when the API is down', async () => {
    const onRetry = vi.fn();
    render(<SystemStatus status="down" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(screen.getByRole('status')).toHaveTextContent('API no disponible');
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('checkSystemStatusEpic', () => {
  const expectEpic = (
    getHealth: (cold: TestScheduler['createColdObservable']) => Api['health']['get'],
    actions: string,
    expected: string,
    expectedValues: Record<string, Action>,
  ) =>
    new TestScheduler((actual, wanted) => expect(actual).toEqual(wanted)).run(
      ({ cold, expectObservable }) => {
        const output$ = checkSystemStatusEpic(
          cold(actions, { a: checkRequested() }) as never,
          new StateObservable(NEVER as never, {}),
          { api: { health: { get: getHealth(cold) } } },
        );
        expectObservable(output$).toBe(expected, expectedValues);
      },
    );

  it('reports the API as up when the health check succeeds', () => {
    expectEpic(() => () => of({ status: 'ok' }), '-a', '-b', { b: checkSucceeded() });
  });

  it('reports the API as down when the health check fails', () => {
    expectEpic(() => () => throwError(() => new Error('down')), '-a', '-b', { b: checkFailed() });
  });

  it('cancels a pending check when a new one is requested', () => {
    expectEpic((cold) => () => cold('---h', { h: { status: 'ok' } }), '-a-a', '------b', {
      b: checkSucceeded(),
    });
  });
});

describe('system status feature', () => {
  const renderFeature = (api: Api) =>
    render(
      <Provider store={createStore({ api })}>
        <SystemStatusContainer />
      </Provider>,
    );

  it('checks the API on load and shows it is up', async () => {
    renderFeature(healthy);

    expect(await screen.findByText('API operativa')).toBeInTheDocument();
  });

  it('shows the API is down and recovers on retry', async () => {
    const getHealth = vi
      .fn<Api['health']['get']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of({ status: 'ok' }));
    renderFeature({ health: { get: getHealth } });

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('API operativa')).toBeInTheDocument();
    expect(getHealth).toHaveBeenCalledTimes(2);
  });
});

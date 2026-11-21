import type { Action } from '@reduxjs/toolkit';
import type { Api } from '@shared/api';
import { StateObservable, type Epic } from 'redux-observable';
import { NEVER, type Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'vitest';

type Cold = TestScheduler['createColdObservable'];

export type EpicScenario = {
  api: (cold: Cold) => Api;
  actions: { marbles: string; values: Record<string, Action> };
  expected: { marbles: string; values: Record<string, Action> };
};

export const expectEpic = (
  epic: Epic<Action, Action, unknown, { api: Api }>,
  { api, actions, expected }: EpicScenario,
) =>
  new TestScheduler((actual, wanted) => expect(actual).toEqual(wanted)).run(
    ({ cold, expectObservable }) => {
      const output$ = epic(
        cold(actions.marbles, actions.values) as unknown as Parameters<typeof epic>[0],
        new StateObservable(NEVER as Observable<unknown>, {}),
        { api: api(cold) },
      );
      expectObservable(output$).toBe(expected.marbles, expected.values);
    },
  );

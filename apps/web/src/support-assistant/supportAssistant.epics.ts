import type { Action } from '@reduxjs/toolkit';
import { ApiError, type Api } from '@shared/api';
import { combineEpics, type Epic } from 'redux-observable';
import { catchError, exhaustMap, filter, map, of, takeUntil } from 'rxjs';
import {
  assistantClosed,
  conversationFailed,
  conversationRequested,
  conversationStarted,
  conversationUnavailable,
  questionAnswered,
  questionAsked,
  questionFailed,
  type QuestionFailure,
} from './supportAssistant.slice';

type AssistantEpic = Epic<Action, Action, unknown, { api: Api }>;

const statusOf = (error: unknown) => (error instanceof ApiError ? error.status : null);

/** The API answers 503 while the assistant is not configured. */
const UNAVAILABLE = 503;
/** The API answers 429 when the quota of the model ran out. */
const QUOTA_EXCEEDED = 429;

/** Starts one conversation at a time; closing the window cancels it. */
export const startConversationEpic: AssistantEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(conversationRequested.match),
    exhaustMap(({ payload: firmId }) =>
      api.supportAssistant.start(firmId).pipe(
        map((conversation) => conversationStarted(conversation.id)),
        catchError((error: unknown) =>
          of(statusOf(error) === UNAVAILABLE ? conversationUnavailable() : conversationFailed()),
        ),
        takeUntil(action$.pipe(filter(assistantClosed.match))),
      ),
    ),
  );

const failureOf = (error: unknown): QuestionFailure => {
  const status = statusOf(error);
  if (status === QUOTA_EXCEEDED) return 'quota-exceeded';
  if (status === UNAVAILABLE) return 'unavailable';
  return 'failed';
};

/**
 * One question at a time: another one while an answer is on its way is ignored, as the window
 * does not let it be sent. Closing the window cancels the question on its way.
 */
export const askQuestionEpic: AssistantEpic = (action$, _state$, { api }) =>
  action$.pipe(
    filter(questionAsked.match),
    exhaustMap(({ payload: { firmId, conversationId, question } }) =>
      api.supportAssistant.ask(firmId, conversationId, question).pipe(
        map((message) => questionAnswered(message)),
        catchError((error: unknown) => of(questionFailed(failureOf(error)))),
        takeUntil(action$.pipe(filter(assistantClosed.match))),
      ),
    ),
  );

export const supportAssistantEpic = combineEpics(startConversationEpic, askQuestionEpic);

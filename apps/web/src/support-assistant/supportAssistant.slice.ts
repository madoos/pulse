import type { AssistantMessage, SupportSource } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ConversationStatus = 'idle' | 'starting' | 'ready' | 'unavailable' | 'failed';

/** How a question ended, as the user sees it. */
export type ExchangeStatus =
  'pending' | 'answered' | 'not-enough-information' | 'quota-exceeded' | 'unavailable' | 'failed';

export type Exchange = {
  question: string;
  status: ExchangeStatus;
  answer: string | null;
  sources: SupportSource[];
};

export type SupportAssistantState = {
  isOpen: boolean;
  /** The firm of the conversation: another firm starts another conversation. */
  firmId: number | null;
  conversation: { status: ConversationStatus; id: string | null };
  exchanges: Exchange[];
};

/** A question asked in the conversation of a firm. */
export type AskedQuestion = { firmId: number; conversationId: string; question: string };

export type QuestionFailure = 'quota-exceeded' | 'unavailable' | 'failed';

const initialState: SupportAssistantState = {
  isOpen: false,
  firmId: null,
  conversation: { status: 'idle', id: null },
  exchanges: [],
};

const pendingExchange = (state: SupportAssistantState) =>
  state.exchanges.find((exchange) => exchange.status === 'pending');

export const supportAssistantSlice = createSlice({
  name: 'supportAssistant',
  initialState,
  reducers: {
    assistantOpened: (state, action: PayloadAction<number>) => {
      state.isOpen = true;
      if (state.firmId !== action.payload) {
        state.firmId = action.payload;
        state.conversation = { status: 'idle', id: null };
        state.exchanges = [];
      }
    },
    /** Closing cancels the question on its way: it is dropped, as it will not be answered. */
    assistantClosed: (state) => {
      state.isOpen = false;
      state.exchanges = state.exchanges.filter((exchange) => exchange.status !== 'pending');
      if (state.conversation.status === 'starting') state.conversation.status = 'idle';
    },
    /** Starts the conversation about a firm. */
    conversationRequested: {
      reducer: (state) => {
        state.conversation = { status: 'starting', id: null };
      },
      prepare: (firmId: number) => ({ payload: firmId }),
    },
    conversationStarted: (state, action: PayloadAction<string>) => {
      state.conversation = { status: 'ready', id: action.payload };
    },
    conversationUnavailable: (state) => {
      state.conversation = { status: 'unavailable', id: null };
    },
    conversationFailed: (state) => {
      state.conversation = { status: 'failed', id: null };
    },
    questionAsked: (state, action: PayloadAction<AskedQuestion>) => {
      state.exchanges.push({
        question: action.payload.question,
        status: 'pending',
        answer: null,
        sources: [],
      });
    },
    questionAnswered: (state, action: PayloadAction<AssistantMessage>) => {
      const exchange = pendingExchange(state);
      if (!exchange) return;
      const { outcome, answer, sources } = action.payload;
      exchange.status = outcome === 'answered' ? 'answered' : 'not-enough-information';
      exchange.answer = answer;
      exchange.sources = sources;
    },
    questionFailed: (state, action: PayloadAction<QuestionFailure>) => {
      const exchange = pendingExchange(state);
      if (exchange) exchange.status = action.payload;
      if (action.payload === 'unavailable') state.conversation.status = 'unavailable';
    },
  },
});

export const {
  assistantOpened,
  assistantClosed,
  conversationRequested,
  conversationStarted,
  conversationUnavailable,
  conversationFailed,
  questionAsked,
  questionAnswered,
  questionFailed,
} = supportAssistantSlice.actions;

import type { AlertType, NetworkHighlights, PeriodQuery } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoadStatus } from '@shared/section-state/SectionState';

export type AlertFilter = AlertType | 'all';

export type NetworkHighlightsState = {
  status: LoadStatus;
  query: PeriodQuery | null;
  data: NetworkHighlights | null;
  alertFilter: AlertFilter;
};

const initialState: NetworkHighlightsState = {
  status: 'idle',
  query: null,
  data: null,
  alertFilter: 'all',
};

export const networkHighlightsSlice = createSlice({
  name: 'networkHighlights',
  initialState,
  reducers: {
    highlightsRequested: (state, action: PayloadAction<PeriodQuery>) => {
      state.status = 'loading';
      state.query = action.payload;
    },
    highlightsLoaded: (state, action: PayloadAction<NetworkHighlights>) => {
      state.status = 'loaded';
      state.data = action.payload;
    },
    highlightsFailed: (state) => {
      state.status = 'failed';
    },
    alertFilterChanged: (state, action: PayloadAction<AlertFilter>) => {
      state.alertFilter = action.payload;
    },
  },
});

export const { highlightsRequested, highlightsLoaded, highlightsFailed, alertFilterChanged } =
  networkHighlightsSlice.actions;

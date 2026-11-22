import type { AdvisoryFirm, FirmPerformance, NetworkPerformanceQuery } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'not-found' | 'failed';
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';

/** The performance of one firm for the filters of the page. */
export type FirmPerformanceRequest = { firmId: number; query: NetworkPerformanceQuery };

export type AdvisoryFirmDetailState = {
  profile: { status: ProfileStatus; id: number | null; data: AdvisoryFirm | null };
  performance: {
    status: LoadStatus;
    request: FirmPerformanceRequest | null;
    data: FirmPerformance | null;
  };
};

const initialState: AdvisoryFirmDetailState = {
  profile: { status: 'idle', id: null, data: null },
  performance: { status: 'idle', request: null, data: null },
};

export const advisoryFirmDetailSlice = createSlice({
  name: 'advisoryFirmDetail',
  initialState,
  reducers: {
    firmRequested: (state, action: PayloadAction<number>) => {
      state.profile = { status: 'loading', id: action.payload, data: null };
    },
    firmLoaded: (state, action: PayloadAction<AdvisoryFirm>) => {
      state.profile.status = 'loaded';
      state.profile.data = action.payload;
    },
    firmNotFound: (state) => {
      state.profile.status = 'not-found';
    },
    firmFailed: (state) => {
      state.profile.status = 'failed';
    },
    /** The page shows a firm with these filters; the performance reloads only if they change. */
    firmFiltersChanged: {
      reducer: () => {},
      prepare: (request: FirmPerformanceRequest) => ({ payload: request }),
    },
    firmPerformanceRequested: (state, action: PayloadAction<FirmPerformanceRequest>) => {
      state.performance.status = 'loading';
      state.performance.request = action.payload;
    },
    firmPerformanceLoaded: (state, action: PayloadAction<FirmPerformance>) => {
      state.performance.status = 'loaded';
      state.performance.data = action.payload;
    },
    firmPerformanceFailed: (state) => {
      state.performance.status = 'failed';
    },
  },
});

export const {
  firmRequested,
  firmLoaded,
  firmNotFound,
  firmFailed,
  firmFiltersChanged,
  firmPerformanceRequested,
  firmPerformanceLoaded,
  firmPerformanceFailed,
} = advisoryFirmDetailSlice.actions;

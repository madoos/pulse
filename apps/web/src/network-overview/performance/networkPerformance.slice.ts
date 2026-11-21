import type { NetworkPerformance, NetworkPerformanceQuery } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoadStatus } from '@network-overview/networkOverview.slice';

export type NetworkPerformanceState = {
  status: LoadStatus;
  query: NetworkPerformanceQuery | null;
  data: NetworkPerformance | null;
};

const initialState: NetworkPerformanceState = { status: 'idle', query: null, data: null };

export const networkPerformanceSlice = createSlice({
  name: 'networkPerformance',
  initialState,
  reducers: {
    performanceRequested: (state, action: PayloadAction<NetworkPerformanceQuery>) => {
      state.status = 'loading';
      state.query = action.payload;
    },
    performanceLoaded: (state, action: PayloadAction<NetworkPerformance>) => {
      state.status = 'loaded';
      state.data = action.payload;
    },
    performanceFailed: (state) => {
      state.status = 'failed';
    },
  },
});

export const { performanceRequested, performanceLoaded, performanceFailed } =
  networkPerformanceSlice.actions;

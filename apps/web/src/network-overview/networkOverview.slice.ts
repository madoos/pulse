import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NetworkFilters } from './networkOverview.filters';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';

export type NetworkOverviewState = {
  status: LoadStatus;
  fiscalYears: number[];
};

const initialState: NetworkOverviewState = { status: 'idle', fiscalYears: [] };

export const networkOverviewSlice = createSlice({
  name: 'networkOverview',
  initialState,
  reducers: {
    fiscalYearsRequested: (state) => {
      state.status = 'loading';
    },
    fiscalYearsLoaded: (state, action: PayloadAction<number[]>) => {
      state.status = 'loaded';
      state.fiscalYears = action.payload;
    },
    fiscalYearsFailed: (state) => {
      state.status = 'failed';
    },
  },
});

export const { fiscalYearsRequested, fiscalYearsLoaded, fiscalYearsFailed } =
  networkOverviewSlice.actions;

/** The filters in the URL changed: every section loads what it needs. */
export const networkFiltersChanged = createAction<NetworkFilters>('networkOverview/filtersChanged');

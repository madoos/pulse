import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoadStatus } from '@shared/section-state/SectionState';

/** The fiscal years with data, the most recent first: every period filter offers them. */
export type FiscalYearsState = {
  status: LoadStatus;
  years: number[];
};

const initialState: FiscalYearsState = { status: 'idle', years: [] };

export const fiscalYearsSlice = createSlice({
  name: 'fiscalYears',
  initialState,
  reducers: {
    fiscalYearsRequested: (state) => {
      state.status = 'loading';
    },
    fiscalYearsLoaded: (state, action: PayloadAction<number[]>) => {
      state.status = 'loaded';
      state.years = action.payload;
    },
    fiscalYearsFailed: (state) => {
      state.status = 'failed';
    },
  },
});

export const { fiscalYearsRequested, fiscalYearsLoaded, fiscalYearsFailed } =
  fiscalYearsSlice.actions;

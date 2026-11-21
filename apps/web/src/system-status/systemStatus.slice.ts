import { createSlice } from '@reduxjs/toolkit';

export type SystemStatusValue = 'checking' | 'up' | 'down';

export type SystemStatusState = {
  status: SystemStatusValue;
};

const initialState: SystemStatusState = { status: 'checking' };

export const systemStatusSlice = createSlice({
  name: 'systemStatus',
  initialState,
  reducers: {
    checkRequested: (state) => {
      state.status = 'checking';
    },
    checkSucceeded: (state) => {
      state.status = 'up';
    },
    checkFailed: (state) => {
      state.status = 'down';
    },
  },
});

export const { checkRequested, checkSucceeded, checkFailed } = systemStatusSlice.actions;

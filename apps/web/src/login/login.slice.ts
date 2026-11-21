import type { LogIn, User } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type LoginStatus = 'idle' | 'submitting' | 'rejected' | 'unavailable';

export type LoginState = {
  status: LoginStatus;
};

const initialState: LoginState = { status: 'idle' };

export const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    loginRequested: {
      reducer: (state) => {
        state.status = 'submitting';
      },
      prepare: (credentials: LogIn) => ({ payload: credentials }),
    },
    loginSucceeded: {
      reducer: (state) => {
        state.status = 'idle';
      },
      prepare: (user: User) => ({ payload: user }),
    },
    loginFailed: (state, action: PayloadAction<'rejected' | 'unavailable'>) => {
      state.status = action.payload;
    },
  },
});

export const { loginRequested, loginSucceeded, loginFailed } = loginSlice.actions;

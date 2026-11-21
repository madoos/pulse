import { loginSucceeded } from '@login/login.slice';
import type { User } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SessionStatus = 'unknown' | 'checking' | 'anonymous' | 'authenticated';

export type SessionState = {
  status: SessionStatus;
  user: User | null;
};

const initialState: SessionState = { status: 'unknown', user: null };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    sessionRequested: (state) => {
      state.status = 'checking';
    },
    sessionFound: (state, action: PayloadAction<User>) => {
      state.status = 'authenticated';
      state.user = action.payload;
    },
    sessionMissing: (state) => {
      state.status = 'anonymous';
      state.user = null;
    },
    logOutRequested: () => {},
    loggedOut: (state) => {
      state.status = 'anonymous';
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginSucceeded, (state, action) => {
      state.status = 'authenticated';
      state.user = action.payload;
    });
  },
});

export const { sessionRequested, sessionFound, sessionMissing, logOutRequested, loggedOut } =
  sessionSlice.actions;

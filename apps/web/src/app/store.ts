import type { Api } from '@shared/api';
import { combineReducers, configureStore, type Action } from '@reduxjs/toolkit';
import { loginEpic } from '@login/login.epics';
import { loginSlice } from '@login/login.slice';
import { networkGroupsEpic } from '@network-overview/groups/networkGroups.epics';
import { networkGroupsSlice } from '@network-overview/groups/networkGroups.slice';
import { networkHighlightsEpic } from '@network-overview/highlights/networkHighlights.epics';
import { networkHighlightsSlice } from '@network-overview/highlights/networkHighlights.slice';
import { loadFiscalYearsEpic } from '@network-overview/networkOverview.epics';
import { networkOverviewSlice } from '@network-overview/networkOverview.slice';
import { networkPerformanceEpic } from '@network-overview/performance/networkPerformance.epics';
import { networkPerformanceSlice } from '@network-overview/performance/networkPerformance.slice';
import { sessionEpic } from '@session/session.epics';
import { sessionSlice } from '@session/session.slice';
import { checkSystemStatusEpic } from '@system-status/systemStatus.epics';
import { systemStatusSlice } from '@system-status/systemStatus.slice';
import { useDispatch, useSelector } from 'react-redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

export type Dependencies = {
  api: Api;
};

const rootReducer = combineReducers({
  login: loginSlice.reducer,
  networkOverview: networkOverviewSlice.reducer,
  networkPerformance: networkPerformanceSlice.reducer,
  networkGroups: networkGroupsSlice.reducer,
  networkHighlights: networkHighlightsSlice.reducer,
  session: sessionSlice.reducer,
  systemStatus: systemStatusSlice.reducer,
});

const rootEpic = combineEpics<Action, Action, RootState, Dependencies>(
  loginEpic,
  sessionEpic,
  checkSystemStatusEpic,
  loadFiscalYearsEpic,
  networkPerformanceEpic,
  networkGroupsEpic,
  networkHighlightsEpic,
);

export const createStore = (dependencies: Dependencies) => {
  const epicMiddleware = createEpicMiddleware<Action, Action, RootState, Dependencies>({
    dependencies,
  });
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(epicMiddleware),
  });
  epicMiddleware.run(rootEpic);
  return store;
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

import type { Api } from '@shared/api';
import { combineReducers, configureStore, type Action } from '@reduxjs/toolkit';
import { advisoryFirmDetailEpic } from '@advisory-firm-detail/advisoryFirmDetail.epics';
import { advisoryFirmDetailSlice } from '@advisory-firm-detail/advisoryFirmDetail.slice';
import { firmsListingEpic } from '@advisory-firms/firmsListing.epics';
import { firmsListingSlice } from '@advisory-firms/firmsListing.slice';
import { loginEpic } from '@login/login.epics';
import { loginSlice } from '@login/login.slice';
import { networkGroupsEpic } from '@network-overview/groups/networkGroups.epics';
import { networkGroupsSlice } from '@network-overview/groups/networkGroups.slice';
import { networkHighlightsEpic } from '@network-overview/highlights/networkHighlights.epics';
import { networkHighlightsSlice } from '@network-overview/highlights/networkHighlights.slice';
import { networkPerformanceEpic } from '@network-overview/performance/networkPerformance.epics';
import { networkPerformanceSlice } from '@network-overview/performance/networkPerformance.slice';
import { loadFiscalYearsEpic } from '@shared/fiscal-years/fiscalYears.epics';
import { fiscalYearsSlice } from '@shared/fiscal-years/fiscalYears.slice';
import { sessionEpic } from '@session/session.epics';
import { sessionSlice } from '@session/session.slice';
import { checkSystemStatusEpic } from '@system-status/systemStatus.epics';
import { systemStatusSlice } from '@system-status/systemStatus.slice';
import { supportAssistantEpic } from '@support-assistant/supportAssistant.epics';
import { supportAssistantSlice } from '@support-assistant/supportAssistant.slice';
import { useDispatch, useSelector } from 'react-redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

export type Dependencies = {
  api: Api;
};

const rootReducer = combineReducers({
  advisoryFirmDetail: advisoryFirmDetailSlice.reducer,
  firmsListing: firmsListingSlice.reducer,
  login: loginSlice.reducer,
  fiscalYears: fiscalYearsSlice.reducer,
  networkPerformance: networkPerformanceSlice.reducer,
  networkGroups: networkGroupsSlice.reducer,
  networkHighlights: networkHighlightsSlice.reducer,
  session: sessionSlice.reducer,
  supportAssistant: supportAssistantSlice.reducer,
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
  firmsListingEpic,
  advisoryFirmDetailEpic,
  supportAssistantEpic,
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

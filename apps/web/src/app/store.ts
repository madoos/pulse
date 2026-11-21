import type { Api } from '@shared/api';
import { combineReducers, configureStore, type Action } from '@reduxjs/toolkit';
import { checkSystemStatusEpic } from '@system-status/systemStatus.epics';
import { systemStatusSlice } from '@system-status/systemStatus.slice';
import { useDispatch, useSelector } from 'react-redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

export type Dependencies = {
  api: Api;
};

const rootReducer = combineReducers({
  systemStatus: systemStatusSlice.reducer,
});

const rootEpic = combineEpics<Action, Action, RootState, Dependencies>(checkSystemStatusEpic);

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

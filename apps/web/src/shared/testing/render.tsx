import { createStore } from '@app/store';
import type { Api } from '@shared/api';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { createFakeApi } from './api';

type Options = {
  api?: Api;
  path?: string;
  routes?: Record<string, ReactElement>;
};

export const renderWithStore = (
  ui: ReactElement,
  { api = createFakeApi(), path = '/', routes = {} }: Options = {},
) => {
  const store = createStore({ api });
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={ui} />
          {Object.entries(routes).map(([routePath, element]) => (
            <Route key={routePath} path={routePath} element={element} />
          ))}
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store, ...view };
};

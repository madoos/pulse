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
  /** The URL to start at, if it is not the route path, for example with a query string. */
  initialEntry?: string;
  routes?: Record<string, ReactElement>;
};

export const renderWithStore = (
  ui: ReactElement,
  { api = createFakeApi(), path = '/', initialEntry = path, routes = {} }: Options = {},
) => {
  const store = createStore({ api });
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
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

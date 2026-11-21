import '@pulse/design-system/tokens.scss';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { App } from '@app/App';
import { createStore } from '@app/store';
import { createHttpApi } from '@shared/api';
import { loadConfig } from '@shared/config';

const config = loadConfig();
const store = createStore({ api: createHttpApi(config.apiUrl) });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);

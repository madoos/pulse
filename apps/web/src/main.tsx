import '@pulse/design-system/tokens.scss';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { App } from '@app/App';
import { createStore } from '@app/store';
import { createHttpApi } from '@shared/api';
import { loadConfig } from '@shared/config';
import { ErrorBoundary, reactErrorHandlers, startErrorMonitoring } from '@shared/monitoring';

const config = loadConfig();
startErrorMonitoring({
  environment: config.environment,
  dsn: config.sentryDsn,
  release: import.meta.env.VITE_RELEASE,
});
const store = createStore({ api: createHttpApi(config.apiUrl) });

createRoot(document.getElementById('root')!, reactErrorHandlers).render(
  <StrictMode>
    <ErrorBoundary fallback={<p role="alert">Algo ha ido mal. Recarga la página.</p>}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);

import { checkHealth } from '@health/application/check-health';
import { createHealthRoutes } from '@health/infrastructure/http';
import { loadConfig } from '@shared/infrastructure/config';
import { createApp, startServer } from '@shared/infrastructure/http';

const config = loadConfig();

const app = createApp([createHealthRoutes(checkHealth)], {
  corsOrigin: config.NODE_ENV === 'development' ? config.CORS_ORIGIN : undefined,
});

startServer(app, config.PORT);

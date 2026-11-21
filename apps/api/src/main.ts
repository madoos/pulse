import { makeGetSession } from '@auth/application/get-session';
import { makeLogIn } from '@auth/application/log-in';
import { makeLogOut } from '@auth/application/log-out';
import { createJwtTokenSigner, scryptPasswordHasher } from '@auth/infrastructure/crypto';
import { createRequireSession, createSessionRoutes } from '@auth/infrastructure/http';
import {
  createPostgresSessionRepository,
  createPostgresUserRepository,
} from '@auth/infrastructure/repository/postgres';
import { makeCheckHealth } from '@health/application/check-health';
import { createHealthRoutes } from '@health/infrastructure/http';
import { createPostgresHealthIndicator } from '@health/infrastructure/indicator/postgres';
import { makeListFiscalYears } from '@performance/application/list-fiscal-years';
import { makeGetNetworkGroups } from '@performance/application/network-groups';
import { makeGetNetworkHighlights } from '@performance/application/network-highlights';
import { makeGetNetworkPerformance } from '@performance/application/network-performance';
import { createPerformanceRoutes } from '@performance/infrastructure/http';
import { createPostgresNetworkPerformanceRepository } from '@performance/infrastructure/repository/postgres';
import { loadConfig } from '@shared/infrastructure/config';
import { createDatabase } from '@shared/infrastructure/database';
import { createApp, startServer } from '@shared/infrastructure/http';
import { createErrorReporter } from '@shared/infrastructure/monitoring';

const config = loadConfig();
const reportError = createErrorReporter({
  enabled: config.NODE_ENV === 'production',
  dsn: config.SENTRY_DSN,
  environment: config.SENTRY_ENVIRONMENT ?? config.NODE_ENV,
  release: config.SENTRY_RELEASE,
});
const { db } = createDatabase(config.DATABASE_URL);

const users = createPostgresUserRepository(db);
const sessions = createPostgresSessionRepository(db);
const tokens = createJwtTokenSigner(config.JWT_SECRET);
const networkPerformance = createPostgresNetworkPerformanceRepository(db);

const checkHealth = makeCheckHealth([createPostgresHealthIndicator(db)]);
const logIn = makeLogIn({ users, sessions, tokens, hasher: scryptPasswordHasher });
const logOut = makeLogOut({ sessions });
const requireSession = createRequireSession(makeGetSession({ users, sessions, tokens }));
const listFiscalYears = makeListFiscalYears({ repository: networkPerformance });
const getNetworkPerformance = makeGetNetworkPerformance({ repository: networkPerformance });
const getNetworkGroups = makeGetNetworkGroups({ repository: networkPerformance });
const getNetworkHighlights = makeGetNetworkHighlights({ repository: networkPerformance });

const app = createApp(
  [
    createHealthRoutes(checkHealth),
    createSessionRoutes({
      logIn,
      logOut,
      requireSession,
      cookie: { secure: config.NODE_ENV === 'production' },
    }),
    createPerformanceRoutes({
      listFiscalYears,
      getNetworkPerformance,
      getNetworkGroups,
      getNetworkHighlights,
      requireSession,
    }),
  ],
  {
    corsOrigin: config.NODE_ENV === 'development' ? config.CORS_ORIGIN : undefined,
    reportError,
  },
);

startServer(app, config.PORT);

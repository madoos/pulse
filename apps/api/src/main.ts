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
import { loadConfig } from '@shared/infrastructure/config';
import { createDatabase } from '@shared/infrastructure/database';
import { createApp, startServer } from '@shared/infrastructure/http';

const config = loadConfig();
const { db } = createDatabase(config.DATABASE_URL);

const users = createPostgresUserRepository(db);
const sessions = createPostgresSessionRepository(db);
const tokens = createJwtTokenSigner(config.JWT_SECRET);

const checkHealth = makeCheckHealth([createPostgresHealthIndicator(db)]);
const logIn = makeLogIn({ users, sessions, tokens, hasher: scryptPasswordHasher });
const logOut = makeLogOut({ sessions });
const requireSession = createRequireSession(makeGetSession({ users, sessions, tokens }));

const app = createApp(
  [
    createHealthRoutes(checkHealth),
    createSessionRoutes({
      logIn,
      logOut,
      requireSession,
      cookie: { secure: config.NODE_ENV === 'production' },
    }),
  ],
  { corsOrigin: config.NODE_ENV === 'development' ? config.CORS_ORIGIN : undefined },
);

startServer(app, config.PORT);

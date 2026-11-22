import { makeGetAdvisoryFirm } from '@advisory-firms/application/get-advisory-firm';
import { makeListAdvisoryFirms } from '@advisory-firms/application/list-advisory-firms';
import { makeListFirmFilters } from '@advisory-firms/application/list-firm-filters';
import { createAdvisoryFirmRoutes } from '@advisory-firms/infrastructure/http';
import { createPostgresAdvisoryFirmRepository } from '@advisory-firms/infrastructure/repository/postgres';
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
import { makeGetFirmPerformance } from '@performance/application/firm-performance';
import { makeListFiscalYears } from '@performance/application/list-fiscal-years';
import { makeGetNetworkGroups } from '@performance/application/network-groups';
import { makeGetNetworkHighlights } from '@performance/application/network-highlights';
import { makeGetNetworkPerformance } from '@performance/application/network-performance';
import { createPerformanceRoutes } from '@performance/infrastructure/http';
import {
  createPostgresFirmPerformanceRepository,
  createPostgresNetworkPerformanceRepository,
} from '@performance/infrastructure/repository/postgres';
import { loadConfig } from '@shared/infrastructure/config';
import { createDatabase } from '@shared/infrastructure/database';
import { createApp, startServer } from '@shared/infrastructure/http';
import { createErrorReporter } from '@shared/infrastructure/monitoring';
import { makeAskQuestion } from '@support-assistant/application/ask-question';
import { makeGetConversation } from '@support-assistant/application/get-conversation';
import { makeStartConversation } from '@support-assistant/application/start-conversation';
import { createOpenRouterAgent } from '@support-assistant/infrastructure/agent/openrouter';
import { createTransformersEmbedder } from '@support-assistant/infrastructure/embedder/transformers';
import { createSupportAssistantRoutes } from '@support-assistant/infrastructure/http';
import {
  createPostgresConversationLog,
  createPostgresSupportDocumentRepository,
} from '@support-assistant/infrastructure/repository/postgres';

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
const advisoryFirms = createPostgresAdvisoryFirmRepository(db);
const firmPerformance = createPostgresFirmPerformanceRepository(db);

const checkHealth = makeCheckHealth([createPostgresHealthIndicator(db)]);
const logIn = makeLogIn({ users, sessions, tokens, hasher: scryptPasswordHasher });
const logOut = makeLogOut({ sessions });
const requireSession = createRequireSession(makeGetSession({ users, sessions, tokens }));
const listFiscalYears = makeListFiscalYears({ repository: networkPerformance });
const getNetworkPerformance = makeGetNetworkPerformance({ repository: networkPerformance });
const getNetworkGroups = makeGetNetworkGroups({ repository: networkPerformance });
const getNetworkHighlights = makeGetNetworkHighlights({ repository: networkPerformance });
const listAdvisoryFirms = makeListAdvisoryFirms({ repository: advisoryFirms });
const listFirmFilters = makeListFirmFilters({ repository: advisoryFirms });
const getAdvisoryFirm = makeGetAdvisoryFirm({ repository: advisoryFirms });
const getFirmPerformance = makeGetFirmPerformance({
  repository: firmPerformance,
  network: networkPerformance,
});

const createAssistant = (apiKey: string) => {
  const embedder = createTransformersEmbedder({
    cacheDir: config.EMBEDDING_MODELS_DIR,
    allowRemoteModels: !config.EMBEDDING_MODELS_DIR,
  });
  // Loaded at start, so the first question does not wait for the model.
  embedder.warmUp().catch((error: unknown) => {
    console.error('The embedding model could not be loaded', error);
    reportError(error);
  });
  const log = createPostgresConversationLog(db);
  return {
    startConversation: makeStartConversation({
      log,
      firmExists: async (id) => (await advisoryFirms.byId(id)) !== null,
    }),
    getConversation: makeGetConversation({ log }),
    askQuestion: makeAskQuestion({
      documents: createPostgresSupportDocumentRepository(db),
      embedder,
      agent: createOpenRouterAgent({ apiKey, model: config.ASSISTANT_MODEL }),
      log,
      report: (report) => console.info(JSON.stringify({ event: 'assistant.question', ...report })),
    }),
  };
};

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
      getFirmPerformance,
      requireSession,
    }),
    createAdvisoryFirmRoutes({
      listAdvisoryFirms,
      listFirmFilters,
      getAdvisoryFirm,
      requireSession,
    }),
    createSupportAssistantRoutes({
      assistant: config.OPEN_ROUTER_API_KEY ? createAssistant(config.OPEN_ROUTER_API_KEY) : null,
      requireSession,
    }),
  ],
  {
    corsOrigin: config.NODE_ENV === 'development' ? config.CORS_ORIGIN : undefined,
    reportError,
  },
);

startServer(app, config.PORT);

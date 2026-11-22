import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { GetFirmPerformance } from '@performance/application/firm-performance';
import type { ListFiscalYears } from '@performance/application/list-fiscal-years';
import type { GetNetworkGroups } from '@performance/application/network-groups';
import type { GetNetworkHighlights } from '@performance/application/network-highlights';
import type { GetNetworkPerformance } from '@performance/application/network-performance';
import {
  AdvisoryFirmIdSchema,
  FirmPerformanceSchema,
  FiscalYearsSchema,
  NetworkGroupsQuerySchema,
  NetworkGroupsSchema,
  NetworkHighlightsSchema,
  NetworkPerformanceQuerySchema,
  NetworkPerformanceSchema,
  PeriodQuerySchema,
  ProblemSchema,
} from '@pulse/contracts';
import type { MiddlewareHandler } from 'hono';

const problemContent = { 'application/problem+json': { schema: ProblemSchema } };

const errors = {
  400: { description: 'The query is not valid', content: problemContent },
  401: { description: 'There is no active session', content: problemContent },
};

type Dependencies = {
  listFiscalYears: ListFiscalYears;
  getNetworkPerformance: GetNetworkPerformance;
  getNetworkGroups: GetNetworkGroups;
  getNetworkHighlights: GetNetworkHighlights;
  getFirmPerformance: GetFirmPerformance;
  requireSession: MiddlewareHandler;
};

export const createPerformanceRoutes = ({
  listFiscalYears,
  getNetworkPerformance,
  getNetworkGroups,
  getNetworkHighlights,
  getFirmPerformance,
  requireSession,
}: Dependencies) => {
  const middleware = [requireSession];

  const fiscalYearsRoute = createRoute({
    method: 'get',
    path: '/fiscal-years',
    tags: ['Performance'],
    summary: 'List the fiscal years that have metrics',
    middleware,
    responses: {
      200: {
        description: 'The fiscal years, the most recent first',
        content: { 'application/json': { schema: FiscalYearsSchema } },
      },
      401: errors[401],
    },
  });

  const networkPerformanceRoute = createRoute({
    method: 'get',
    path: '/network/performance',
    tags: ['Performance'],
    summary: 'Get the whole network month by month, optionally compared with another year',
    middleware,
    request: { query: NetworkPerformanceQuerySchema },
    responses: {
      200: {
        description: 'The network for the selected period and the compared one',
        content: { 'application/json': { schema: NetworkPerformanceSchema } },
      },
      ...errors,
    },
  });

  const networkGroupsRoute = createRoute({
    method: 'get',
    path: '/network/performance/groups',
    tags: ['Performance'],
    summary: 'Get the network grouped by specialty or autonomous community',
    middleware,
    request: { query: NetworkGroupsQuerySchema },
    responses: {
      200: {
        description: 'Each group with its metrics for the period',
        content: { 'application/json': { schema: NetworkGroupsSchema } },
      },
      ...errors,
    },
  });

  const networkHighlightsRoute = createRoute({
    method: 'get',
    path: '/network/highlights',
    tags: ['Performance'],
    summary: 'Get the advisory firms that need attention and the ones that grow the most',
    middleware,
    request: { query: PeriodQuerySchema },
    responses: {
      200: {
        description: 'The firms that need attention and the standouts of the period',
        content: { 'application/json': { schema: NetworkHighlightsSchema } },
      },
      ...errors,
    },
  });

  const firmPerformanceRoute = createRoute({
    method: 'get',
    path: '/advisory-firms/{id}/performance',
    tags: ['Performance'],
    summary: 'Get an advisory firm month by month, measured as the network is',
    middleware,
    request: { params: AdvisoryFirmIdSchema, query: NetworkPerformanceQuerySchema },
    responses: {
      200: {
        description: 'The firm for the selected period, the compared one and six months before',
        content: { 'application/json': { schema: FirmPerformanceSchema } },
      },
      ...errors,
    },
  });

  return new OpenAPIHono()
    .openapi(fiscalYearsRoute, async (c) => c.json({ fiscalYears: await listFiscalYears() }, 200))
    .openapi(networkPerformanceRoute, async (c) =>
      c.json(await getNetworkPerformance(c.req.valid('query')), 200),
    )
    .openapi(networkGroupsRoute, async (c) =>
      c.json(await getNetworkGroups(c.req.valid('query')), 200),
    )
    .openapi(networkHighlightsRoute, async (c) =>
      c.json(await getNetworkHighlights(c.req.valid('query')), 200),
    )
    .openapi(firmPerformanceRoute, async (c) =>
      c.json(
        await getFirmPerformance({ firmId: c.req.valid('param').id, ...c.req.valid('query') }),
        200,
      ),
    );
};

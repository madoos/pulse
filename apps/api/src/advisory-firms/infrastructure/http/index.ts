import {
  InvalidCursorError,
  type ListAdvisoryFirms,
} from '@advisory-firms/application/list-advisory-firms';
import type { ListFirmFilters } from '@advisory-firms/application/list-firm-filters';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  AdvisoryFirmFiltersSchema,
  AdvisoryFirmsPageSchema,
  AdvisoryFirmsQuerySchema,
  ProblemSchema,
} from '@pulse/contracts';
import { problem } from '@shared/infrastructure/http';
import type { MiddlewareHandler } from 'hono';

const problemContent = { 'application/problem+json': { schema: ProblemSchema } };

type Dependencies = {
  listAdvisoryFirms: ListAdvisoryFirms;
  listFirmFilters: ListFirmFilters;
  requireSession: MiddlewareHandler;
};

export const createAdvisoryFirmRoutes = ({
  listAdvisoryFirms,
  listFirmFilters,
  requireSession,
}: Dependencies) => {
  const middleware = [requireSession];

  const listRoute = createRoute({
    method: 'get',
    path: '/advisory-firms',
    tags: ['Advisory firms'],
    summary: 'List the advisory firms one page at a time, searched and filtered',
    middleware,
    request: { query: AdvisoryFirmsQuerySchema },
    responses: {
      200: {
        description: 'A page of the firms that match, sorted by name',
        content: { 'application/json': { schema: AdvisoryFirmsPageSchema } },
      },
      400: { description: 'The query or the cursor is not valid', content: problemContent },
      401: { description: 'There is no active session', content: problemContent },
    },
  });

  const filtersRoute = createRoute({
    method: 'get',
    path: '/advisory-firms/filters',
    tags: ['Advisory firms'],
    summary: 'List the provinces and specialties the listing can be filtered by',
    middleware,
    responses: {
      200: {
        description: 'The provinces and specialties that have advisory firms',
        content: { 'application/json': { schema: AdvisoryFirmFiltersSchema } },
      },
      401: { description: 'There is no active session', content: problemContent },
    },
  });

  return new OpenAPIHono()
    .openapi(filtersRoute, async (c) => c.json(await listFirmFilters(), 200))
    .openapi(listRoute, async (c) => {
      try {
        return c.json(await listAdvisoryFirms(c.req.valid('query')), 200);
      } catch (error) {
        if (error instanceof InvalidCursorError) return problem(c, 400, error.message);
        throw error;
      }
    });
};

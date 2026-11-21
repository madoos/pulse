# ADR-0003: Backend as a Hono modular monolith with hexagonal architecture

- **Status:** Accepted
- **Date:** 2026-11-20
- **Category:** Architecture

## Context

The application is read-heavy: data arrives in monthly batches, and users read listings, time series and aggregated metrics. The heavy work lives in the data model and the database queries. The services are thin: they validate input, run a use case, and map the result to a response. The language is TypeScript ([ADR-0002](0002-use-typescript-across-the-project.md)).

Even if the services are thin today, the backend has to:

- Keep the business concepts visible in the code, so that anyone can tell what the system does from its structure.
- Isolate the domain (metric rules, validation, aggregation semantics) from frameworks and the database, so it can be tested in isolation.
- Grow by adding new capabilities without touching existing ones. The optional assisted-support capability is a clear example.
- Allow parts to be extracted into separate services later without a rewrite.
- Expose a clear, documented and verifiable API contract to the frontend.

## Decision

### HTTP framework: Hono

The backend uses **[Hono](https://hono.dev/)** on Node.js.

- It is small and built on web standards (`Request`/`Response`).
- It integrates with zod through `@hono/zod-openapi`: each route is defined once with its schemas, which validate requests at runtime and type the handler.
- It imposes no project structure, so the architecture below decides how the code is organised.

### Modular monolith with hexagonal architecture, screaming architecture and vertical slices

The backend is deployed as **one service**, organised as **independent modules**, one per business capability:

| Module | Responsibility |
|---|---|
| `advisory-firms` | Advisory firm reference data: listing, search, filters and profile |
| `performance` | Monthly metrics, metric catalog, aggregation for one firm and for the whole network |
| `support` | Optional assisted-support capability over support documents |
| `shared` | Shared kernel (identifiers such as `FirmId`, `Month`) and technical infrastructure (database client, HTTP app, config, logging) |

- **Screaming architecture:** the top-level folders name business capabilities, not technical layers.
- **Hexagonal architecture:** each module has three layers:
  - `domain`: entities, value objects, invariants, and **ports** (repository interfaces). It has no dependency on frameworks or infrastructure.
  - `application`: use cases that orchestrate the domain through its ports.
  - `infrastructure`: adapters such as database repositories, CSV readers and HTTP routes.
- **Vertical slices:** inside `application`, **each use case has its own folder** (for example `list-firms/`, `find-firm/`, `firm-trend/`, `network-overview/`), holding the use case, its input and its tests.

```
src/
├── main.ts                  # composition root
├── advisory-firms/
│   ├── application/<use-case>/
│   ├── domain/
│   └── infrastructure/
├── performance/
├── support/
└── shared/
```

### Import aliases

Imports use **TypeScript path aliases** (`paths` in `tsconfig.json`), one per module (for example `@advisory-firms/*`, `@performance/*`, `@shared/*`), resolved by the build and test tooling. Imports never use deep relative paths (`../../../`), so code is not coupled to the folder structure: files can be moved or reorganised without rewriting imports. Aliases also make module boundaries visible in every import, which keeps the boundary rules easy to enforce.

### Dependency injection

Dependencies are wired **by hand in a single composition root** (`main.ts`): it builds the adapters and passes them to the use cases through their constructors. There is no DI container and there are no decorators. This keeps dependencies explicit and the domain free of framework code.

### Loading business data

Sanitizing and validating the business data belongs to the ingestion layer, outside the backend ([ADR-0013](0013-business-data-arrives-sanitized-from-ingestion.md)). The backend only loads the files that layer produces.

- Loading is a **use case of the module that owns the data** (`import-firms`, `import-monthly-metrics`), run by that module's versioned seeds ([ADR-0012](0012-versioned-seeds-applied-with-migrations.md)).
- The use case **stores the data as it arrives**: it does not clean, correct or validate business rules.
- File readers are adapters, so a different data source later only means a new adapter.

### Module boundaries

- A module **never imports another module's `domain` or `application`**. Modules share only what lives in `shared`.
- Modules refer to each other only **by identifier** (for example `FirmId`).
- **The exception is read queries in the database:** a repository adapter can join tables of another module, importing only that module's `schema.ts` ([ADR-0010](0010-drizzle-for-data-access-and-migrations.md)). Network aggregations grouped by firm attributes work this way.
- These rules are enforced in CI with `eslint-plugin-boundaries`, so they do not depend on discipline alone.

### API style and contract

- **REST, resource-oriented.** The endpoints are not fixed up front: they are discovered and added slice by slice, as each use case is implemented.
- **Errors** use [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) (`application/problem+json`), with a consistent shape on every endpoint.
- **Request and response schemas** are defined with zod in a shared `contracts` workspace package, used by both the backend (validation) and the frontend (types).
- **The OpenAPI specification is generated automatically** from the route and schema definitions (`@hono/zod-openapi`). It is never written by hand. The backend serves the specification (`/openapi.json`) and an interactive **Swagger UI** (`/docs`). Because the documentation comes from the same definitions that validate requests, it cannot drift from the real behaviour.
- **The frontend depends only on the `contracts` package**, never on backend code. A typed RPC client (Hono's `hc`, which requires importing the backend's app type) is **deferred for now**. It may be revisited in a future ADR.

### Testing by layer

| Layer | Test type |
|---|---|
| `domain` | Pure unit tests |
| `application` | Unit tests with in-memory adapters for the ports |
| `infrastructure` | Integration tests against a real database (testcontainers) |
| HTTP | Route tests through Hono's `app.request()`, without a network |

## Alternatives considered

- **NestJS:** it imposes its own structure (modules, controllers, providers, decorator-based DI). That competes with the hexagonal architecture and puts framework decorators into the domain. It solves organisational complexity this backend does not have.
- **Fastify:** a solid option with schema validation. It was not chosen because Hono's integration with zod and automatic OpenAPI generation is more direct.
- **Express:** mature, but without native types, without built-in validation, and with an older API.
- **Next.js API routes:** they would mix backend and frontend in one application, couple the API to the web app, and prevent other products from reusing it.
- **Layered structure by technical type** (`controllers/`, `services/`, `repositories/`): it hides the business capabilities and spreads one feature across many folders.

## Consequences

### Positive

- The structure shows what the system does, and each feature lives in one place.
- The domain is testable without a database or HTTP.
- New capabilities are added as new modules or new use-case folders, without touching existing ones.
- Modules can be extracted into separate services along boundaries that already exist and are enforced.
- The API contract is documented, always up to date, and explorable through Swagger UI.

### Negative

- More folders and files than a flat structure. For a small service this is visible overhead.
- Manual dependency wiring has to be maintained in the composition root as the number of use cases grows.
- Read queries that join tables of another module couple the modules through the database schema. Extracting one of them into a separate service would mean replacing those joins with an API call or a local copy of the data.
- Without the RPC client, the frontend needs a thin hand-written HTTP client typed by the `contracts` package.

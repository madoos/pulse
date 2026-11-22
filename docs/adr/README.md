# Architecture Decision Records

This folder records the significant decisions made in Pulse: the context, the decision and its consequences.

## Conventions

- One file per decision: `NNNN-short-title.md` (e.g. `0001-use-conventional-commits.md`).
- Numbers are sequential and never reused.
- An accepted ADR can be modified as part of iterating on the design, but only when a human decides to.
- If a decision is replaced rather than refined, a new ADR supersedes it and the old one is marked `Superseded by ADR-XXXX`.
- Possible statuses: `Proposed`, `Accepted`, `Deprecated`, `Superseded`.

## Index

| ADR | Title | Category | Status | Read when |
|---|---|---|---|---|
| [0001](0001-use-conventional-commits.md) | Use Conventional Commits to automate the changelog | Conventions and code style | Accepted | Writing commits, changing CI, releases, package versions or the changelog |
| [0002](0002-use-typescript-across-the-project.md) | Use TypeScript across the whole project | Stack | Accepted | Adding a project, a language, a runtime or shared tooling (lint, format, tests) |
| [0003](0003-backend-hono-modular-monolith.md) | Backend as a Hono modular monolith with hexagonal architecture | Architecture | Accepted | Any backend work: modules, use cases, HTTP routes, API contract, ingestion, import aliases, backend tests |
| [0004](0004-frontend-react-redux-observable.md) | Frontend as a React SPA with Redux and redux-observable | Architecture | Accepted | Any frontend work: features, state, epics, side effects, routing, frontend tests |
| [0005](0005-use-postgresql.md) | Use PostgreSQL as the database | Data | Accepted | Database work: schema, migrations, queries, extensions, search, vectors |
| [0006](0006-quality-and-observability.md) | Quality and observability with SonarQube Cloud and Sentry | Quality | Accepted | Changing CI quality checks, coverage, error monitoring or releases |
| [0007](0007-design-system-react-aria-tokens.md) | Design system built on React Aria Components, CSS Modules and design tokens | Architecture | Accepted | Building or styling UI components, tokens, theming, accessibility, Storybook |
| [0008](0008-infrastructure-docker-compose-and-k3s.md) | Docker Compose for local development, Kubernetes (k3s) on a VPS for deployment | Infrastructure | Accepted | Local environment, Dockerfiles, container images, registry, Kubernetes manifests, deployment, backups, secrets |
| [0009](0009-scss-and-bem-for-styles.md) | Write styles in SCSS with BEM naming | Conventions and code style | Accepted | Writing or reviewing any stylesheet, class names or style mixins |
| [0010](0010-drizzle-for-data-access-and-migrations.md) | Drizzle for data access and migrations | Data | Accepted | Writing database schemas, queries, repositories or migrations |
| [0011](0011-authentication-with-jwt-cookie-and-database-sessions.md) | Authentication with a JWT in an HttpOnly cookie, backed by database sessions | Security | Accepted | Login, sessions, users, protecting routes, cookies, CORS with credentials |
| [0012](0012-versioned-seeds-applied-with-migrations.md) | Versioned seeds applied with the migrations | Data | Accepted | Adding data that must exist in every environment, such as the initial user or seed files |
| [0013](0013-business-data-arrives-sanitized-from-ingestion.md) | Business data arrives sanitized and validated from the ingestion layer | Data | Accepted | Loading business data, designing the data model, writing aggregations or deciding how to handle invalid data |
| [0014](0014-local-checks-with-git-hooks-and-sonarjs.md) | Local checks with git hooks and the SonarJS rules in ESLint | Quality | Accepted | Changing lint rules, git hooks or the checks that run before committing and pushing |
| [0015](0015-dependency-and-image-scanning-with-snyk.md) | Dependency and container image scanning with Snyk | Quality | Accepted | Adding or upgrading dependencies, changing Dockerfiles or base images, or handling a vulnerability alert |
| [0016](0016-data-model-for-advisory-firms-and-monthly-metrics.md) | Data model for advisory firms and their monthly metrics | Data | Accepted | Designing tables, migrations, seeds or aggregation queries for advisory firms and metrics |
| [0017](0017-fiscal-year-from-april-to-march.md) | Metrics are analysed by fiscal year, from April to March | Data | Accepted | Filtering or comparing metrics by year, labelling years or building charts over a year |
| [0018](0018-read-only-database-viewer-with-pgweb.md) | Read-only database viewer with pgweb | Infrastructure | Accepted | Looking at the data, changing the database viewer, its credentials or how it is published |
| [0019](0019-charts-with-visx.md) | Charts built with visx | Architecture | Accepted | Building or changing a chart, or adding a charting dependency |
| [0020](0020-acceptance-tests-with-playwright-bdd.md) | Acceptance tests run the feature files with playwright-bdd and page objects | Quality | Accepted | Writing or running acceptance tests, adding steps or page objects, or changing the acceptance CI job |
| [0021](0021-listing-in-a-drawer-with-virtual-rendering-and-paged-loading.md) | The listing opens in a side drawer, with virtual rendering and paged loading | Architecture | Accepted | Building or changing the listing, its drawer, its API pagination, long lists or infinite scrolling |
| [0022](0022-firm-detail-measured-as-the-network-and-against-its-specialty.md) | The detail of an advisory firm is measured as the network is, and against the rest of its specialty | Data | Accepted | Building or changing the detail of an advisory firm, its metrics, alerts, the comparison with its specialty or how seasonality is handled |

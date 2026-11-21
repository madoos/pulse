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

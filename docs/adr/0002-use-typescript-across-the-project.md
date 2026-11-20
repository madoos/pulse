# ADR-0002: Use TypeScript across the whole project

- **Status:** Accepted
- **Date:** 2026-11-20
- **Category:** Stack

## Context

The application is an internal tool with one main type of user: a manager who needs the state of the network, the detail of each advisory firm and the aggregated metrics. The advisory firms produce their data in monthly batches.

This gives the system a clear **read-heavy** profile:

- **Writes** are infrequent and predictable: one batch per month, plus reference data that rarely changes.
- **Reads** are analytical: time series, sums, weighted averages and comparisons with six months ago.
- **Volume is tiny:** 50 advisory firms × 12 months is about 600 rows. Even 5,000 firms over three years is about 180,000 rows, which is trivial for a relational database.

As a result, the heavy work lives in the **data model** and the database queries. The services have very little business logic: they read, aggregate and present. Raw runtime performance and concurrency are not a deciding factor for this application.

The project needs a frontend, a backend, a design system and shared code between them. The company runs several products and iterates quickly, so it also matters that new people can join the project easily.

## Decision

**TypeScript is the only language for application code:** frontend, backend, design system, shared packages, and scripts such as data ingestion.

- The runtime for server-side code is **Node.js**, on the current Active LTS release.
- TypeScript runs in **strict mode** (`strict`, `noUncheckedIndexedAccess`) from a shared `tsconfig.base.json` that each project extends.
- One shared **base** toolchain covers the whole repository: **pnpm** (package manager), **ESLint + Prettier** (lint and format) and **Vitest** (tests). A project adds specific tools only where it needs them (for example browser tests or a component catalogue), always within the same language.
- Types are erased at runtime, so data crossing a boundary (HTTP requests, CSV/JSONL seed files, environment variables) is validated at runtime with **zod**. The same schemas produce the static types, so validation and types cannot drift apart.

SQL is still written where it is the best tool (migrations and aggregation queries). This decision is about the language of the application code, not about hiding the database.

## Alternatives considered

### Go for the backend and React (TypeScript) for the frontend

Go was the first option and had solid arguments:

- It compiles to a static binary, which gives very small Docker images (about 15 MB) and almost instant startup. That fits `docker compose up` and a fast CI.
- Strong typing and an honest data-access ecosystem: `sqlc` generates typed code from hand-written SQL and checks it against the schema at compile time, and `goose` manages plain SQL migrations embedded in the binary.
- Excellent performance and concurrency.

It was rejected because those advantages do not apply to this application. Speed and concurrency mean nothing for an internal tool with one user where the heavy work lives in the database. In exchange, two languages mean two toolchains to maintain: two linters, two test frameworks, two dependency managers, two ways of building images, and an API contract that has to be generated and kept in sync in both directions.

## Consequences

### Positive

- **One toolchain:** the same linter, formatter, test runner and package manager everywhere, and a single CI pipeline (`pnpm -r lint`, `pnpm -r test`).
- **Shared contracts and types** between frontend and backend through a workspace package, with no code generation across languages.
- **Easier onboarding:** one language is enough to work on any part of the project.
- **Rich ecosystem** for the needs ahead: React, the design system tooling, and first-class SDKs for the optional phase 2 (LLM and vector search).

### Negative

- **Bigger images and slower startup** than a Go binary (about 150 MB instead of about 15 MB). This is acceptable for an internal tool.
- **No runtime type safety by default.** Every boundary must be validated explicitly with zod, and that discipline has to be maintained.
- **The npm ecosystem has a larger supply-chain surface.** Dependencies are kept to a minimum, the lockfile is committed, and versions are pinned.
- **Lower raw performance than Go.** If one part ever becomes CPU-bound, it can be extracted into a separate service in another language. The modular structure of the project keeps that option open.

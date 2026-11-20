# ADR-0004: Frontend as a React SPA with Redux and redux-observable

- **Status:** Accepted
- **Date:** 2026-11-20
- **Category:** Architecture

## Context

The frontend is an internal tool, with no SEO needs and no public traffic. The language is TypeScript ([ADR-0002](0002-use-typescript-across-the-project.md)), and the backend exposes a REST API described by a shared `contracts` package ([ADR-0003](0003-backend-hono-modular-monolith.md)).

The frontend does not need the full hexagonal architecture of the backend. It is fine for it to be coupled to React. What matters is something simpler:

- **React components must not be coupled to side effects.** Data fetching, cancellation, debouncing and error handling must not live inside components.
- **Components should be "dumb":** no logic, only props in and UI out, so they are reusable. Most of them should come from the design system catalog.
- Applications usually start small and then grow in state and asynchronous flows. The base should hold up when that happens.
- It must be possible to run the whole frontend without a backend, with controlled data, to test complete frontend flows in integration tests.

## Decision

### React SPA without a meta-framework

The frontend is a **single-page application built with React and Vite**, with **React Router** for navigation. It does not use a meta-framework (Next.js, Remix and similar). Given the scope of the application and the decisions already taken, React + Vite is enough: there is no server-side rendering or SEO to benefit from, and the API is a separate service.

### A thin layer between side effects and components

The frontend is split into two kinds of pieces:

- **Presentational (dumb) components:** they receive data and callbacks through props and render UI. They do not fetch data, access the store or know about routes. Most of them come from the design system; the rest are application-specific compositions of design system components.
- **A thin connection layer:** **containers** (or hooks) that read state from the store, dispatch actions and pass props down to the dumb components. This is the only place where React meets state and side effects.

State and side effects live outside React:

- **Redux Toolkit** manages state: one slice per feature, created with `createSlice` to keep boilerplate down.
- **redux-observable** manages asynchrony and side effects as RxJS **epics**: fetching, cancelling stale requests (`switchMap`), debouncing search (`debounceTime`), combining filters, and handling errors.

### Interfaces for side effects, injected

The only abstraction borrowed from hexagonal architecture is the lightest one: **interfaces**. Every side effect (HTTP calls to the API, and any other external effect) is described by an interface typed with the `contracts` package. Concrete implementations are injected when the application is built, through `createEpicMiddleware({ dependencies })`, so epics and containers never depend on a concrete implementation.

- In production, the injected implementations are real HTTP clients.
- In tests, they are in-memory implementations returning controlled data. Any container, or the **whole application**, can run without a backend and without side effects.

There are no further layers (no domain, application or infrastructure split): just interfaces and their implementations.

### Testing

| Level | Tool | What it covers |
|---|---|---|
| Unit | **React Testing Library** + Vitest | Dumb components and containers, rendered with in-memory implementations of the interfaces |
| Unit (async flows) | RxJS marble testing (`TestScheduler`) | Epics: debouncing, cancellation and error handling, deterministically and without React |
| Integration | **React Testing Library** + Vitest | A whole feature inside the frontend: store, epics, containers and components together, with in-memory implementations, so **without side effects** and without a backend. User flows of the acceptance scenarios (navigation, filters in the URL, empty and error states) are covered here |
| Acceptance (end to end) | **Playwright** | The acceptance scenarios, run in a real browser against the **whole running system** (frontend, backend and database), with no mocks |

### The URL is the source of truth for navigation state

Filters, search and sorting live in the URL. An epic listens to route changes and triggers loading. This makes reloading the page, going back and sharing a link keep the same view, without duplicating that state in the store.

### Structure: simple screaming architecture

The code follows a **simple screaming architecture**: folders are organised **by feature at every level**, never by technical type. There are no `components/`, `containers/`, `state/` or `effects/` folders. Everything a feature needs (its container, its dumb components, its slice, its epics, its side-effect interfaces and their implementations, and its tests) lives together in that feature's folder. The role of each file is shown by its suffix, not by the folder it sits in:

```
src/
├── main.tsx
├── app/                              # store, root epic, router, wiring of implementations (real | in-memory)
├── <feature>/
│   ├── <sub-feature>/
│   │   ├── <SubFeature>.container.tsx      # thin connection layer: store ↔ props
│   │   ├── <SubFeature>.tsx                # dumb component
│   │   ├── <subFeature>.slice.ts
│   │   ├── <subFeature>.epics.ts
│   │   ├── <subFeature>.effects.ts         # side-effect interface
│   │   ├── <subFeature>.effects.http.ts    # real implementation
│   │   ├── <subFeature>.effects.memory.ts  # in-memory implementation
│   │   └── *.test.ts(x)
│   └── <another-sub-feature>/
└── shared/                           # cross-feature pieces: layout, navigation, error handling
```

A feature can start flat (all its files directly in `<feature>/`) and is split into sub-features only when it grows.

To keep this simple, imports use **TypeScript path aliases** (`paths` in `tsconfig.json`, for example `@app/*`, `@shared/*` and one per feature), resolved by Vite and Vitest. Imports never use deep relative paths (`../../../`), so code is not coupled to the folder structure: splitting a feature into sub-features or moving files does not mean rewriting imports.

The frontend depends only on the `contracts` package and the design system, never on backend code.

## Alternatives considered

- **Hexagonal architecture in the frontend:** too much structure for the scope. Isolating side effects from components gives most of the benefit at a fraction of the cost.
- **`useEffect` + `useState` inside components:** simple to start, but it couples components to side effects. Cancellation, debouncing and race conditions end up re-implemented in every component, and components cannot be tested without mocking the network.
- **TanStack Query or RTK Query:** excellent for server-cache state with less code. They were not chosen because asynchronous flows (debounced search, combined filters, cancellation, streamed answers) are expressed better as RxJS streams, and injected dependencies in epics give the mocking strategy described above.
- **Light RxJS bindings for React (`observable-hooks`, `@react-rxjs/core`, a custom hook):** they keep RxJS without Redux, but provide no single store, no DevTools and no standard pattern for organising flows as the application grows.
- **Next.js / Remix:** they solve server-side rendering and full-stack concerns that this application does not have, and they would mix frontend and backend.

## Consequences

### Positive

- Components are free of side effects, easy to reuse and easy to test, and mostly come from the design system.
- Asynchronous flows are declarative, cancellable and testable with marble tests.
- Side effects sit behind interfaces, so containers and the whole frontend can run with in-memory implementations. Unit and integration tests need no backend and have no side effects, while acceptance tests check the real system end to end.
- A single, predictable pattern (action → reducer → epic) and Redux DevTools make the application easier to understand and debug as it grows.

### Negative

- **Boilerplate:** actions, slices and epics are more code than local state or a query library. This cost is accepted on purpose in exchange for a solid base that scales.
- **Learning curve:** RxJS operators and marble testing are less familiar than plain hooks.
- **Server cache is hand-written:** refetching and invalidation must be implemented in epics. Data changes only once a month, so the impact is low, but it is a known trade-off.

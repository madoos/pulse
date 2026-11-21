# Pulse

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=madoos_pulse&token=1241f1429d7916225aa2fdd38b306b266deb3e91)](https://sonarcloud.io/summary/new_code?id=madoos_pulse)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=madoos_pulse&metric=coverage&token=1241f1429d7916225aa2fdd38b306b266deb3e91)](https://sonarcloud.io/component_measures?id=madoos_pulse&metric=coverage)
[![Snyk](https://snyk.io/test/github/madoos/pulse/badge.svg)](https://app.snyk.io/org/madoos/projects)
[![Sentry](https://img.shields.io/badge/Sentry-monitored-362D59?logo=sentry&logoColor=white)](https://sentry.io/projects/)

### A project by Maurice Domínguez Osorto

Pulse is an internal tool that gives a quick snapshot of a network of tax and accounting advisory firms across Spain. It lets you:

- Browse all advisory firms with their basic data, and search and filter them.
- Open an advisory firm and see how it evolves month by month.
- See the network as a whole, with aggregated monthly metrics.

## Getting started

The project is deployed continuously to Kubernetes: every release is built and rolled out automatically. It is running at:

| Service | URL |
| --- | --- |
| App | https://pulse.0t4da4u.cserverhost.cloud |
| API docs | https://pulse.0t4da4u.cserverhost.cloud/api/v1/docs |
| Storybook | https://storybook.0t4da4u.cserverhost.cloud |

### Run it locally

The only requirement is Docker. From the root of the repository:

```bash
docker compose up --build
```

This builds and starts the whole system:

| Service | URL |
| --- | --- |
| App | http://localhost:8080 |
| API docs | http://localhost:3000/api/v1/docs |
| Storybook | http://localhost:6006 |

Log in with the initial user, the same one created in the deployment:

| Email | Password |
| --- | --- |
| `admin@pulse.com` | `pulse-demo-password` |

Stop it with `docker compose down`, or with `docker compose down -v` to also delete the database.

### Create more users

There is no sign-up: users are created with a command of the API, which reads the password from standard input so it never shows up in the shell history or the process list.

```bash
docker compose run --rm -T migrate node create-user.js ana@example.com
```

Type the password (at least 12 characters), then press `Ctrl+D`.

## Acceptance tests

The use cases are written as Gherkin acceptance tests in [`acceptance-test/`](acceptance-test/), at the root of the repository:

- [`listing.feature`](acceptance-test/listing.feature) — advisory firm listing, search and filters.
- [`detail.feature`](acceptance-test/detail.feature) — advisory firm detail and its monthly evolution.
- [`network-overview.feature`](acceptance-test/network-overview.feature) — aggregated metrics for the whole network.

## Architecture Decision Records

The significant technical decisions are recorded as ADRs. The [ADR index](docs/adr/README.md) lists every decision with its status and when to read it.

## Bitácora

All the initial design decisions, and the reasoning behind them, are recorded in the [Bitácora](docs/bitacora.md) (design log, in Spanish).

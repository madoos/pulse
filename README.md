# Pulse

### Technical test by Maurice Domínguez Osorto

Pulse is an internal tool for Asevia that gives a quick snapshot of its network of tax and accounting advisory firms across Spain. It lets you:

- Browse all advisory firms with their basic data, and search and filter them.
- Open an advisory firm and see how it evolves month by month.
- See the network as a whole, with aggregated monthly metrics.

## Acceptance tests

The use cases are written as Gherkin acceptance tests in [`acceptance-test/`](acceptance-test/), at the root of the repository:

- [`listing.feature`](acceptance-test/listing.feature) — advisory firm listing, search and filters.
- [`detail.feature`](acceptance-test/detail.feature) — advisory firm detail and its monthly evolution.
- [`network-overview.feature`](acceptance-test/network-overview.feature) — aggregated metrics for the whole network.

## Bitácora

All the initial design decisions, and the reasoning behind them, are recorded in the [Bitácora](docs/bitacora.md) (design log, in Spanish).

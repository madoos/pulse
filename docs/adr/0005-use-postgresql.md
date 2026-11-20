# ADR-0005: Use PostgreSQL as the database

- **Status:** Accepted
- **Date:** 2026-11-20
- **Category:** Data

## Context

The application is read-heavy: data arrives in monthly batches and is read as listings, time series and aggregations (sums, weighted averages, comparisons between months). The heavy work lives in the data model and the queries, not in the services ([ADR-0003](0003-backend-hono-modular-monolith.md)).

The data is relational by nature: each advisory firm has many monthly metric records and, for the optional assisted-support capability, many support documents. The source data contains quality problems (duplicates with conflicting values, out-of-range and negative values, inconsistencies between fields), so integrity has to be enforced as close to the data as possible.

The database also has to cover:

- Search that ignores case and accents.
- Semi-structured data (tags and metadata of support documents).
- Vector search and strict per-firm data isolation for the optional assisted-support capability.

Volumes are small: about 600 metric rows today, and about 180,000 in a scenario of 5,000 firms over three years.

## Decision

### PostgreSQL

The database is **PostgreSQL**, with the **`pgvector`** and **`unaccent`** extensions.

| Need | PostgreSQL feature |
|---|---|
| Relational data and integrity | `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL` |
| Aggregations | `GROUP BY`, `FILTER`, window functions (`LAG` to compare with previous months) |
| Precomputed aggregates, if needed | Materialized views, refreshed after each ingestion |
| Search ignoring accents | `unaccent` (and Spanish full-text search with `tsvector` where needed) |
| Semi-structured data | `JSONB` |
| Vector search | `pgvector` |
| Per-firm isolation | Row-Level Security (RLS) |

One database covers all of these, so no extra infrastructure (search engine, vector database) is needed.

The data model itself is not defined here. It will be designed incrementally, as the problem is discovered slice by slice, and significant modelling decisions will be recorded in their own ADRs.

## Alternatives considered

- **MySQL / MariaDB:** relational and valid, but weaker where the application's weight is. There is no `FILTER` in aggregations and no native materialized views, JSON support is less capable than `JSONB`, there is no Row-Level Security, and vector support is recent and limited.
- **SQLite:** very simple, but single-process with serialised writes, and without materialized views, schemas, RLS or `pgvector`. It fits poorly with a database running as a separate service.
- **MongoDB:** the data is relational and needs integrity (`UNIQUE`, `CHECK`, foreign keys). With MongoDB that validation moves into the application, and its aggregation pipeline is more verbose than SQL.
- **Columnar / OLAP databases (ClickHouse, DuckDB):** designed for millions of analytical rows. At these volumes they are over-engineering, they have weak integrity guarantees, and they are not meant to be the transactional store.
- **TimescaleDB:** PostgreSQL with time-series extensions. It pays off with daily or finer-grained metrics, not with monthly data. Because it is PostgreSQL, it can be added later without a migration.
- **PostgreSQL plus a separate vector database:** one more service to deploy and keep in sync, with per-firm isolation enforced in two places. `pgvector` is enough for these volumes.

## Consequences

### Positive

- Data quality is enforced by the database itself, not only by application code.
- Aggregations, the core of the application, are expressed natively and efficiently in SQL.
- One database covers relational data, search, semi-structured data, vectors and isolation, with no extra infrastructure.
- Scaling paths (read replicas, TimescaleDB, a columnar store for analytics) start from PostgreSQL.

### Negative

- The design is tied to PostgreSQL: materialized views, `FILTER`, RLS, `unaccent` and `pgvector` are not portable. This is accepted on purpose.
- The `pgvector` and `unaccent` extensions must be available in every environment where the database runs.
- Materialized views, if introduced, add a refresh step after every ingestion.

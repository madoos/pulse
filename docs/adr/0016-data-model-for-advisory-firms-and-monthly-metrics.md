# ADR-0016: Data model for advisory firms and their monthly metrics

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Data

## Context

The application stores the advisory firms of the network and one set of metrics per firm and month: clients, tax filings, revenue by line, hours, queries, tax agency incidents, documents and satisfaction. The data arrives already sanitized and validated ([ADR-0013](0013-business-data-arrives-sanitized-from-ingestion.md)) and covers several fiscal years.

The main reads are aggregations:

- **The whole network by month**, for a fiscal year and a range of months, compared with the same months of another fiscal year.
- **Grouped by an attribute of the firm**, such as its specialty or its autonomous community.
- **One firm by month**, for its detail page.
- **The available values for the filters**: fiscal years, specialties and autonomous communities, taken from the data.

Metrics are analysed and compared by fiscal year, which runs from April to March ([ADR-0017](0017-fiscal-year-from-april-to-march.md)).

The tables belong to two modules ([ADR-0003](0003-backend-hono-modular-monolith.md)): `advisory-firms` owns the firms and their reference data, and `performance` owns the metrics.

## Decision

### Tables

**`advisory-firms` module**

| Table | Columns | Notes |
|---|---|---|
| `autonomous_communities` | `id` smallint PK, `name` text unique | Reference data |
| `provinces` | `id` smallint PK, `name` text unique, `autonomous_community_id` FK | Reference data. Grouping by autonomous community goes through the province |
| `specialties` | `code` text PK, `name` text | Reference data (`fiscal`, `contable`, `laboral`) |
| `advisory_firms` | `id` integer PK, `name`, `tax_id` unique, `province_id` FK, `city`, `specialty_code` FK, `onboarded_on` date, `employees` smallint | `id` is the identifier of the source system |

**`performance` module**

`monthly_metrics`, one row per firm and month:

| Group | Columns |
|---|---|
| Key | `firm_id` FK, `month` date (first day of the month), `fiscal_year` smallint generated |
| Clients | `active_clients`, `new_clients`, `churned_clients` |
| Tax filings | `filings_income_tax`, `filings_vat`, `filings_corporate_tax`, `filings_other` |
| Revenue (cents) | `revenue_advisory`, `revenue_management`, `revenue_consulting` |
| Operations | `hours_worked`, `queries_received`, `queries_resolved`, `tax_agency_incidents`, `documents_processed` |
| Quality | `satisfaction` numeric(2,1) |

### Indexes

`monthly_metrics` is the table that grows with the network (firms × months) and the one every view reads, so its indexes follow the two ways it is read:

| Index | Query it serves | Why it matters |
|---|---|---|
| Primary key `(firm_id, month)` | The months of one firm, for its detail page | Reads only that firm's rows, however many firms there are. It also rules out a second record for the same firm and month |
| `(fiscal_year, month)` | The network for a fiscal year and a range of months, and the list of available fiscal years | Narrows the read to the selected year and months instead of the whole history |

With a few thousand rows PostgreSQL reads the whole table faster than going through an index, so today the indexes barely show. They matter as the data grows: the detail page stays instant through the primary key whatever the size of the network, and the network view reads one year instead of all of them.

The network view still has to add up every row of the selected year, so past a certain size the index is not enough. The next step is a precomputed monthly summary of the network and of each group, refreshed on every data load (see the alternatives below).

### Rules

- **One column per metric (wide table).** Aggregations are plain `SUM` and `AVG` over typed columns. Adding a metric is a migration.
- **Every metric is stored**, including those not shown yet, so new views do not need the data to be loaded again.
- **`month` is a `date` on the first day of the month**, and **`fiscal_year` is a generated column**: the year of `month` minus three months (April 2025 to March 2026 is fiscal year 2025, shown as "2025-26"). PostgreSQL calculates it from `month`, so it is never loaded and cannot drift from it. The available years are a `SELECT DISTINCT`, and filtering by year and months uses the index.
- **Amounts are stored in cents as integers:** exact, and read as numbers instead of strings.
- **Derived metrics are not stored.** Total revenue, revenue per client and churn are calculated in the queries.
- **Categorical values are reference tables**, not free text, so they are normalized, can be joined for grouping and feed the filters.
- **Only structural constraints:** primary keys, foreign keys, `NOT NULL` and a unique tax ID. Domain rules (ranges, non-negative values) are not checked, because validating the data belongs to the ingestion layer ([ADR-0013](0013-business-data-arrives-sanitized-from-ingestion.md)).
- **The firm keeps the identifier of the source system**, so the support documents, which refer to it, can be linked without translation.
- **Aggregations join across modules:** the `performance` repository joins `monthly_metrics` with `advisory_firms` and `provinces` to group by specialty or autonomous community, as [ADR-0010](0010-drizzle-for-data-access-and-migrations.md) allows for read queries.

### Loading

The data is loaded by a single versioned seed from `shared/infrastructure/database/business-data/`, one CSV file per table ([ADR-0012](0012-versioned-seeds-applied-with-migrations.md)). The files are the output of the ingestion layer: clean, in the shape of the tables (province by its official code, specialty by its code, month as a date, amounts in cents) and covering three fiscal years.

## Alternatives considered

- **One row per firm, month and metric (key-value):** new metrics need no migration, but every query has to pivot the rows back into columns, the values lose their types and the table is sixteen times longer.
- **One table per metric group (clients, filings, revenue...):** smaller tables, but every view that combines groups needs joins, and all groups share the same key and are loaded together.
- **`month` as text (`2025-04`) or as year and month columns:** simpler to load, but date ranges and the fiscal year become string or arithmetic tricks instead of date operations.
- **Amounts as `numeric(12,2)`:** exact as well, but the driver returns them as strings.
- **Specialty and province as free text:** no reference tables, but nothing keeps the values consistent and grouping by autonomous community needs a mapping somewhere else.
- **Storing derived metrics or a precomputed monthly network summary:** faster reads, but a second copy of the data to keep in sync. Not needed at this size; it is the first step if the network grows by orders of magnitude.
- **Fetching firm attributes through a port and grouping in the application:** respects strict module boundaries, but moves the aggregation out of the database and sends every firm through the application on each request.

## Consequences

### Positive

- Network, group and firm aggregations are single SQL queries over one indexed table.
- The filters are always in sync with the data, with no hard-coded lists.
- The schema documents the data contract that the application relies on.
- Comparing fiscal years month by month is a simple condition on `fiscal_year` and `month`.

### Negative

- Adding a metric needs a migration and a change to the seed files.
- The `performance` module depends on the schema of the `advisory-firms` tables it joins.
- Data that breaks the contract in the domain (for example a negative count) is stored as it arrives.
- Using the source identifier as the primary key ties the firms to a single source. Several sources would need an internal identifier and a separate source identifier.

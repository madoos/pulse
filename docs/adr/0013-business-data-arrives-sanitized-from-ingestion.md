# ADR-0013: Business data arrives sanitized and validated from the ingestion layer

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Data

## Context

The application shows the advisory firms of the network and their monthly metrics: clients, tax filings, revenue, satisfaction and others. In a real deployment that data comes from the systems of each advisory firm, through an ingestion process that collects it, cleans it and checks it before it reaches the application.

Data from many sources is always imperfect: duplicated records, impossible values (a negative count, a satisfaction above the top of its scale) or figures that do not add up from one month to the next. Someone has to deal with that, and the question is where.

If the application did it, cleaning rules would be scattered across loading, queries and views, every aggregation would have to defend itself against bad data, and two screens could fix the same anomaly in different ways. Those rules also depend on the sources (what each system sends, what a correction means for the business), which the application does not own.

## Decision

**Sanitizing and validating the business data is the responsibility of the ingestion layer, which is out of the scope of this application.** The application assumes that every piece of business data it receives is already sanitized and validated against a data contract, and builds on that.

The contract the application relies on:

- **One record per advisory firm and month.** No duplicates.
- **Every metric is within its domain:** counts and amounts are not negative, and satisfaction is between 1 and 5.
- **Every record belongs to a known advisory firm,** and every advisory firm has a unique tax ID.
- **Categorical values are normalized,** such as the specialty of an advisory firm.
- **A missing month is a missing record,** never a record filled with zeros.

On top of that contract, the application:

- **Does not clean, correct or reconcile data.** It loads it and works with it as it is.
- **Models and aggregates assuming valid data:** the data model and the queries are designed for clear, efficient aggregations, without defensive logic against values that the contract rules out.
- **Still handles the cases the contract allows,** such as a month without data or a division by zero when comparing with a previous value of zero, because those are valid data, not errors.

Loading the seed files follows the same rule: they are treated as the output of the ingestion layer.

## Alternatives considered

- **Cleaning the data in the application while loading it:** puts source-specific business rules (which duplicate wins, how to correct an impossible value) in a place that does not own the sources, and mixes two responsibilities in one component.
- **Rejecting invalid records in the application and showing them as gaps:** safer, but it is still validation that belongs to ingestion, and it hides the problem from those who can fix it at the source.
- **Defensive queries and views:** every aggregation would carry filters and corrections for bad data, making the queries harder to read and easier to get inconsistent.

## Consequences

### Positive

- The application focuses on its purpose: modelling, aggregating and showing the data.
- The data model and the queries stay simple, and aggregations can be optimized without defensive logic.
- Data quality has a single owner, close to the sources.

### Negative

- If data that breaks the contract reaches the application, it shows wrong figures and does not detect it.
- The application depends on a contract that is not enforced in this repository. The ingestion layer and the contract have to be designed and built before using the application with real data.

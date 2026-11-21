# ADR-0020: Acceptance tests run the feature files with playwright-bdd and page objects

- **Status:** Accepted
- **Date:** 2026-11-22
- **Category:** Quality

## Context

The acceptance scenarios are written in Gherkin in `acceptance-test/*.feature`. [ADR-0004](0004-frontend-react-redux-observable.md) decides that they run end to end with Playwright, in a real browser, against the whole running system with no mocks. It does not say how the scenarios become tests, how the tests are organised, which data they use or where they run.

If the tests were written apart from the `.feature` files, the two would drift: a scenario could change and its test keep passing.

## Decision

- **The `.feature` files are executed** with [playwright-bdd](https://vitalets.github.io/playwright-bdd/), which turns each scenario into a Playwright test. Steps are written once and reused across scenarios.
- **Only the scenarios tagged `@e2e` run end to end.** The rest are covered by the unit and integration tests of the API and the web. A scenario is tagged when its flow needs the whole system or the real data to be trusted.
- **Page objects:** the steps never use selectors. They talk to page objects (`acceptance-test/pages/`) that know the pages and find their elements by role and accessible name, like users and screen readers do. A change in the markup is fixed in one page object.
- **Real data from the seeds:** the system runs with Docker Compose, its migrations and its versioned seeds ([ADR-0012](0012-versioned-seeds-applied-with-migrations.md)). The tests log in as the demo user and change nothing.
- **The expected values come from the database**, read with SQL in the steps, not from the API under test. When a scenario names concrete values, a `Given` step checks the seeds still match them.
- **A CI job of its own**, `acceptance`, starts the system with Docker Compose and runs the tests, so a slow or failing end-to-end run does not hide the results of the other checks. On failure it keeps the Playwright report, traces and the logs of the services.
- Locally: `pnpm test:acceptance` starts the system and runs them.

## Alternatives considered

- **Playwright specs written by hand, with the scenario as a comment:** simpler, but the `.feature` files would stop being executable and drift from the tests.
- **Cucumber.js driving Playwright:** runs Gherkin too, but loses the Playwright test runner: its fixtures, parallelism, traces and report.
- **Each test inserting its own data:** isolates the tests, but needs write access and cleanup, and stops checking the data the application is shown with.

## Consequences

### Positive

- The specification and the tests cannot drift: a scenario that changes fails until its steps follow.
- Steps and page objects are reused, so adding a scenario is often only tagging it.
- Assertions do not depend on the code they test.

### Negative

- End-to-end runs are slow and need Docker: they run in their own job, and only for the tagged scenarios.
- Scenarios that need data the seeds do not have, such as a year without a previous one or a month without data, cannot run end to end and stay covered by lower-level tests.

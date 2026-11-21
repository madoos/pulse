# ADR-0012: Versioned seeds applied with the migrations

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Data

## Context

Some data has to exist for the application to be usable, not only its schema. The first case is the initial user: without one, nobody can log in after a fresh deployment, and users are not created through the API ([ADR-0011](0011-authentication-with-jwt-cookie-and-database-sessions.md)). Later, the seed files of the business data will need the same treatment.

That data has to be:

- **Created without manual steps**, locally and in every deployment ([ADR-0008](0008-infrastructure-docker-compose-and-k3s.md)).
- **Created once.** Running it again on every deployment must not duplicate it, nor overwrite changes made afterwards (for example a password changed by the user).
- **Free of secrets in the repository.** Credentials come from the environment.

## Decision

Seeds work like migrations ([ADR-0010](0010-drizzle-for-data-access-and-migrations.md)): versioned steps, applied once and recorded in the database.

- A **seed** is an `id` and a function that receives the database. Its id is namespaced by the module that owns the data and numbered (`auth/0001-initial-user`), and it never changes once deployed.
- Each **module owns its seeds** in `<module>/infrastructure/seed/`, and they reuse the module's use cases (the initial user is created with `create-user`, with the same validation and password hashing).
- The **`seeds` table** records the id of every applied seed and when it ran. It is created by a regular migration.
- The **migration task applies the seeds right after the migrations**, in order, skipping those already recorded. A seed is recorded only after it succeeds, so a failed seed runs again next time and the deployment stops before the backend is updated.
- **Seed data that is secret comes from the environment:** a Kubernetes Secret in deployment, and fixed demo values in Docker Compose, documented in the README so the application can be used right after `docker compose up`.

### Initial user

The first seed creates one user from `SEED_USER_EMAIL` and `SEED_USER_PASSWORD`. Since it runs only once, changing those variables later does not change the user: further users and password changes go through the `create-user` command.

## Alternatives considered

- **Creating the user by hand after the first deployment:** a manual step that is easy to forget, and impossible for someone who only runs `docker compose up`.
- **Ensuring the user on every deployment (create or update):** keeps the user in sync with the environment, but overwrites changes made through the application and makes the environment, not the database, the source of truth for users.
- **SQL seed files in the migrations:** simple, but the password has to be hashed by the application and must not be written in the repository.
- **A separate seeding task:** one more service and Job to order with the migrations, for no benefit over running both in the same task.

## Consequences

### Positive

- A fresh environment is usable right away, with no manual steps.
- Seeds are reviewable code, versioned with the schema they depend on, and applied the same way everywhere.
- The same mechanism will load the seed files of the business data.

### Negative

- The migration task now needs the seed credentials, so the Secret must exist before the first deployment.
- A seed that has to change after being applied needs a new seed with a new id, as with migrations.
- Seeds are not undone: removing seeded data is a new seed or a manual operation.

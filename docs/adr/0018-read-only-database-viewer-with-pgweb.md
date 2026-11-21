# ADR-0018: Read-only database viewer with pgweb

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Infrastructure

## Context

The database is only reachable inside its network: the `db` service in Docker Compose and a `ClusterIP` Service in Kubernetes ([ADR-0008](0008-infrastructure-docker-compose-and-k3s.md)). That is the right default, but it leaves no simple way to look at the data: checking what the migration task loaded, exploring the tables while designing queries, or showing the data model during a review.

Locally, the database port is published and any client can connect. In the deployment, reaching it means an SSH session to the server and a port forward every time.

## Decision

**A web database viewer, [pgweb](https://github.com/sosedoff/pgweb), runs next to the database in both environments, in read-only mode and behind basic authentication.**

- **Read-only:** pgweb runs with `--readonly`, which rejects any statement that changes data or schema. `--lock-session` prevents connecting to any other database from its interface.
- **Basic authentication** with the **same demo credentials as the initial user** of the application ([ADR-0012](0012-versioned-seeds-applied-with-migrations.md)), so there is one set of credentials to remember.
- **Docker Compose:** a `pgweb` service on port `8081`, started after the migration task.
- **Kubernetes:** a Deployment and a `ClusterIP` Service with a fixed IP, published by Caddy on its own subdomain with HTTPS and `noindex`, like the other services. It connects with the database credentials from the `database` Secret, and runs as a non-root user with a read-only filesystem.
- The image version is pinned.

## Alternatives considered

- **Port forward and a local client (DBeaver, TablePlus, psql):** exposes nothing new, but needs SSH access to the server and a manual step every time, and is not available to anyone without that access.
- **pgAdmin:** complete, but heavy, aimed at administration rather than browsing, and with its own user management.
- **Adminer:** lightweight, but it can connect to any server from its login form and has no read-only mode.
- **A read-only PostgreSQL role for the viewer:** a stronger guarantee than pgweb's read-only mode, since the database itself refuses writes. It needs a role and a password created and kept outside the migrations; it is the first improvement if the viewer stays.

## Consequences

### Positive

- The data can be checked in the browser, locally and in the deployment, with no client to install.
- Data and schema cannot be changed from the viewer.
- No database port is opened to the internet.

### Negative

- The whole database can be read from the internet by anyone with the credentials, including the password hashes of the users.
- The credentials are the demo ones, written in the repository. With real data they must move to a Secret, or the viewer must stop being published.
- pgweb's read-only mode filters statements in the viewer; it is not enforced by the database.
- The credentials of the viewer are not linked to the user of the application: changing the user's password does not change the viewer's.
- The Caddy site file is installed on the server by hand, as with the other sites.

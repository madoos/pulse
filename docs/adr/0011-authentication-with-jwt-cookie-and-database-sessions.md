# ADR-0011: Authentication with a JWT in an HttpOnly cookie, backed by database sessions

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Security

## Context

The application is an internal tool: only registered users can use it. Users are created by the team, so self-registration is out of scope.

Authentication has to:

- Keep the credential out of reach of JavaScript, so a cross-site scripting bug cannot steal it.
- Protect against cross-site request forgery.
- Allow ending a session immediately (logout, or a stolen credential), not only when it expires.
- Work the same way locally and in deployment, where the web app and the API share a domain.

## Decision

### Users

- Users live in the database (`users`): email and a password hash.
- Passwords are hashed with **scrypt** (Node.js `crypto`), with a random salt per password. They are never stored or logged in clear text.
- **There is no registration endpoint.** Users are created with a command of the backend (`create-user`), run as a one-off task by someone with access to the environment.

### Sessions

- Logging in (`POST /api/v1/session`) checks the credentials and creates a row in `sessions` (user, creation, expiry, revocation).
- The API answers with a **JWT** signed with HS256 and a secret from the configuration. The token carries only the user id and the session id, and expires with the session (8 hours).
- **On every request the API verifies the token signature and checks in the database that the session exists, has not expired and has not been revoked.** Logging out (`DELETE /api/v1/session`) revokes the session, so the token stops working immediately, even if it was copied.
- `GET /api/v1/session` returns the current user, so the web app knows whether there is an active session.
- Failed logins answer with the same error whether the email exists or not, and the password check takes the same time in both cases.

### Cookie

The token travels only in a cookie, never in the response body or in `localStorage`:

| Attribute | Value | Why |
|---|---|---|
| `HttpOnly` | yes | JavaScript cannot read it |
| `Secure` | yes in production | Only sent over HTTPS |
| `SameSite` | `Strict` | Not sent on cross-site requests, which blocks CSRF |
| `Path` | `/api` | Only sent to the API |
| `Max-Age` | session lifetime | Disappears when the session expires |

Locally, where the web app and the API run on different ports of `localhost` (same site, different origin), the web app sends requests with credentials and the API allows them through CORS for the configured origin only.

### Protecting routes

An authentication middleware resolves the session and makes the current user available to the routes. Every route of the API requires a session, except the health check, the API documentation and logging in.

### Architecture

Authentication is its own module (`auth`) of the modular monolith ([ADR-0003](0003-backend-hono-modular-monolith.md)). Users and sessions are reached through ports (`UserRepository`, `SessionRepository`, `PasswordHasher`, `TokenSigner`), with PostgreSQL and crypto adapters ([ADR-0010](0010-drizzle-for-data-access-and-migrations.md)).

## Alternatives considered

- **Stateless JWT only:** no database lookup per request, but a token cannot be revoked before it expires. Logout would only delete the cookie.
- **Opaque session id in the cookie:** equally secure and simpler, since the database is checked anyway. The JWT was kept because it lets the API reject forged or expired tokens before touching the database, and it carries the session in a standard format.
- **Token in `localStorage` with an `Authorization` header:** readable by any script on the page, so an XSS bug leaks the session.
- **Refresh tokens:** useful for long-lived sessions across devices. For an internal tool with 8-hour sessions, logging in again is enough.
- **An external identity provider (OAuth, OIDC):** the right choice once several products share users. Out of scope for now.

## Consequences

### Positive

- The session cannot be read by scripts and is not sent cross-site.
- Sessions can be revoked immediately.
- The same mechanism works locally and in deployment.
- User storage and token handling sit behind ports, so they can change (for example to an identity provider) without touching the use cases.

### Negative

- Every authenticated request queries the database to check the session.
- Users have to be created by hand with a command.
- There is no rate limiting on logins yet. It has to be added before the application is exposed beyond internal use.
- The signing secret must be kept safe and rotated by hand. Rotating it logs every user out.

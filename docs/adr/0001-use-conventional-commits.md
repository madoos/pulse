# ADR-0001: Use Conventional Commits to automate the changelog

- **Status:** Accepted
- **Date:** 2026-11-19
- **Category:** Conventions and code style

## Context

Pulse needs a clear history of what changed and why, both for the reviewers of this technical test and for anyone maintaining it later. Writing a changelog by hand is tedious and quickly gets out of date.

If commit messages follow a structured format, tooling can generate the changelog from git history and infer the next semantic version (major, minor or patch).

## Decision

All commits in this repository follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification.

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

- The description is in English, in the imperative mood, lowercase and with no trailing period: `add province filter`, not `Added province filter.`
- The header is 72 characters or fewer.
- Breaking changes are marked with `!` after the type/scope, or with a `BREAKING CHANGE:` footer.

### Allowed types

| Type | Use | Appears in changelog | Version bump |
|---|---|---|---|
| `feat` | New functionality | Yes — Features | minor |
| `fix` | Bug fix | Yes — Bug Fixes | patch |
| `perf` | Performance improvement | Yes — Performance | patch |
| `refactor` | Code change that neither fixes a bug nor adds a feature | No | — |
| `docs` | Documentation only (README, ADRs, acceptance tests) | No | — |
| `test` | Adding or fixing tests | No | — |
| `build` | Build system, Docker, dependencies | No | — |
| `ci` | CI/CD pipeline configuration | No | — |
| `style` | Formatting, no logic change | No | — |
| `chore` | Maintenance tasks that fit none of the above | No | — |

Any type followed by `!` (e.g. `feat(api)!:`) triggers a **major** version bump.

### Suggested scopes

`api`, `web`, `db`, `seed`, `infra`, `ci`, `docs`. Scopes are optional and the list can grow with the project.

### Examples

```
feat(web): add province and specialty filters to the listing
fix(api): return 404 when the advisory firm does not exist
docs(adr): add ADR-0001 on conventional commits
test(api): add integration test for the listing endpoint
ci: run lint and tests on pull requests
feat(api)!: rename /advisory-firms/{id}/metrics query params
```

## Enforcement and automation

- **Validation — commitlint:** the `Commit lint` workflow (`.github/workflows/commitlint.yml`) checks every commit on pull requests and on `main` against `@commitlint/config-conventional` plus the rules in `commitlint.config.mjs` (header ≤ 72 chars, lowercase subject). A non-conforming commit fails the pipeline.
- **Changelog and releases — release-please:** the `Release Please` workflow (`.github/workflows/release-please.yml`) runs on every push to `main`. It keeps an open release PR that updates `CHANGELOG.md`, `version.txt` and `.release-please-manifest.json`. Merging that PR creates the git tag and the GitHub Release. `CHANGELOG.md` is never edited by hand.
- **Versioning:** versions follow [Semantic Versioning](https://semver.org/) and are derived from the commit types. While the project is below `1.0.0`, `feat` bumps the minor version (`bump-minor-pre-major`).
- **Stack-agnostic setup:** release-please uses the `simple` release type (`version.txt`), so it does not depend on the language or framework chosen for the app.

### Why release-please

- It runs entirely in GitHub Actions: no local tooling or tokens to manage.
- The release PR lets you review the changelog before publishing, instead of releasing on every push.
- It reads the same Conventional Commits that commitlint enforces, so the two tools close the loop.

## Consequences

### Positive

- The changelog and version numbers are generated automatically and stay in sync with the code.
- The history is easy to read and filter (e.g. `git log --grep "^feat"`).
- Each commit's intent is clear, which helps code review and the technical defense.

### Negative

- It requires discipline: every commit has to be classified, and small changes still need a proper message.
- It adds tooling (linter, hook, changelog generator) that has to be configured and maintained.
- Mixed commits (a fix plus a refactor) should be split, which takes a bit more effort.

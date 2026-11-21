# ADR-0014: Local checks with git hooks and the SonarJS rules in ESLint

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Quality

## Context

CI checks every push: format, lint, types, tests with coverage, commit messages ([ADR-0001](0001-use-conventional-commits.md)) and the SonarQube Cloud quality gate ([ADR-0006](0006-quality-and-observability.md)). When one of them fails, the problem is found minutes after pushing, and fixing it takes another commit and another CI run.

The application is released continuously, so `main` has to stay green. Most of those checks can run on the developer's machine before the code leaves it. SonarQube Cloud cannot, because it analyses on its servers, but its rules for JavaScript and TypeScript are published as an ESLint plugin.

## Decision

### SonarJS rules in ESLint

**`eslint-plugin-sonarjs`** is part of the shared ESLint configuration, with its `recommended` rules. `pnpm lint`, the editor and CI report the same JavaScript and TypeScript issues that SonarQube Cloud would report, before the analysis runs.

A rule is turned off only for the files where it cannot work, with the reason written next to it. The first case: epic tests assert inside a shared marble-testing helper, which `assertions-in-tests` cannot see.

### Git hooks with lefthook

**lefthook** runs the checks as git hooks. Its configuration is one file, `lefthook.yml`, and the hooks are installed by `pnpm install`, so nobody has to set them up by hand.

| Hook | Checks | Why there |
| --- | --- | --- |
| `commit-msg` | commitlint, with the same configuration as CI | A wrong message is cheap to fix before the commit exists |
| `pre-commit` | Prettier and ESLint on the staged files, typecheck, and the tests related to the staged files | Fast checks, run in parallel, so every commit is valid |
| `pre-push` | The whole test suite with coverage, including the integration tests | Too slow for every commit, but nothing broken reaches CI |

Hooks are a convenience, not a guarantee: they can be skipped (`--no-verify`), so CI still runs every check and stays the source of truth.

## Alternatives considered

- **Husky with lint-staged:** the most common option, but two tools and two configurations for what lefthook does alone, and lefthook runs jobs in parallel.
- **SonarQube for IDE only:** it applies the same rules in the editor, but depends on each developer's setup and does not block a commit. It is still recommended, and it also covers the Dockerfiles and workflows, which the ESLint plugin does not.
- **Running the SonarQube scanner locally:** it needs the token on every machine and uploads an analysis for each run.
- **No local checks:** simpler, but every mistake costs a CI run and can leave `main` red.

## Consequences

### Positive

- Most problems are found before committing, and `main` stays green.
- The same rules apply in the editor, in the hooks and in CI.
- Hooks install themselves with the dependencies.

### Negative

- Committing and pushing are slower, especially the push, which runs the integration tests.
- The integration tests in the `pre-push` hook need Docker running.
- Issues in Dockerfiles, workflows and manifests are still only found by SonarQube Cloud, or by SonarQube for IDE.

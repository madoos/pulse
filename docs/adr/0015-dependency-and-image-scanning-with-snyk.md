# ADR-0015: Dependency and container image scanning with Snyk

- **Status:** Accepted
- **Date:** 2026-11-21
- **Category:** Quality

## Context

Most of the code that runs in production is not written by the team: it is the npm dependencies of every package and the operating system and tools inside the container images. A vulnerability there is as exploitable as one in our own code.

SonarQube Cloud ([ADR-0006](0006-quality-and-observability.md)) analyses our code and gives a first view of dependency risks, but it does not scan the container images, and it only reports when an analysis runs. A vulnerability published after a release would go unnoticed until the next change.

The tool should be free at this size and fit the existing CI.

## Decision

**Snyk** scans the dependencies and the container images in CI, using the Snyk CLI at a pinned version.

- **Dependencies:** `snyk test --all-projects` checks every package of the monorepo against the lockfile. CI fails on **high or critical vulnerabilities that can be fixed by upgrading**. One with no fix yet does not block the pipeline, because there is nothing to do but wait, and it stays visible in Snyk.
- **Container images:** every image built in CI (API, web and Storybook) is scanned with `snyk container test`. CI fails on **high or critical vulnerabilities** in the operating system or in the packages inside the image.
- **Monitoring:** on every push to `main`, `snyk monitor` records the dependencies and the images in Snyk, which alerts by email when a new vulnerability affects what is deployed.

To keep the images clean:

- **The runtime images apply the operating system patches** (`apk upgrade`) on top of the base image, which is often weeks behind the security fixes of its packages.
- **They contain only what is needed to run.** The API image drops npm, which comes with the Node.js base image, is not used at runtime and brings its own vulnerable dependencies.

**Exception: the API image is distroless.** Its embedding model needs ONNX Runtime, which needs glibc, so it cannot run on Alpine ([ADR-0023](0023-support-assistant-with-vector-search-and-an-agent.md)). Debian slim brings system tools (`coreutils`, `adduser`) with high vulnerabilities that have no fix, so the runtime image is `gcr.io/distroless/cc-debian13`: glibc and libstdc++, the Node.js binary and the application, with no shell and no package manager. Without a package manager it cannot apply patches with `apk upgrade`: it gets them when the distroless base image is updated, which happens often, and the next build picks them up.

## Alternatives considered

- **SonarQube Cloud only:** already in place, but it does not scan the images and does not alert on vulnerabilities published after the analysis.
- **Dependabot or `pnpm audit`:** cover the npm dependencies, but not the images.
- **Trivy:** free and open source, and scans images well, but has no hosted dashboard or alerts for what is deployed without running more infrastructure.
- **Pinning the base images by digest:** reproducible builds, but the images keep the vulnerabilities of the day they were pinned, and someone has to update them by hand.

## Consequences

### Positive

- A vulnerable dependency or image is found before it is released, and Snyk alerts on new ones after it is.
- The runtime images are smaller and carry fewer packages to patch.

### Negative

- One more external service, its free-plan limits and one more secret (`SNYK_TOKEN`) in CI.
- `apk upgrade` makes builds depend on the day they run: two builds of the same commit can have different package versions.
- The API image cannot be patched on top of its base image: a vulnerability in it waits for a new distroless image. It has no shell either, so it cannot be inspected with `docker exec … sh`.
- A new high or critical vulnerability in a base image can turn CI red without any change in the code, until a patched package or image is available.

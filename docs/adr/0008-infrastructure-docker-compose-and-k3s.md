# ADR-0008: Docker Compose for local development, Kubernetes (k3s) on a VPS for deployment

- **Status:** Accepted
- **Date:** 2026-11-20
- **Category:** Infrastructure

## Context

The system is made of a backend, a frontend, a PostgreSQL database with extensions ([ADR-0005](0005-use-postgresql.md)) and one-off tasks (migrations and data ingestion). It must:

- Start locally with a **single command and no manual steps**.
- Be built and released continuously from CI, with container images produced by the pipeline.
- Be deployed on the available infrastructure: **one VPS**.

The company runs several products. A common way of deploying them all is more valuable than the simplest possible setup for one application.

## Decision

### Local development: Docker Compose

The whole system starts with **`docker compose up`**:

- PostgreSQL with the required extensions.
- Migrations and data ingestion as **one-off services** that run in order once the database is healthy, and then exit.
- The backend and the frontend, which start once migrations and ingestion have completed.

Compose **builds the images from the source code**, so it needs no registry credentials. Only public base images are pulled.

### Deployment: k3s on a single VPS

The application is deployed to **[k3s](https://k3s.io/)**, a lightweight, certified Kubernetes distribution, installed on one VPS.

- **Ingress and TLS:** Traefik, which ships with k3s, as ingress controller, and **cert-manager** with Let's Encrypt for HTTPS on a domain pointing to the VPS.
- **Database:** PostgreSQL runs as a `StatefulSet` with a persistent volume (the k3s `local-path` provisioner), using an image that includes the required extensions. A `CronJob` takes regular `pg_dump` backups and copies them **off the VPS** to S3-compatible storage.
- **Migrations and ingestion:** run as Kubernetes `Job`s before the new version of the backend is rolled out.
- **Workloads:** backend and frontend as `Deployment`s with readiness and liveness probes, resource requests and limits, and rolling updates.
- **Network:** only ports 80 and 443 are public. The Kubernetes API (6443) is restricted to known addresses or reached through SSH or a VPN.

### Manifests: Kustomize

Kubernetes manifests live in the repository and are organised with **Kustomize**: one base and one overlay per environment. Kustomize is built into `kubectl` and needs no templating language.

### Container images: GitHub Container Registry

- CI builds the backend and frontend images and pushes them to **GitHub Container Registry (`ghcr.io`)**, authenticated with the workflow's own `GITHUB_TOKEN`. No extra account or secret is needed.
- Images are tagged with the **release version** ([ADR-0001](0001-use-conventional-commits.md)) and with the commit SHA.
- **Pulling images:**
  - **Public images** need no configuration anywhere.
  - **Private images** need credentials. In the cluster, a dedicated token with only `read:packages`, used either as an `imagePullSecret` or in the k3s registry configuration (`/etc/rancher/k3s/registries.yaml`). On a developer machine, `docker login ghcr.io` with a personal token. Personal tokens are never reused for the cluster.
  - If images are private, old versions are pruned automatically to stay within the free storage quota.

### Delivery: push from CI

After a release, a GitHub Actions workflow applies the Kustomize overlay to the cluster, using a `kubeconfig` stored as a CI secret. The rollout is checked (`kubectl rollout status`) and fails the pipeline if the new version does not become ready.

### Secrets

Runtime configuration that is secret (database credentials, the Sentry DSN, the registry token) is stored as Kubernetes `Secret`s and is never committed in plain text.

## Alternatives considered

- **Docker Compose on the VPS:** the simplest option, reusing the local file. It was rejected because deployments would be manual, there are no real health checks or rolling updates, and it does not give the other products a common deployment platform.
- **Managed Kubernetes (GKE, EKS, DigitalOcean Kubernetes…):** removes control-plane maintenance, but costs money and is excessive for one internal application.
- **Full Kubernetes (kubeadm) on the VPS:** heavier to install and run than k3s, with no benefit on a single node.
- **Helm instead of Kustomize:** useful to distribute charts to third parties. For in-house manifests, its templating adds complexity that overlays do not need.
- **GitOps (Argo CD, Flux):** pull-based, so the Kubernetes API does not need to be reachable from CI. It was not chosen for now because it uses more resources on a small VPS and adds one more component. It is the natural next step if the cluster hosts more products.
- **Docker Hub:** only one free private repository, pull rate limits, and one more account and token to manage.
- **Self-hosted registry in the cluster:** no cost, but one more component to secure and maintain, on the same machine it serves.

## Consequences

### Positive

- One command starts the whole system locally.
- The same image is built once in CI and deployed, tagged with the release version.
- Deployments are declarative, versioned in the repository, health-checked and rolled out without downtime.
- The platform can host the company's other products in the same way.
- Image publishing needs no extra credentials in CI.

### Negative

- **Single node, no high availability:** if the VPS goes down, the application and the database go down. Backups off the VPS mitigate data loss, not downtime.
- Kubernetes adds concepts and components (k3s, ingress, cert-manager, manifests) to learn and maintain.
- Running PostgreSQL inside the cluster makes the team responsible for its backups, restores and upgrades.
- Push-based delivery requires the Kubernetes API to be reachable from CI, which must be restricted carefully.
- Two ways of running the system (Compose locally, Kubernetes in deployment) must be kept consistent.

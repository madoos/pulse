#!/usr/bin/env bash
set -euo pipefail

export KUBECONFIG="$HOME/.kube/config"

manifests=$(mktemp)
trap 'rm -f "$manifests"' EXIT
cat > "$manifests"

kubectl apply -f "$manifests" --selector app=postgres
kubectl -n pulse rollout status statefulset/postgres --timeout=180s

kubectl -n pulse delete job migrate --ignore-not-found
kubectl apply -f "$manifests" --selector app=migrate
kubectl -n pulse wait --for=condition=complete job/migrate --timeout=180s

kubectl apply -f "$manifests"
kubectl -n pulse rollout status deployment --timeout=180s

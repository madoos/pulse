#!/usr/bin/env bash
set -euo pipefail

export KUBECONFIG="$HOME/.kube/config"

kubectl apply -f -
kubectl -n pulse rollout status deployment/api --timeout=180s

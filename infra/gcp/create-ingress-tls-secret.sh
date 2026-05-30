#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:?namespace required}"
INGRESS_HOST="${2:?ingress host required}"
SECRET_NAME="${3:-whisp-ingress-tls}"
DAYS_VALID="${4:-3650}"
FORCE=false

for arg in "$@"; do
  if [ "$arg" = "--force" ]; then
    FORCE=true
  fi
done

if [ "$FORCE" = false ] && kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
  echo "TLS secret $SECRET_NAME already exists in $NAMESPACE, skipping generation"
  exit 0
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

openssl req -x509 -nodes -days "$DAYS_VALID" -newkey rsa:2048 \
  -keyout "$TMP_DIR/tls.key" -out "$TMP_DIR/tls.crt" \
  -subj "/CN=${INGRESS_HOST}" \
  -addext "subjectAltName=DNS:${INGRESS_HOST}"

kubectl create secret tls "$SECRET_NAME" \
  --cert="$TMP_DIR/tls.crt" \
  --key="$TMP_DIR/tls.key" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl delete managedcertificate whisp-managed-cert -n "$NAMESPACE" --ignore-not-found

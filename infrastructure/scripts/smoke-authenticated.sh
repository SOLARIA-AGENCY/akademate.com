#!/usr/bin/env bash
# Authenticated smoke for deployment candidates. Credentials are injected only
# into the process that executes this check and are never committed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${1:?Usage: smoke-authenticated.sh <base-url>}"
: "${SMOKE_AUTH_EMAIL:?SMOKE_AUTH_EMAIL is required}"
: "${SMOKE_AUTH_PASSWORD:?SMOKE_AUTH_PASSWORD is required}"

smoke_script="${SCRIPT_DIR}/../../apps/tenant-admin/scripts/authenticated-smoke.mjs"

if [ -n "${SMOKE_AUTH_CONTAINER:-}" ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required when SMOKE_AUTH_CONTAINER is set" >&2
    exit 1
  fi

  exec docker exec \
    -e SMOKE_AUTH_EMAIL \
    -e SMOKE_AUTH_PASSWORD \
    "$SMOKE_AUTH_CONTAINER" \
    node /app/apps/tenant-admin/scripts/authenticated-smoke.mjs "$BASE_URL"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required unless SMOKE_AUTH_CONTAINER is configured" >&2
  exit 1
fi

exec node "$smoke_script" "$BASE_URL"

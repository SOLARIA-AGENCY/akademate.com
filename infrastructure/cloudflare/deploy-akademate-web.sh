#!/usr/bin/env bash
# Upload apps/web to the Cloudflare account that already proxies akademate.com.
# Requires CLOUDFLARE_API_TOKEN (Workers Scripts Edit + Account Read).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "CLOUDFLARE_API_TOKEN is required." >&2
  echo "Create a token at https://dash.cloudflare.com/profile/api-tokens" >&2
  echo "then: export CLOUDFLARE_API_TOKEN=... && $0" >&2
  exit 1
fi

pnpm --filter @akademate/web cf:deploy

echo "Waiting for akademate.com to serve the new home..."
for _ in 1 2 3 4 5 6; do
  html="$(curl -fsSL https://akademate.com/en || true)"
  if grep -q 'Run the whole academy\.' <<<"$html"; then
    echo "Live /en now shows: Run the whole academy."
    exit 0
  fi
  sleep 5
done

echo "Worker uploaded, but https://akademate.com/en does not yet show the new H1." >&2
echo "Attach akademate.com to the akademate-web Worker if the DNS origin is still Hetzner." >&2
exit 2

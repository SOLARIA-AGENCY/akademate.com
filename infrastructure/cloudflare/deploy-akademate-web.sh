#!/usr/bin/env bash
# Upload apps/web to the Cloudflare account that already proxies akademate.com.
# Auth: CLOUDFLARE_API_TOKEN (Workers Scripts Edit + Account Read, plus
# Zone Workers Routes Edit to attach the hostname) or `wrangler login`.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB="$ROOT/apps/web"
ACCOUNT_ID="522997f4f57193b06db3286d8d6f2778"
cd "$ROOT"

wrangler() {
  pnpm --filter @akademate/web exec wrangler "$@"
}

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if wrangler whoami 2>&1 | grep -q 'You are not authenticated'; then
    echo "CLOUDFLARE_API_TOKEN or an approved wrangler login is required." >&2
    echo "Create a token at https://dash.cloudflare.com/profile/api-tokens" >&2
    echo "or run: pnpm --filter @akademate/web exec wrangler login --browser=false --device" >&2
    exit 1
  fi
fi

if [[ ! -f "$WEB/.open-next/worker.js" || "${FORCE_CF_BUILD:-}" == "1" ]]; then
  pnpm --filter @akademate/web cf:build
fi

echo "Uploading akademate-web Worker..."
if (
  cd "$WEB"
  pnpm exec wrangler deploy --autoconfig=false \
    --routes 'akademate.com/*' \
    --routes 'www.akademate.com/*'
); then
  echo "Worker uploaded and akademate.com routes attached."
else
  echo "Route attach failed; uploading the Worker without hostname routes..." >&2
  (
    cd "$WEB"
    pnpm exec wrangler deploy --autoconfig=false
  )
  echo "Attach akademate.com/* to akademate-web in the dashboard if the live H1 stays old:" >&2
  echo "https://dash.cloudflare.com/${ACCOUNT_ID}/workers/services/view/akademate-web/production/settings" >&2
fi

echo "Waiting for akademate.com to serve the new home..."
for _ in 1 2 3 4 5 6 7 8; do
  html="$(curl -fsSL -A 'Mozilla/5.0' https://akademate.com/en || true)"
  if grep -q 'Run the whole academy\.' <<<"$html"; then
    echo "Live /en now shows: Run the whole academy."
    exit 0
  fi
  sleep 5
done

echo "Worker uploaded, but https://akademate.com/en does not yet show the new H1." >&2
echo "The DNS origin may still be Hetzner. Attach akademate.com/* to akademate-web." >&2
exit 2

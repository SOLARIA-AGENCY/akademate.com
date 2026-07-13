#!/usr/bin/env bash
# Authenticated smoke for deployment candidates.
# Credentials must be injected by the runtime environment; never commit them.

set -euo pipefail

BASE_URL="${1:?Usage: smoke-authenticated.sh <base-url>}"
: "${SMOKE_AUTH_EMAIL:?SMOKE_AUTH_EMAIL is required}"
: "${SMOKE_AUTH_PASSWORD:?SMOKE_AUTH_PASSWORD is required}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for authenticated smoke" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to validate JSON smoke responses" >&2
  exit 1
fi

cookie_file="$(mktemp)"
login_body="$(mktemp)"
session_body="$(mktemp)"
trap 'rm -f "$cookie_file" "$login_body" "$session_body"' EXIT

base_url="${BASE_URL%/}"

curl --fail --silent --show-error \
  --cookie-jar "$cookie_file" \
  -H 'Content-Type: application/json' \
  --data "$(node -e 'process.stdout.write(JSON.stringify({email: process.env.SMOKE_AUTH_EMAIL, password: process.env.SMOKE_AUTH_PASSWORD}))')" \
  "$base_url/api/users/login" >"$login_body"

node -e '
  const fs = require("node:fs")
  const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  if (!body.user || !body.token) throw new Error("login response is not authenticated")
' "$login_body"

curl --fail --silent --show-error \
  --cookie "$cookie_file" \
  "$base_url/api/auth/session" >"$session_body"

node -e '
  const fs = require("node:fs")
  const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  if (body.authenticated !== true || !body.user?.id) throw new Error("session is not authenticated")
' "$session_body"

curl --fail --silent --show-error \
  --cookie "$cookie_file" \
  "$base_url/api/convocatorias" >/dev/null

echo "Authenticated smoke passed for $base_url"

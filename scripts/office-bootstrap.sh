#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
OFFICE_DIR="$ROOT_DIR/infra/solaria-digital-field--operations"

if [ ! -d "$OFFICE_DIR" ]; then
  mkdir -p "$ROOT_DIR/infra"
  git clone https://github.com/SOLARIA-AGENCY/solaria-digital-field--operations.git "$OFFICE_DIR"
fi

pnpm -C "$OFFICE_DIR" install --frozen-lockfile || pnpm -C "$OFFICE_DIR" install
pnpm -C "$OFFICE_DIR" office:bootstrap

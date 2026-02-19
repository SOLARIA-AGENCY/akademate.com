#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/SOLARIA-AGENCY/Academate-ui"
TARGET_DIR="vendor/academate-ui"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Clonando $REPO_URL..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR/repo"

echo "Sincronizando en $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
rsync -a --delete --exclude='.git' "$TMP_DIR/repo/" "$TARGET_DIR/"

echo "OK: Academate-ui actualizado en $TARGET_DIR"

#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
DEPLOY_SCRIPT="${PROJECT_ROOT}/infrastructure/scripts/deploy.sh"; RELEASE_SCRIPT="${PROJECT_ROOT}/infrastructure/scripts/release-deploy.sh"; PREFLIGHT_SCRIPT="${PROJECT_ROOT}/infrastructure/scripts/release-preflight-migration.sh"; BACKUP_SCRIPT="${PROJECT_ROOT}/infrastructure/scripts/production-backup-verify.sh"; COMPOSE_FILE="${PROJECT_ROOT}/infrastructure/production/tenant-admin/docker-compose.yml"; TMP_DIR="$(mktemp -d)"; trap 'rm -rf "$TMP_DIR"' EXIT

bash -n "$DEPLOY_SCRIPT"; bash -n "$RELEASE_SCRIPT"; bash -n "$PREFLIGHT_SCRIPT"; bash -n "$BACKUP_SCRIPT"
"$RELEASE_SCRIPT" --help >/dev/null; "$PREFLIGHT_SCRIPT" --help >/dev/null; "$BACKUP_SCRIPT" --help >/dev/null

export RELEASE_SHA=abcdef1 IMAGE_DIGEST="sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" DATABASE_URL='postgresql://akademate:password@postgres:5432/akademate' POSTGRES_PASSWORD=password PAYLOAD_SECRET=payload-secret BETTER_AUTH_SECRET=auth-secret SESSION_SIGNING_SECRET_CURRENT=session-signing-secret MIGRATION_COMPATIBILITY=no_schema_change HEALTH_TECHNICAL_SMOKE_PRINCIPAL=technical-release-smoke:test
export TENANT_ADMIN_IMAGE_REFERENCE="akademate-tenant@${IMAGE_DIGEST}"
export HEALTH_TECHNICAL_SMOKE_TOKEN_FILE="${TMP_DIR}/technical-token"; printf 'token' > "$HEALTH_TECHNICAL_SMOKE_TOKEN_FILE"; chmod 600 "$HEALTH_TECHNICAL_SMOKE_TOKEN_FILE"
BACKUP_DIR="${TMP_DIR}/backup"; mkdir -p "$BACKUP_DIR"; export RELEASE_BACKUP_MANIFEST="${BACKUP_DIR}/manifest.json"
printf 'custom-dump-placeholder' > "${BACKUP_DIR}/database.dump"
mkdir -p "${TMP_DIR}/media-source"; printf 'media' > "${TMP_DIR}/media-source/file.txt"; tar -C "${TMP_DIR}/media-source" -czf "${BACKUP_DIR}/media.tar.gz" .
(cd "$BACKUP_DIR" && sha256sum database.dump > database.dump.sha256 && sha256sum media.tar.gz > media.tar.gz.sha256)
cat > "$RELEASE_BACKUP_MANIFEST" <<EOF
{"backup_id":"backup-test","status":"verified","created_at":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","database":"database.dump","media":"media.tar.gz","retention_days":14,"critical_table_counts":{"users":1},"db_restore_verification":"passed","media_restore_verification":"passed"}
EOF
(cd "$BACKUP_DIR" && sha256sum manifest.json > manifest.json.sha256)
export TENANT_ADMIN_ENV_FILE="${TMP_DIR}/malicious.env"; printf 'PAYLOAD_SECRET=$(touch %s/evaluated)\n' "$TMP_DIR" > "$TENANT_ADMIN_ENV_FILE"
"$RELEASE_SCRIPT" --validate-input; [[ ! -e "${TMP_DIR}/evaluated" ]]

set +e
MIGRATION_COMPATIBILITY=expand_contract_compatible PRE_DEPLOY_MIGRATION_SAFE=false "$RELEASE_SCRIPT" --validate-input >/dev/null 2>&1; unsafe_status=$?
printf 'tamper' >> "$RELEASE_BACKUP_MANIFEST"; "$RELEASE_SCRIPT" --validate-input >/dev/null 2>&1; stale_status=$?
MIGRATION_COMMAND_JSON='not-an-array' "$PREFLIGHT_SCRIPT" --validate-input >/dev/null 2>&1; argv_status=$?
set -e
[[ "$unsafe_status" -ne 0 && "$stale_status" -ne 0 && "$argv_status" -ne 0 ]]

write_backup_manifest() {
  local created_at="$1" retention="$2"
  cat > "$RELEASE_BACKUP_MANIFEST" <<EOF
{"backup_id":"backup-test","status":"verified","created_at":"${created_at}","database":"database.dump","media":"media.tar.gz","retention_days":${retention},"critical_table_counts":{"users":1},"db_restore_verification":"passed","media_restore_verification":"passed"}
EOF
  (cd "$BACKUP_DIR" && sha256sum manifest.json > manifest.json.sha256)
}

set +e
write_backup_manifest "$(node -e 'process.stdout.write(new Date(Date.now()+600000).toISOString())')" 14; "$RELEASE_SCRIPT" --validate-input >/dev/null 2>&1; future_status=$?
write_backup_manifest "$(date -u +%Y-%m-%dT%H:%M:%SZ)" 13; "$RELEASE_SCRIPT" --validate-input >/dev/null 2>&1; low_retention_status=$?
write_backup_manifest "$(date -u +%Y-%m-%dT%H:%M:%SZ)" 14; mv "${BACKUP_DIR}/media.tar.gz" "${BACKUP_DIR}/media.tar.gz.missing"; "$RELEASE_SCRIPT" --validate-input >/dev/null 2>&1; missing_artifact_status=$?; mv "${BACKUP_DIR}/media.tar.gz.missing" "${BACKUP_DIR}/media.tar.gz"
set -e
[[ "$future_status" -ne 0 && "$low_retention_status" -ne 0 && "$missing_artifact_status" -ne 0 ]]
write_backup_manifest "$(date -u +%Y-%m-%dT%H:%M:%SZ)" 14

RELEASE_DEPLOY_LIBRARY=true source "$RELEASE_SCRIPT"
MANIFEST_DIR="${TMP_DIR}/manifests"; CANDIDATE_SHA=abcdef1; CANDIDATE_DIGEST="$IMAGE_DIGEST"; CANDIDATE_TAG="akademate-tenant:${CANDIDATE_SHA}"; CANDIDATE_IMAGE="akademate-tenant@${IMAGE_DIGEST}"; PREVIOUS_SHA=1234567; PREVIOUS_DIGEST="sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"; PREVIOUS_IMAGE="akademate-tenant@${PREVIOUS_DIGEST}"; BACKUP_ID=backup-test; BACKUP_PATH="$RELEASE_BACKUP_MANIFEST"; BACKUP_CHECKSUM="$(sha256sum "$BACKUP_PATH" | awk '{print $1}')"; BACKUP_DATABASE_CHECKSUM="$(sha256sum "${BACKUP_DIR}/database.dump" | awk '{print $1}')"; BACKUP_MEDIA_CHECKSUM="$(sha256sum "${BACKUP_DIR}/media.tar.gz" | awk '{print $1}')"; MIGRATION_STATUS=no_schema_change; ROLLBACK_STATUS=completed_within_300s; write_manifest failed
node -e 'const m=require(process.argv[1]);if(m.candidate.sha!=="abcdef1"||m.previous.sha!=="1234567"||m.candidate.digest===m.previous.digest||m.backup.candidate_sha!=="abcdef1"||!m.backup.manifest_checksum||m.rollback.schema!=="not_attempted")process.exit(1)' "${MANIFEST_DIR}/abcdef1.json"

BACKUP_LIBRARY=true source "$BACKUP_SCRIPT"
printf 'users\t1\nmedia\t2\n' > "${TMP_DIR}/source-counts"; cp "${TMP_DIR}/source-counts" "${TMP_DIR}/restored-counts"; compare_critical_counts "${TMP_DIR}/source-counts" "${TMP_DIR}/restored-counts"
printf 'users\t9\nmedia\t2\n' > "${TMP_DIR}/restored-counts"
set +e
BACKUP_LIBRARY=true bash -c 'source "$1"; compare_critical_counts "$2" "$3"' _ "$BACKUP_SCRIPT" "${TMP_DIR}/source-counts" "${TMP_DIR}/restored-counts" >/dev/null 2>&1; count_status=$?
BACKUP_LIBRARY=true BACKUP_RETENTION_DAYS=13 BACKUP_CRITICAL_TABLES=users POSTGRES_PASSWORD=password bash -c 'source "$1"; validate_inputs' _ "$BACKUP_SCRIPT" >/dev/null 2>&1; retention_status=$?
set -e
[[ "$count_status" -ne 0 && "$retention_status" -ne 0 ]]

FAKE_BIN="${TMP_DIR}/bin"; mkdir -p "$FAKE_BIN"; cat > "${FAKE_BIN}/timeout" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" > "${TIMEOUT_CAPTURE:?}"
shift 2
"$@"
EOF
cat > "${FAKE_BIN}/docker" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "${FAKE_BIN}/timeout" "${FAKE_BIN}/docker"; export TIMEOUT_CAPTURE="${TMP_DIR}/timeout.args"
PATH="${FAKE_BIN}:$PATH" TIMEOUT_BIN=timeout COMPOSE_PROJECT_NAME=tenant-admin COMPOSE_FILE="${TMP_DIR}/compose.yml" ENV_FILE="${TMP_DIR}/missing.env" HEALTH_REQUEST_MAX_SECONDS=1 bash -c 'RELEASE_DEPLOY_LIBRARY=true source "$1"; COMPOSE_PROJECT_NAME=tenant-admin; deadline=$((SECONDS + 1)); service_http tenant-admin /api/health/live "$deadline"' _ "$RELEASE_SCRIPT"
rg -q -- '--foreground [0-9]+s docker compose .*wget --timeout=1' "$TIMEOUT_CAPTURE"

docker compose -f "$COMPOSE_FILE" config --quiet; docker compose --profile candidate -f "$COMPOSE_FILE" config --quiet
RELEASE_DEPLOY_LIBRARY=true source "$RELEASE_SCRIPT"
compose_config | validate_smoke_compose_contract
env -u RELEASE_SHA -u IMAGE_DIGEST -u TENANT_ADMIN_IMAGE_REFERENCE \
  DATABASE_URL='postgresql://akademate:password@postgres:5432/akademate' POSTGRES_PASSWORD=password PAYLOAD_SECRET=payload-secret BETTER_AUTH_SECRET=auth-secret HEALTH_TECHNICAL_SMOKE_TOKEN_FILE=/dev/null HEALTH_TECHNICAL_SMOKE_PRINCIPAL=technical-release-smoke:test \
  BACKUP_LIBRARY=true bash -c 'source "$1"; compose_config >/dev/null' _ "$BACKUP_SCRIPT"
BAD_SMOKE_CONFIG='{"services":{"tenant-admin":{"environment":{"TECHNICAL_SMOKE_TOKEN_FILE":"/wrong","HEALTH_TECHNICAL_SMOKE_PRINCIPAL":"technical-release-smoke:test"},"secrets":[]},"tenant-admin-candidate":{"environment":{},"secrets":[]}}}'
set +e
printf '%s' "$BAD_SMOKE_CONFIG" | validate_smoke_compose_contract >/dev/null 2>&1; smoke_name_status=$?
set -e
[[ "$smoke_name_status" -ne 0 ]]
! rg -q '/api/auth/dev-login|run_migrations|source "\$ENV_FILE"|sh -lc|MIGRATION_SERVICE|DEPLOY_SMOKE_AUTH' "$DEPLOY_SCRIPT" "$RELEASE_SCRIPT" "$BACKUP_SCRIPT" "$PREFLIGHT_SCRIPT"
! rg -q '(^|[^A-Z_])TECHNICAL_SMOKE_(TOKEN_FILE|PRINCIPAL)' "$RELEASE_SCRIPT" "$COMPOSE_FILE"
rg -q 'RELEASE_BACKUP_MANIFEST|SWITCH_BUDGET_SECONDS=120|HEALTH_TECHNICAL_SMOKE_TOKEN_FILE|critical_table_counts|BACKUP_CRITICAL_TABLES|schema_rollback.*not_attempted|trap cleanup_all EXIT' "$RELEASE_SCRIPT" "$BACKUP_SCRIPT" "$PREFLIGHT_SCRIPT"
printf 'remediation-release-a shell checks passed\n'

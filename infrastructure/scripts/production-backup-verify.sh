#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${TENANT_ADMIN_COMPOSE_FILE:-${PROJECT_ROOT}/infrastructure/production/tenant-admin/docker-compose.yml}"; ENV_FILE="${TENANT_ADMIN_ENV_FILE:-$(dirname "${COMPOSE_FILE}")/.env}"
BACKUP_ROOT="${BACKUP_ROOT:-${PROJECT_ROOT}/backups/production}"; RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"; TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"; RESTORE_TIMESTAMP="$(date -u +%Y%m%d%H%M%S)"
BACKUP_ID="akademate-backup-${TIMESTAMP}"; BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_ID}"; DB_DUMP="${BACKUP_DIR}/database.dump"; MEDIA_ARCHIVE="${BACKUP_DIR}/media.tar.gz"; MEDIA_MANIFEST="${BACKUP_DIR}/media-files.sha256"; RESTORED_MEDIA_MANIFEST="${BACKUP_DIR}/restored-media-files.sha256"; COUNTS_FILE="${BACKUP_DIR}/critical-table-counts.tsv"; RESTORED_COUNTS_FILE="${BACKUP_DIR}/restored-critical-table-counts.tsv"; RESTORE_DB="akademate_restore_verify_${RESTORE_TIMESTAMP}"; COMPOSE_PROJECT_NAME=""; MEDIA_VOLUME=""; RESTORE_MEDIA_VOLUME=""; CRITICAL_TABLES=()

usage() { cat <<'EOF'
Usage: POSTGRES_PASSWORD=... BACKUP_CRITICAL_TABLES=users,media ./infrastructure/scripts/production-backup-verify.sh

BACKUP_CRITICAL_TABLES is mandatory. Every named table must exist in both source
and temporary restored DB and have exactly the same row count. Compose resource
discovery uses safe placeholders for release-only interpolation; no release
variables are required to run a backup.
EOF
}
log() { printf '[production-backup] %s\n' "$*"; }; fail() { printf '[production-backup] ERROR: %s\n' "$*" >&2; exit 1; }
[[ "${1:-}" == --help || "${1:-}" == -h ]] && { usage; exit 0; }

validate_inputs() {
  [[ -f "$COMPOSE_FILE" ]] || fail "Compose file not found"; [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && (( RETENTION_DAYS >= 14 )) || fail "BACKUP_RETENTION_DAYS must be at least 14"
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required as process environment}"; : "${BACKUP_CRITICAL_TABLES:?BACKUP_CRITICAL_TABLES is required}"
  POSTGRES_USER="${POSTGRES_USER:-akademate}"; POSTGRES_DB="${POSTGRES_DB:-akademate}"; local table; IFS=',' read -r -a CRITICAL_TABLES <<< "$BACKUP_CRITICAL_TABLES"
  (( ${#CRITICAL_TABLES[@]} > 0 )) || fail "At least one critical table is required"
  for table in "${CRITICAL_TABLES[@]}"; do [[ "$table" =~ ^[a-z_][a-z0-9_]*$ ]] || fail "Invalid critical table name: ${table}"; done
}
compose_config() { local a=(docker compose); [[ -f "$ENV_FILE" ]] && a+=(--env-file "$ENV_FILE"); a+=(-f "$COMPOSE_FILE"); env RELEASE_SHA=0000000 IMAGE_DIGEST="sha256:$(printf '0%.0s' {1..64})" TENANT_ADMIN_IMAGE_REFERENCE="akademate-tenant@sha256:$(printf '0%.0s' {1..64})" HEALTH_TECHNICAL_SMOKE_TOKEN_FILE=/dev/null HEALTH_TECHNICAL_SMOKE_PRINCIPAL=technical-release-smoke:backup-config "${a[@]}" config --format json; }
discover_resources() { local c; c="$(compose_config)"; COMPOSE_PROJECT_NAME="$(printf '%s' "$c" | node -e 'let x="";process.stdin.on("data",c=>x+=c).on("end",()=>{const c=JSON.parse(x);if(!c.name||!c.volumes?.media_data?.name)process.exit(1);process.stdout.write(`${c.name}\n${c.volumes.media_data.name}`)})' | sed -n '1p')"; MEDIA_VOLUME="$(printf '%s' "$c" | node -e 'let x="";process.stdin.on("data",c=>x+=c).on("end",()=>{const c=JSON.parse(x);if(!c.volumes?.media_data?.name)process.exit(1);process.stdout.write(c.volumes.media_data.name)})')"; [[ -n "$COMPOSE_PROJECT_NAME" && -n "$MEDIA_VOLUME" ]] || fail "Could not resolve Compose resources"; [[ -z "${TENANT_ADMIN_COMPOSE_PROJECT_NAME:-}" || "$TENANT_ADMIN_COMPOSE_PROJECT_NAME" == "$COMPOSE_PROJECT_NAME" ]] || fail "Compose project mismatch"; [[ -z "${MEDIA_VOLUME_OVERRIDE:-}" || "$MEDIA_VOLUME_OVERRIDE" == "$MEDIA_VOLUME" ]] || fail "Media volume mismatch"; RESTORE_MEDIA_VOLUME="${COMPOSE_PROJECT_NAME}_media_restore_verify_${RESTORE_TIMESTAMP}"; }
compose() { local a=(docker compose --project-name "$COMPOSE_PROJECT_NAME"); [[ -f "$ENV_FILE" ]] && a+=(--env-file "$ENV_FILE"); a+=(-f "$COMPOSE_FILE"); "${a[@]}" "$@"; }
cleanup_all() { local s=$?; compose exec -T postgres dropdb --if-exists -U "$POSTGRES_USER" "$RESTORE_DB" >/dev/null 2>&1 || true; [[ -n "$RESTORE_MEDIA_VOLUME" ]] && docker volume rm -f "$RESTORE_MEDIA_VOLUME" >/dev/null 2>&1 || true; (( s == 0 )) || { [[ -d "$BACKUP_DIR" && ! -f "${BACKUP_DIR}/manifest.json" ]] && rm -rf "$BACKUP_DIR"; }; return "$s"; }
media_manifest() { docker run --rm --mount "type=volume,src=$1,dst=/media,readonly" alpine:3.20 sh -ec 'cd /media; find . -type f -exec sha256sum {} \; | LC_ALL=C sort' > "$2"; }
table_counts() { local database="$1" output="$2" table count; : > "$output"; for table in "${CRITICAL_TABLES[@]}"; do count="$(compose exec -T postgres psql -U "$POSTGRES_USER" -d "$database" -v ON_ERROR_STOP=1 -Atq -c "SELECT count(*) FROM \"${table}\"")" || fail "Critical table ${table} is absent or unreadable in ${database}"; [[ "$count" =~ ^[0-9]+$ ]] || fail "Invalid count for ${table}"; printf '%s\t%s\n' "$table" "$count" >> "$output"; done; }
compare_critical_counts() { cmp -s "$1" "$2" || fail "Restored critical-table counts differ"; }
counts_json() { node -e 'const fs=require("node:fs");const out={};for(const l of fs.readFileSync(process.argv[1],"utf8").trim().split("\n")){if(!l)continue;const [k,v]=l.split("\t");out[k]=Number(v)}process.stdout.write(JSON.stringify(out))' "$1"; }

main() {
  validate_inputs; trap cleanup_all EXIT; discover_resources; mkdir -p "$BACKUP_DIR"; docker volume inspect "$MEDIA_VOLUME" >/dev/null
  compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges > "$DB_DUMP"
  docker run --rm --mount "type=volume,src=${MEDIA_VOLUME},dst=/media,readonly" --mount "type=bind,src=${BACKUP_DIR},dst=/backup" alpine:3.20 tar -C /media -czf /backup/media.tar.gz .
  [[ -s "$DB_DUMP" && -s "$MEDIA_ARCHIVE" ]] || fail "Backup output is empty"; (cd "$BACKUP_DIR" && sha256sum database.dump > database.dump.sha256 && sha256sum media.tar.gz > media.tar.gz.sha256); (cd "$BACKUP_DIR" && sha256sum --check database.dump.sha256 >/dev/null && sha256sum --check media.tar.gz.sha256 >/dev/null); compose exec -T postgres pg_restore --list < "$DB_DUMP" >/dev/null; tar -tzf "$MEDIA_ARCHIVE" >/dev/null; media_manifest "$MEDIA_VOLUME" "$MEDIA_MANIFEST"; table_counts "$POSTGRES_DB" "$COUNTS_FILE"
  compose exec -T postgres createdb -U "$POSTGRES_USER" "$RESTORE_DB"; compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$RESTORE_DB" --no-owner --no-privileges < "$DB_DUMP"; compose exec -T postgres psql -U "$POSTGRES_USER" -d "$RESTORE_DB" -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null; table_counts "$RESTORE_DB" "$RESTORED_COUNTS_FILE"; compare_critical_counts "$COUNTS_FILE" "$RESTORED_COUNTS_FILE"
  docker volume create "$RESTORE_MEDIA_VOLUME" >/dev/null; docker run --rm --mount "type=volume,src=${RESTORE_MEDIA_VOLUME},dst=/restore" --mount "type=bind,src=${BACKUP_DIR},dst=/backup,readonly" alpine:3.20 tar -C /restore -xzf /backup/media.tar.gz; media_manifest "$RESTORE_MEDIA_VOLUME" "$RESTORED_MEDIA_MANIFEST"; cmp -s "$MEDIA_MANIFEST" "$RESTORED_MEDIA_MANIFEST" || fail "Restored media checksum manifest differs"; local media_count="$(wc -l < "$MEDIA_MANIFEST" | tr -d ' ')"; [[ "$media_count" == "$(wc -l < "$RESTORED_MEDIA_MANIFEST" | tr -d ' ')" ]] || fail "Restored media file count differs"
  cat > "${BACKUP_DIR}/manifest.json" <<EOF
{"backup_id":"${BACKUP_ID}","status":"verified","created_at":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","database":"database.dump","media":"media.tar.gz","compose_project":"${COMPOSE_PROJECT_NAME}","media_volume":"${MEDIA_VOLUME}","critical_table_counts":$(counts_json "$COUNTS_FILE"),"media_file_count":${media_count},"retention_days":${RETENTION_DAYS},"db_restore_verification":"passed","media_restore_verification":"passed"}
EOF
  (cd "$BACKUP_DIR" && sha256sum manifest.json > manifest.json.sha256); find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name 'akademate-backup-*' -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +; log "Verified backup retained at ${BACKUP_DIR}"
}
[[ "${BACKUP_LIBRARY:-false}" == true ]] || main "$@"

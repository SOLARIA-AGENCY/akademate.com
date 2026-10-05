#!/usr/bin/env bash
# Digest-pinned tenant-admin release. Schema work is only in explicit preflight.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${TENANT_ADMIN_COMPOSE_FILE:-${PROJECT_ROOT}/infrastructure/production/tenant-admin/docker-compose.yml}"
ENV_FILE="${TENANT_ADMIN_ENV_FILE:-$(dirname "${COMPOSE_FILE}")/.env}"
MANIFEST_DIR="${RELEASE_MANIFEST_DIR:-${PROJECT_ROOT}/releases}"
ROLLBACK_BUDGET_SECONDS=300
SWITCH_BUDGET_SECONDS=120
HEALTH_REQUEST_MAX_SECONDS="${HEALTH_REQUEST_MAX_SECONDS:-15}"
MAX_BACKUP_AGE_SECONDS="${MAX_BACKUP_AGE_SECONDS:-86400}"
BACKUP_CLOCK_SKEW_SECONDS="${BACKUP_CLOCK_SKEW_SECONDS:-300}"
TIMEOUT_BIN="${TIMEOUT_BIN:-timeout}"
TECHNICAL_SMOKE_PATH='/api/health/technical'
CURRENT_SWITCHED=false
COMPOSE_PROJECT_NAME=""
CANDIDATE_SHA="" CANDIDATE_DIGEST="" CANDIDATE_TAG="" CANDIDATE_IMAGE=""
PREVIOUS_SHA="" PREVIOUS_DIGEST="" PREVIOUS_IMAGE=""
BACKUP_ID="" BACKUP_PATH="" BACKUP_CHECKSUM=""
BACKUP_DATABASE_PATH="" BACKUP_MEDIA_PATH="" BACKUP_DATABASE_CHECKSUM="" BACKUP_MEDIA_CHECKSUM=""
MIGRATION_STATUS="not_applicable" ROLLBACK_STATUS="not_required"

usage() {
  cat <<'EOF'
Usage: RELEASE_SHA=<git-sha> IMAGE_DIGEST=sha256:<digest> \
  MIGRATION_COMPATIBILITY=no_schema_change \
  RELEASE_BACKUP_MANIFEST=/secure/backups/.../manifest.json \
  HEALTH_TECHNICAL_SMOKE_TOKEN_FILE=/secure/release-smoke-token \
  HEALTH_TECHNICAL_SMOKE_PRINCIPAL=technical-release-smoke:<id> \
  ./infrastructure/scripts/release-deploy.sh

Deploys only repo@sha256 references. The SHA tag is verified as metadata that
resolves to the same digest. The supplied backup manifest must be recent,
checksummed, and record successful DB/media restore plus critical-table counts.
Compose mounts HEALTH_TECHNICAL_SMOKE_TOKEN_FILE as a read-only secret and
injects the same HEALTH_TECHNICAL_SMOKE_PRINCIPAL into candidate/current.
EOF
}

log() { printf '[release-deploy] %s\n' "$*"; }
fail() { printf '[release-deploy] ERROR: %s\n' "$*" >&2; return 1; }

require_process_env() {
  local name
  for name in DATABASE_URL POSTGRES_PASSWORD PAYLOAD_SECRET BETTER_AUTH_SECRET HEALTH_TECHNICAL_SMOKE_TOKEN_FILE HEALTH_TECHNICAL_SMOKE_PRINCIPAL; do
    [[ -n "${!name:-}" ]] || fail "Required process environment variable is empty: ${name}"
  done
}

file_mode() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }

validate_technical_smoke_input() {
  [[ -f "$HEALTH_TECHNICAL_SMOKE_TOKEN_FILE" && -s "$HEALTH_TECHNICAL_SMOKE_TOKEN_FILE" ]] || fail "HEALTH_TECHNICAL_SMOKE_TOKEN_FILE must be a non-empty regular file"
  local mode
  mode="$(file_mode "$HEALTH_TECHNICAL_SMOKE_TOKEN_FILE")"
  [[ "$mode" =~ ^[0-7]{3,4}$ ]] || fail "Could not determine technical smoke token file mode"
  (( (8#$mode & 077) == 0 )) || fail "HEALTH_TECHNICAL_SMOKE_TOKEN_FILE must not be group/world readable"
  [[ "$HEALTH_TECHNICAL_SMOKE_PRINCIPAL" =~ ^technical-release-smoke:[A-Za-z0-9._-]{3,}$ ]] || fail "HEALTH_TECHNICAL_SMOKE_PRINCIPAL is not an allowlisted technical principal"
}

validate_backup_manifest() {
  : "${RELEASE_BACKUP_MANIFEST:?RELEASE_BACKUP_MANIFEST is required}"
  [[ -f "$RELEASE_BACKUP_MANIFEST" && -f "${RELEASE_BACKUP_MANIFEST}.sha256" ]] || fail "Verified backup manifest and checksum sidecar are required"
  (cd "$(dirname "$RELEASE_BACKUP_MANIFEST")" && sha256sum --check "$(basename "${RELEASE_BACKUP_MANIFEST}").sha256") >/dev/null \
    || fail "Backup manifest checksum verification failed"
  BACKUP_PATH="$(cd "$(dirname "$RELEASE_BACKUP_MANIFEST")" && pwd)/$(basename "$RELEASE_BACKUP_MANIFEST")"
  BACKUP_CHECKSUM="$(sha256sum "$BACKUP_PATH" | awk '{print $1}')"
  local metadata
  metadata="$(node -e '
    const fs = require("node:fs")
    const path = require("node:path")
    const [file, maxAge, skew] = process.argv.slice(1)
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"))
    const created = Date.parse(manifest.created_at || "")
    const validArtifact = (value, expected) => value === expected && !path.isAbsolute(value) && path.normalize(value) === value
    const counts = manifest.critical_table_counts
    if (!manifest.backup_id || !Number.isFinite(created) || created - Date.now() > Number(skew) * 1000
      || Date.now() - created > Number(maxAge) * 1000 || manifest.retention_days < 14
      || manifest.status !== "verified" || manifest.db_restore_verification !== "passed"
      || manifest.media_restore_verification !== "passed" || !counts || Object.keys(counts).length === 0
      || Object.values(counts).some(v => !Number.isSafeInteger(v) || v < 0)
      || !validArtifact(manifest.database, "database.dump") || !validArtifact(manifest.media, "media.tar.gz")) process.exit(1)
    process.stdout.write([manifest.backup_id, manifest.database, manifest.media].join("\n"))
  ' "$BACKUP_PATH" "$MAX_BACKUP_AGE_SECONDS" "$BACKUP_CLOCK_SKEW_SECONDS")" || fail "Backup manifest failed age/retention/restore/artifact validation"
  BACKUP_ID="$(printf '%s\n' "$metadata" | sed -n '1p')"
  BACKUP_DATABASE_PATH="$(dirname "$BACKUP_PATH")/$(printf '%s\n' "$metadata" | sed -n '2p')"
  BACKUP_MEDIA_PATH="$(dirname "$BACKUP_PATH")/$(printf '%s\n' "$metadata" | sed -n '3p')"
  local artifact
  for artifact in "$BACKUP_DATABASE_PATH" "$BACKUP_MEDIA_PATH"; do
    [[ -f "$artifact" && -s "$artifact" && -f "${artifact}.sha256" ]] || fail "Backup artifact or checksum sidecar is missing: ${artifact}"
    (cd "$(dirname "$artifact")" && sha256sum --check "$(basename "${artifact}").sha256") >/dev/null || fail "Backup artifact checksum failed: ${artifact}"
  done
  BACKUP_DATABASE_CHECKSUM="$(sha256sum "$BACKUP_DATABASE_PATH" | awk '{print $1}')"
  BACKUP_MEDIA_CHECKSUM="$(sha256sum "$BACKUP_MEDIA_PATH" | awk '{print $1}')"
  tar -tzf "$BACKUP_MEDIA_PATH" >/dev/null || fail "Media backup content is invalid"
}

validate_backup_database_content() {
  compose exec -T postgres pg_restore --list < "$BACKUP_DATABASE_PATH" >/dev/null || fail "Database backup content is invalid"
}

validate_release_inputs() {
  : "${RELEASE_SHA:?RELEASE_SHA is required}"
  : "${IMAGE_DIGEST:?IMAGE_DIGEST is required}"
  : "${MIGRATION_COMPATIBILITY:?MIGRATION_COMPATIBILITY is required}"
  [[ "$RELEASE_SHA" =~ ^[0-9a-f]{7,64}$ ]] || fail "RELEASE_SHA must be a 7-64 character lowercase Git SHA"
  [[ "$IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || fail "IMAGE_DIGEST must be a sha256 digest"
  [[ "$MAX_BACKUP_AGE_SECONDS" =~ ^[0-9]+$ && "$BACKUP_CLOCK_SKEW_SECONDS" =~ ^[0-9]+$ ]] || fail "Backup age/skew limits must be integers"
  require_process_env
  validate_technical_smoke_input
  validate_backup_manifest
  case "$MIGRATION_COMPATIBILITY" in
    no_schema_change) MIGRATION_STATUS="no_schema_change" ;;
    expand_contract_compatible)
      [[ "${PRE_DEPLOY_MIGRATION_SAFE:-}" == "true" ]] || fail "expand/contract releases require PRE_DEPLOY_MIGRATION_SAFE=true"
      : "${PRE_DEPLOY_MIGRATION_MANIFEST:?PRE_DEPLOY_MIGRATION_MANIFEST is required}"
      node -e '
        const fs = require("node:fs"); const [file, sha, digest] = process.argv.slice(1)
        const m = JSON.parse(fs.readFileSync(file, "utf8"))
        if (m.candidate?.sha !== sha || m.candidate?.digest !== digest || m.result !== "succeeded"
          || m.compatibility !== "expand_contract_compatible" || m.traffic_switch !== "not_attempted") process.exit(1)
      ' "$PRE_DEPLOY_MIGRATION_MANIFEST" "$RELEASE_SHA" "$IMAGE_DIGEST" || fail "Preflight manifest does not bind this candidate/result"
      MIGRATION_STATUS="preflight_verified"
      ;;
    *) fail "MIGRATION_COMPATIBILITY must be no_schema_change or expand_contract_compatible" ;;
  esac
}

compose_config() {
  local args=(docker compose)
  [[ -f "$ENV_FILE" ]] && args+=(--env-file "$ENV_FILE")
  args+=(--profile candidate -f "$COMPOSE_FILE")
  env RELEASE_SHA="${RELEASE_SHA:-0000000}" IMAGE_DIGEST="${IMAGE_DIGEST:-sha256:$(printf '0%.0s' {1..64})}" \
    TENANT_ADMIN_IMAGE_REFERENCE="${TENANT_ADMIN_IMAGE_REFERENCE:-akademate-tenant@sha256:$(printf '0%.0s' {1..64})}" \
    HEALTH_TECHNICAL_SMOKE_TOKEN_FILE="${HEALTH_TECHNICAL_SMOKE_TOKEN_FILE:-/dev/null}" \
    HEALTH_TECHNICAL_SMOKE_PRINCIPAL="${HEALTH_TECHNICAL_SMOKE_PRINCIPAL:-technical-release-smoke:config}" "${args[@]}" config --format json
}

validate_smoke_compose_contract() {
  node -e '
    const [expected] = process.argv.slice(1); let data = ""
    process.stdin.on("data", c => data += c).on("end", () => {
      const config = JSON.parse(data)
      for (const name of ["tenant-admin", "tenant-admin-candidate"]) {
        const service = config.services?.[name]
        if (service?.environment?.HEALTH_TECHNICAL_SMOKE_TOKEN_FILE !== "/run/secrets/health_technical_smoke_token"
          || service?.environment?.HEALTH_TECHNICAL_SMOKE_PRINCIPAL !== expected
          || !service.secrets?.some(s => s.source === "health_technical_smoke_token")) process.exit(1)
      }
    })
  ' "$HEALTH_TECHNICAL_SMOKE_PRINCIPAL"
}

discover_compose_project() {
  local config_json
  config_json="$(compose_config)"
  printf '%s' "$config_json" | validate_smoke_compose_contract || fail "Compose technical smoke env/secret contract mismatch"
  COMPOSE_PROJECT_NAME="$(printf '%s' "$config_json" | node -e 'let x="";process.stdin.on("data",c=>x+=c).on("end",()=>{const c=JSON.parse(x);if(!c.name)process.exit(1);process.stdout.write(c.name)})')"
  [[ -n "$COMPOSE_PROJECT_NAME" ]] || fail "Could not discover Docker Compose project name"
  [[ -z "${TENANT_ADMIN_COMPOSE_PROJECT_NAME:-}" || "$TENANT_ADMIN_COMPOSE_PROJECT_NAME" == "$COMPOSE_PROJECT_NAME" ]] || fail "Configured Compose project does not match resolved project"
}

compose() {
  local args=(docker compose --project-name "$COMPOSE_PROJECT_NAME")
  [[ -f "$ENV_FILE" ]] && args+=(--env-file "$ENV_FILE")
  args+=(-f "$COMPOSE_FILE")
  "${args[@]}" "$@"
}

verify_candidate_image() {
  local repository="${TENANT_ADMIN_IMAGE_REPOSITORY:-akademate-tenant}"
  CANDIDATE_SHA="$RELEASE_SHA"; CANDIDATE_DIGEST="$IMAGE_DIGEST"; CANDIDATE_TAG="${repository}:${RELEASE_SHA}"; CANDIDATE_IMAGE="${repository}@${IMAGE_DIGEST}"
  docker image inspect "$CANDIDATE_TAG" >/dev/null 2>&1 || fail "SHA-tagged release image is unavailable locally"
  docker image inspect "$CANDIDATE_IMAGE" >/dev/null 2>&1 || fail "Digest-pinned candidate image is unavailable locally"
  docker image inspect --format '{{join .RepoDigests "\n"}}' "$CANDIDATE_TAG" | grep -Fx "$CANDIDATE_IMAGE" >/dev/null || fail "SHA tag does not resolve to candidate digest"
  docker image inspect --format '{{join .RepoDigests "\n"}}' "$CANDIDATE_IMAGE" | grep -Fx "$CANDIDATE_IMAGE" >/dev/null || fail "Candidate digest is not locally immutable"
}

capture_previous_release() {
  PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' akademate-tenant)"
  PREVIOUS_SHA="$(docker inspect --format '{{index .Config.Labels "com.akademate.release-sha"}}' akademate-tenant)"
  PREVIOUS_DIGEST="$(docker inspect --format '{{index .Config.Labels "com.akademate.image-digest"}}' akademate-tenant)"
  [[ "$PREVIOUS_IMAGE" == *@"$PREVIOUS_DIGEST" ]] || fail "Previous image reference does not equal its digest label"
  [[ "$PREVIOUS_SHA" =~ ^[0-9a-f]{7,64}$ && "$PREVIOUS_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || fail "Previous release labels are invalid"
  docker image inspect "$PREVIOUS_IMAGE" >/dev/null 2>&1 || fail "Previous image is not locally available for rollback"
  docker image inspect --format '{{join .RepoDigests "\n"}}' "$PREVIOUS_IMAGE" | grep -Fx "$PREVIOUS_IMAGE" >/dev/null || fail "Previous image digest is not locally immutable"
}

remaining_seconds() { local n=$(( $1 - SECONDS )); (( n > 0 )) && printf '%s\n' "$n" || printf '0\n'; }
deadline_command() {
  local deadline="$1"; shift; local remaining="$(remaining_seconds "$deadline")"; (( remaining > 0 )) || return 1
  "$TIMEOUT_BIN" --foreground "${remaining}s" "$@"
}
compose_with_deadline() { local deadline="$1"; shift; local args=(docker compose --project-name "$COMPOSE_PROJECT_NAME"); [[ -f "$ENV_FILE" ]] && args+=(--env-file "$ENV_FILE"); args+=(-f "$COMPOSE_FILE" "$@"); deadline_command "$deadline" "${args[@]}"; }
service_http() { local service="$1" path="$2" deadline="$3" remaining request; local args; remaining="$(remaining_seconds "$deadline")"; (( remaining > 0 )) || return 1; request="$HEALTH_REQUEST_MAX_SECONDS"; (( request > remaining )) && request="$remaining"; args=(docker compose --project-name "$COMPOSE_PROJECT_NAME"); [[ -f "$ENV_FILE" ]] && args+=(--env-file "$ENV_FILE"); args+=(-f "$COMPOSE_FILE" exec -T "$service" wget "--timeout=${request}" --no-verbose --tries=1 --spider "http://127.0.0.1:3009${path}"); deadline_command "$deadline" "${args[@]}" >/dev/null 2>&1; }
wait_for_service_path() { local service="$1" path="$2" deadline="$3"; while (( $(remaining_seconds "$deadline") > 0 )); do service_http "$service" "$path" "$deadline" && return 0; sleep 1; done; return 1; }

technical_smoke() {
  local service="$1" deadline="$2" container request
  container="$(compose ps -q "$service")"; [[ -n "$container" ]] || return 1
  request="$HEALTH_REQUEST_MAX_SECONDS"; local remaining="$(remaining_seconds "$deadline")"; (( request > remaining )) && request="$remaining"
  deadline_command "$deadline" docker exec -e "TECHNICAL_SMOKE_TIMEOUT_MS=$((request * 1000))" "$container" node -e '
    const fs=require("node:fs"), c=new AbortController(), t=setTimeout(()=>c.abort(), Number(process.env.TECHNICAL_SMOKE_TIMEOUT_MS));
    const token=fs.readFileSync(process.env.HEALTH_TECHNICAL_SMOKE_TOKEN_FILE,"utf8").trim();
    fetch("http://127.0.0.1:3009/api/health/technical",{signal:c.signal,headers:{authorization:`Bearer ${token}`,"x-akademate-technical-principal":process.env.HEALTH_TECHNICAL_SMOKE_PRINCIPAL}})
      .then(async r=>{const b=await r.json().catch(()=>({}));if(!r.ok||b.status!=="technical_ready")process.exitCode=1}).catch(()=>process.exitCode=1).finally(()=>clearTimeout(t));
  '
}

write_manifest() {
  local outcome="$1"; mkdir -p "$MANIFEST_DIR"; umask 077
  cat > "${MANIFEST_DIR}/${CANDIDATE_SHA}.json" <<EOF
{"candidate":{"sha":"${CANDIDATE_SHA}","tag":"${CANDIDATE_TAG}","image":"${CANDIDATE_IMAGE}","digest":"${CANDIDATE_DIGEST}"},"previous":{"sha":"${PREVIOUS_SHA}","image":"${PREVIOUS_IMAGE}","digest":"${PREVIOUS_DIGEST}"},"backup":{"id":"${BACKUP_ID}","path":"${BACKUP_PATH}","manifest_checksum":"${BACKUP_CHECKSUM}","database_checksum":"${BACKUP_DATABASE_CHECKSUM}","media_checksum":"${BACKUP_MEDIA_CHECKSUM}","candidate_sha":"${CANDIDATE_SHA}"},"migrations":{"compatibility":"${MIGRATION_COMPATIBILITY}","status":"${MIGRATION_STATUS}","execution":"separate_preflight_only"},"rollback":{"application":"${ROLLBACK_STATUS}","schema":"not_attempted"},"outcome":"${outcome}","created_at":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
}

start_candidate() { export TENANT_ADMIN_IMAGE_REFERENCE="$CANDIDATE_IMAGE" RELEASE_SHA="$CANDIDATE_SHA" IMAGE_DIGEST="$CANDIDATE_DIGEST"; compose --profile candidate up -d --no-build --no-deps --force-recreate tenant-admin-candidate; local d=$((SECONDS + 240)); wait_for_service_path tenant-admin-candidate /api/health/live "$d" && wait_for_service_path tenant-admin-candidate /api/health/ready "$d" && technical_smoke tenant-admin-candidate "$d"; }
rollback() { local d=$((SECONDS + ROLLBACK_BUDGET_SECONDS)); export TENANT_ADMIN_IMAGE_REFERENCE="$PREVIOUS_IMAGE" RELEASE_SHA="$PREVIOUS_SHA" IMAGE_DIGEST="$PREVIOUS_DIGEST"; if compose_with_deadline "$d" up -d --no-build --force-recreate tenant-admin && wait_for_service_path tenant-admin /api/health/live "$d" && wait_for_service_path tenant-admin /api/health/ready "$d" && technical_smoke tenant-admin "$d"; then ROLLBACK_STATUS="completed_within_${ROLLBACK_BUDGET_SECONDS}s"; else ROLLBACK_STATUS="failed_or_exceeded_${ROLLBACK_BUDGET_SECONDS}s"; fi; }
cleanup_candidate() { compose --profile candidate rm --stop --force tenant-admin-candidate >/dev/null 2>&1 || true; }
on_error() { local code=$?; trap - ERR; [[ "$CURRENT_SWITCHED" == true ]] && rollback; cleanup_candidate; write_manifest failed; exit "$code"; }

main() {
  case "${1:-}" in --help|-h) usage; return 0;; --validate-input) validate_release_inputs; return 0;; '') ;; *) fail "Unknown argument: $1"; return 1;; esac
  validate_release_inputs; [[ -f "$COMPOSE_FILE" ]] || fail "Compose file not found"; command -v "$TIMEOUT_BIN" >/dev/null || fail "GNU timeout is required"
  discover_compose_project; validate_backup_database_content; verify_candidate_image; capture_previous_release; write_manifest candidate_pending; trap on_error ERR; trap cleanup_candidate EXIT
  start_candidate; CURRENT_SWITCHED=true
  local switch_deadline=$((SECONDS + SWITCH_BUDGET_SECONDS))
  compose_with_deadline "$switch_deadline" up -d --no-build --force-recreate tenant-admin
  wait_for_service_path tenant-admin /api/health/live "$switch_deadline"; wait_for_service_path tenant-admin /api/health/ready "$switch_deadline"; technical_smoke tenant-admin "$switch_deadline"
  cleanup_candidate; write_manifest deployed
}

[[ "${RELEASE_DEPLOY_LIBRARY:-false}" == true ]] || main "$@"

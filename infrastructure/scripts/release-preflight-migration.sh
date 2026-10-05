#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"; COMPOSE_FILE="${TENANT_ADMIN_COMPOSE_FILE:-${PROJECT_ROOT}/infrastructure/production/tenant-admin/docker-compose.yml}"; ENV_FILE="${TENANT_ADMIN_ENV_FILE:-$(dirname "${COMPOSE_FILE}")/.env}"; MANIFEST_DIR="${RELEASE_MANIFEST_DIR:-${PROJECT_ROOT}/releases}"
usage() { cat <<'EOF'
Usage: RELEASE_SHA=<sha> IMAGE_DIGEST=sha256:<digest> PRE_DEPLOY_MIGRATION_SAFE=true \
  MIGRATION_COMPATIBILITY=expand_contract_compatible \
  MIGRATION_COMMAND_JSON='["executable","arg"]' ./infrastructure/scripts/release-preflight-migration.sh

Runs the validated argv as a one-off tenant-admin-candidate container pinned to
the candidate digest. It never execs into an arbitrary running service and
never invokes a shell command string.
EOF
}
log() { printf '[migration-preflight] %s\n' "$*"; }; fail() { printf '[migration-preflight] ERROR: %s\n' "$*" >&2; exit 1; }
[[ "${1:-}" == --help || "${1:-}" == -h ]] && { usage; exit 0; }
validate_inputs() { : "${RELEASE_SHA:?RELEASE_SHA is required}"; : "${IMAGE_DIGEST:?IMAGE_DIGEST is required}"; : "${MIGRATION_COMMAND_JSON:?MIGRATION_COMMAND_JSON is required}"; [[ "${PRE_DEPLOY_MIGRATION_SAFE:-}" == true && "${MIGRATION_COMPATIBILITY:-}" == expand_contract_compatible ]] || fail "Explicit expand/contract declaration is required"; [[ "$RELEASE_SHA" =~ ^[0-9a-f]{7,64}$ && "$IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || fail "Invalid SHA or digest"; for v in DATABASE_URL POSTGRES_PASSWORD PAYLOAD_SECRET BETTER_AUTH_SECRET; do [[ -n "${!v:-}" ]] || fail "Missing process environment ${v}"; done; node -e 'const a=JSON.parse(process.argv[1]);if(!Array.isArray(a)||!a.length||a.some(x=>typeof x!=="string"||!x||/[\n\r\0]/.test(x)))process.exit(1)' "$MIGRATION_COMMAND_JSON" || fail "MIGRATION_COMMAND_JSON must be a non-empty argv array"; MIGRATION_ARGV=(); while IFS= read -r value; do MIGRATION_ARGV+=("$value"); done < <(node -e 'for(const x of JSON.parse(process.argv[1]))console.log(x)' "$MIGRATION_COMMAND_JSON"); }
compose() { local a=(docker compose); [[ -f "$ENV_FILE" ]] && a+=(--env-file "$ENV_FILE"); a+=(-f "$COMPOSE_FILE"); "${a[@]}" "$@"; }
main() { validate_inputs; local repo="${TENANT_ADMIN_IMAGE_REPOSITORY:-akademate-tenant}" image="${repo}@${IMAGE_DIGEST}" tag="${repo}:${RELEASE_SHA}"; docker image inspect "$image" >/dev/null && docker image inspect --format '{{join .RepoDigests "\n"}}' "$tag" | grep -Fx "$image" >/dev/null || fail "Candidate tag/digest is unavailable or mismatched"; export TENANT_ADMIN_IMAGE_REFERENCE="$image"; compose --profile candidate run --rm --no-deps --entrypoint "${MIGRATION_ARGV[0]}" tenant-admin-candidate "${MIGRATION_ARGV[@]:1}"; mkdir -p "$MANIFEST_DIR"; local command_hash="$(printf '%s' "$MIGRATION_COMMAND_JSON" | sha256sum | awk '{print $1}')"; cat > "${MANIFEST_DIR}/${RELEASE_SHA}.migration-preflight.json" <<EOF
{"candidate":{"sha":"${RELEASE_SHA}","tag":"${tag}","image":"${image}","digest":"${IMAGE_DIGEST}"},"compatibility":"expand_contract_compatible","command_sha256":"${command_hash}","result":"succeeded","traffic_switch":"not_attempted","schema_rollback":"not_attempted","created_at":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
}
if [[ "${1:-}" == --validate-input ]]; then
  validate_inputs
else
  main "$@"
fi

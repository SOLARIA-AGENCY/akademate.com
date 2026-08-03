#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TENANT_ADMIN_DIR="${ROOT_DIR}/apps/tenant-admin"
INIT_SCRIPT="${ROOT_DIR}/infrastructure/akademate-next/postgres-init/010-create-app-role.sh"
CONTAINER="akademate-next-signage-proof-${$}"
DATABASE="akademate_next_signage_proof"
OWNER_USER="akademate_next_owner"
OWNER_PASSWORD="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))")"
APP_USER="akademate_next_app"
APP_PASSWORD="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))")"
PAYLOAD_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/akademate-next-signage-proof.XXXXXX")"
PORT=""

cleanup() {
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
  rm -rf "${LOG_DIR}"
}
trap cleanup EXIT INT TERM

start_database() {
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
  docker run -d \
    --name "${CONTAINER}" \
    --tmpfs /var/lib/postgresql/data:rw,noexec,nosuid,size=1g \
    -p 127.0.0.1::5432 \
    -e POSTGRES_USER="${OWNER_USER}" \
    -e POSTGRES_PASSWORD="${OWNER_PASSWORD}" \
    -e POSTGRES_DB="${DATABASE}" \
    -e AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    -e AKADEMATE_NEXT_DB_APP_PASSWORD="${APP_PASSWORD}" \
    -v "${INIT_SCRIPT}:/docker-entrypoint-initdb.d/010-create-app-role.sh:ro" \
    postgres:16-alpine >/dev/null

  for _ in $(seq 1 30); do
    if docker exec "${CONTAINER}" pg_isready -U "${OWNER_USER}" -d "${DATABASE}" >/dev/null 2>&1; then
      PORT="$(docker port "${CONTAINER}" 5432/tcp | sed -E 's/.*:([0-9]+)$/\1/')"
      return
    fi
    sleep 1
  done

  docker logs "${CONTAINER}" >&2
  echo "PostgreSQL proof container did not become ready" >&2
  exit 1
}

owner_url() {
  printf 'postgresql://%s:%s@127.0.0.1:%s/%s' "${OWNER_USER}" "${OWNER_PASSWORD}" "${PORT}" "${DATABASE}"
}

app_url() {
  printf 'postgresql://%s:%s@127.0.0.1:%s/%s' "${APP_USER}" "${APP_PASSWORD}" "${PORT}" "${DATABASE}"
}

payload() {
  (
    cd "${TENANT_ADMIN_DIR}"
    env \
      AKADEMATE_RUNTIME=next \
      DATABASE_URL="$(owner_url)" \
      AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
      PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
      PAYLOAD_DB_PUSH=false \
      node_modules/.bin/payload "$@"
  )
}

psql_owner() {
  docker exec "${CONTAINER}" \
    psql -U "${OWNER_USER}" -d "${DATABASE}" -v ON_ERROR_STOP=1 "$@"
}

assert_query() {
  local query="$1"
  local expected="$2"
  local actual
  actual="$(psql_owner -Atc "${query}")"
  if [[ "${actual}" != "${expected}" ]]; then
    printf 'Query assertion failed.\nQuery: %s\nExpected: %s\nActual: %s\n' \
      "${query}" "${expected}" "${actual}" >&2
    exit 1
  fi
}

start_database
payload migrate >"${LOG_DIR}/migrate-with-data.log" 2>&1
(
  cd "${TENANT_ADMIN_DIR}"
  env \
    AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL="$(owner_url)" \
    AKADEMATE_NEXT_TEST_APP_DATABASE_URL="$(app_url)" \
    AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    node_modules/.bin/tsx scripts/verify-next-signage-rls.ts
)

if payload migrate:down >"${LOG_DIR}/rollback-with-data.log" 2>&1; then
  echo "Rollback unexpectedly succeeded with operational signage data" >&2
  exit 1
fi
grep -q 'Cannot roll back Akademate Next signage: operational data exists' \
  "${LOG_DIR}/rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "1"
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "5"

start_database
payload migrate >"${LOG_DIR}/migrate-empty.log" 2>&1
psql_owner -c "UPDATE payload_migrations SET batch=2 WHERE name='20260802_akademate_next_signage';" >/dev/null
payload migrate:down >"${LOG_DIR}/rollback-empty.log" 2>&1
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='campuses';" "false|false"
assert_query "SELECT has_table_privilege('${APP_USER}','campuses','SELECT')::text || '|' || has_table_privilege('${APP_USER}','campuses','INSERT')::text || '|' || has_table_privilege('${APP_USER}','campuses','UPDATE')::text || '|' || has_table_privilege('${APP_USER}','campuses','DELETE')::text;" "false|false|false|false"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='campuses' AND column_name='tenant_id';" "YES"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "0"

psql_owner -c "INSERT INTO tenants(name,slug) VALUES ('Legacy tenant','legacy-tenant'); INSERT INTO campuses(slug,name,city,tenant_id) VALUES ('legacy-null-campus','Legacy null campus','Tallinn',NULL);" >/dev/null
if payload migrate >"${LOG_DIR}/migrate-null-campus.log" 2>&1; then
  echo "Migration unexpectedly accepted a campus without tenant ownership" >&2
  exit 1
fi
grep -q 'column "tenant_id" of relation "campuses" contains null values' \
  "${LOG_DIR}/migrate-null-campus.log"
assert_query "SELECT count(*) FROM campuses WHERE tenant_id IS NULL;" "1"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "0"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='campuses' AND column_name='tenant_id';" "YES"

printf '%s\n' '{"postgres":"16","migrationDirectory":"migrations-next","rollbackWithData":"rejected","emptyRollback":"clean","nullCampus":"transactionally-rejected"}'

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
  local exit_code=$?
  if [[ ${exit_code} -ne 0 ]]; then
    for log_file in "${LOG_DIR}"/*.log; do
      [[ -e "${log_file}" ]] || continue
      printf '\n--- %s ---\n' "$(basename "${log_file}")" >&2
      tail -n 80 "${log_file}" >&2
    done
  fi
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

capture_payload() {
  local log_file="$1"
  shift
  set +e
  payload "$@" 2>&1 | tail -n 200 >"${log_file}"
  local payload_exit=${PIPESTATUS[0]}
  set -e
  return "${payload_exit}"
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
capture_payload "${LOG_DIR}/migrate-with-data.log" migrate
(
  cd "${TENANT_ADMIN_DIR}"
  env \
    AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL="$(owner_url)" \
    AKADEMATE_NEXT_TEST_APP_DATABASE_URL="$(app_url)" \
    AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    node_modules/.bin/tsx scripts/verify-next-signage-rls.ts
)
(
  cd "${TENANT_ADMIN_DIR}"
  env \
    AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL="$(owner_url)" \
    AKADEMATE_NEXT_TEST_APP_DATABASE_URL="$(app_url)" \
    AKADEMATE_RUNTIME=next \
    DATABASE_URL="$(app_url)" \
    AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    node_modules/.bin/tsx scripts/verify-next-offer-conversion-db.ts
)
psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=6 WHERE name='20260803_akademate_next_public_offer_projection';" >/dev/null
capture_payload "${LOG_DIR}/public-offer-projection-rollback.log" migrate:down
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_projection';" "0"
assert_query "SELECT count(*) FROM pg_proc WHERE proname='akademate_next_get_public_offer';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=5 WHERE name='20260803_akademate_next_offer_runtime_access';" >/dev/null

if capture_payload "${LOG_DIR}/offer-access-rollback-with-data.log" migrate:down; then
  echo "Offer access rollback unexpectedly succeeded with academy offer data" >&2
  exit 1
fi
grep -q 'Cannot roll back offer runtime access while academy offer data exists' \
  "${LOG_DIR}/offer-access-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_runtime_access';" "1"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='course_runs';" "true|true"

psql_owner -c "DELETE FROM course_runs; DELETE FROM courses; DELETE FROM areas_formativas WHERE codigo='OFFER-PROOF';" >/dev/null
capture_payload "${LOG_DIR}/offer-access-rollback-empty.log" migrate:down
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_runtime_access';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='course_runs';" "false|false"

psql_owner -c "INSERT INTO areas_formativas(nombre,codigo) VALUES ('Rollback offer area','ROLLBACK-OFFER'); INSERT INTO courses(codigo,slug,name,area_formativa_id,tenant_id) SELECT 'ROLLBACK-OFFER','rollback-offer','Rollback offer',id,(SELECT id FROM tenants WHERE slug='tenant-a') FROM areas_formativas WHERE codigo='ROLLBACK-OFFER'; INSERT INTO course_runs(course_id,codigo,start_date,end_date,tenant_id,publication_access,share_slug) SELECT id,'ROLLBACK-OFFER-RUN','2099-02-01','2099-02-02',tenant_id,'public','rollback-offer' FROM courses WHERE codigo='ROLLBACK-OFFER'; UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=4 WHERE name='20260803_akademate_next_offer_conversion_modes';" >/dev/null
assert_query "SELECT max(batch)::text FROM payload_migrations;" "4"
assert_query "SELECT count(*) FROM course_runs WHERE publication_access='public' AND share_slug='rollback-offer';" "1"

if capture_payload "${LOG_DIR}/offer-rollback-with-data.log" migrate:down; then
  echo "Offer rollback unexpectedly succeeded with configured course offers" >&2
  exit 1
fi
grep -q 'Cannot roll back offer conversion modes while configured course offers exist' \
  "${LOG_DIR}/offer-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_conversion_modes';" "1"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='course_runs' AND column_name='offer_price_amount';" "1"

psql_owner -c "DELETE FROM course_runs; DELETE FROM courses; DELETE FROM areas_formativas WHERE codigo='ROLLBACK-OFFER'; UPDATE payload_migrations SET batch=2 WHERE name='20260803_akademate_next_offer_conversion_modes'; UPDATE payload_migrations SET batch=3 WHERE name='20260802_akademate_next_signage';" >/dev/null

if capture_payload "${LOG_DIR}/rollback-with-data.log" migrate:down; then
  echo "Rollback unexpectedly succeeded with operational signage data" >&2
  exit 1
fi
grep -q 'Cannot roll back Akademate Next signage: operational data exists' \
  "${LOG_DIR}/rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "1"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_conversion_modes';" "1"
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "5"

start_database
capture_payload "${LOG_DIR}/migrate-empty.log" migrate
psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=5 WHERE name='20260803_akademate_next_public_offer_projection';" >/dev/null
capture_payload "${LOG_DIR}/public-offer-projection-rollback-clean.log" migrate:down
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_projection';" "0"
assert_query "SELECT count(*) FROM pg_proc WHERE proname='akademate_next_get_public_offer';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=4 WHERE name='20260803_akademate_next_offer_runtime_access';" >/dev/null
capture_payload "${LOG_DIR}/offer-access-rollback-clean.log" migrate:down
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_runtime_access';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='course_runs';" "false|false"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='course_runs' AND column_name='tenant_id';" "YES"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=2 WHERE name='20260803_akademate_next_offer_conversion_modes'; UPDATE payload_migrations SET batch=3 WHERE name='20260802_akademate_next_signage';" >/dev/null
capture_payload "${LOG_DIR}/rollback-empty.log" migrate:down
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='campuses';" "false|false"
assert_query "SELECT has_table_privilege('${APP_USER}','campuses','SELECT')::text || '|' || has_table_privilege('${APP_USER}','campuses','INSERT')::text || '|' || has_table_privilege('${APP_USER}','campuses','UPDATE')::text || '|' || has_table_privilege('${APP_USER}','campuses','DELETE')::text;" "false|false|false|false"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='campuses' AND column_name='tenant_id';" "YES"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=3 WHERE name='20260803_akademate_next_offer_conversion_modes';" >/dev/null
capture_payload "${LOG_DIR}/offer-rollback-empty.log" migrate:down
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_conversion_modes';" "0"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='course_runs' AND column_name IN ('publication_access','conversion_mode','offer_price_amount');" "0"
assert_query "SELECT count(*) FROM payload_migrations WHERE name IN ('20260802_akademate_next_signage','20260803_akademate_next_offer_conversion_modes','20260803_akademate_next_offer_runtime_access','20260803_akademate_next_public_offer_projection');" "0"
assert_query "SELECT count(*) FROM payload_migrations;" "4"

psql_owner -c "INSERT INTO tenants(name,slug) VALUES ('Legacy tenant','legacy-tenant'); INSERT INTO campuses(slug,name,city,tenant_id) VALUES ('legacy-null-campus','Legacy null campus','Tallinn',NULL);" >/dev/null
if psql_owner -c 'ALTER TABLE campuses ALTER COLUMN tenant_id SET NOT NULL;' \
  >"${LOG_DIR}/null-campus-preflight.log" 2>&1; then
  echo "PostgreSQL unexpectedly accepted a campus without tenant ownership" >&2
  exit 1
fi
grep -q 'column "tenant_id" of relation "campuses" contains null values' \
  "${LOG_DIR}/null-campus-preflight.log"
if capture_payload "${LOG_DIR}/migrate-null-campus.log" migrate; then
  echo "Migration unexpectedly accepted a campus without tenant ownership" >&2
  exit 1
fi
assert_query "SELECT count(*) FROM campuses WHERE tenant_id IS NULL;" "1"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "0"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_conversion_modes';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "0"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='course_runs' AND column_name='offer_price_amount';" "0"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='campuses' AND column_name='tenant_id';" "YES"

printf '%s\n' '{"postgres":"16","migrationDirectory":"migrations-next","publicOfferProjection":"host-scoped-and-rollback-clean","offerAccessRollbackWithData":"rejected","signageRollbackWithData":"rejected","offerRollbackWithData":"rejected","emptyRollbacks":"clean","nullCampus":"transactionally-rejected"}'

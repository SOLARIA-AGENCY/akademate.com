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

capture_payload_down() {
  local log_file="$1"
  local migration_name="$2"
  local retry_log="${log_file}.retry"
  local first_exit=0

  capture_payload "${log_file}" migrate:down || first_exit=$?
  if [[ ${first_exit} -ne 0 ]]; then
    return "${first_exit}"
  fi
  if [[ "$(psql_owner -Atc "SELECT count(*) FROM payload_migrations WHERE name='${migration_name}';")" = "1" ]]; then
    printf '%s\n' "Payload migrate:down returned success without selecting the latest batch; retrying once." >>"${log_file}"
    capture_payload "${retry_log}" migrate:down
    cat "${retry_log}" >>"${log_file}"
    rm -f "${retry_log}"
  fi
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
(
  cd "${TENANT_ADMIN_DIR}"
  env \
    AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL="$(owner_url)" \
    AKADEMATE_NEXT_TEST_APP_DATABASE_URL="$(app_url)" \
    AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    node_modules/.bin/tsx scripts/verify-next-event-ticket-types-rls.ts
)
(
  cd "${TENANT_ADMIN_DIR}"
  env \
    AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL="$(owner_url)" \
    AKADEMATE_NEXT_TEST_APP_DATABASE_URL="$(app_url)" \
    AKADEMATE_RUNTIME=next \
    DATABASE_URL="$(app_url)" \
    AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    node_modules/.bin/tsx scripts/verify-next-paid-offer-db.ts
)
psql_owner -c "
  INSERT INTO paid_offer_orders (
    tenant_id, course_run_id, idempotency_key, payload_fingerprint, contact_fingerprint,
    first_name, last_name, email, privacy_accepted, privacy_notice_version,
    source_host, source_slug, provider, payment_method, payment_plan, offer_title,
    offer_total_cents, amount_cents, currency, status, hold_active, expires_at
  )
  SELECT tenant_id, id, gen_random_uuid(), repeat('a', 64), repeat('b', 64),
    'Rollback', 'Guard', 'rollback.guard@example.com', true, 'proof-v1',
    'proof.localhost', share_slug, 'stripe', 'card_or_wallet', payment_plan, 'Rollback proof offer',
    round(offer_price_amount * 100)::integer,
    round((CASE WHEN payment_plan = 'deposit' THEN deposit_amount ELSE offer_price_amount END) * 100)::integer,
    'EUR', 'failed', false, now() + interval '30 minutes'
  FROM course_runs
  WHERE conversion_mode = 'paid_registration'
  ORDER BY id
  LIMIT 1;
" >/dev/null
assert_query "SELECT count(*) FROM paid_offer_orders;" "1"
psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=11 WHERE name='20260803_zzzzz_akademate_next_paid_offer_orders';" >/dev/null
if capture_payload_down "${LOG_DIR}/paid-offer-orders-rollback-with-data.log" '20260803_zzzzz_akademate_next_paid_offer_orders'; then
  echo "Paid offer order rollback unexpectedly succeeded with financial evidence" >&2
  exit 1
fi
grep -q 'Cannot roll back paid offer orders while payment evidence exists' \
  "${LOG_DIR}/paid-offer-orders-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzzzz_akademate_next_paid_offer_orders';" "1"
assert_query "SELECT count(*) FROM paid_offer_orders;" "1"

psql_owner -c "DELETE FROM paid_offer_payment_events; DELETE FROM paid_offer_orders;" >/dev/null
capture_payload_down "${LOG_DIR}/paid-offer-orders-rollback.log" '20260803_zzzzz_akademate_next_paid_offer_orders'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzzzz_akademate_next_paid_offer_orders';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname IN ('paid_offer_orders','paid_offer_payment_events');" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=10 WHERE name='20260803_zzzz_akademate_next_enrollment_lifecycle';" >/dev/null
if capture_payload_down "${LOG_DIR}/enrollment-lifecycle-rollback-with-data.log" '20260803_zzzz_akademate_next_enrollment_lifecycle'; then
  echo "Enrollment lifecycle rollback unexpectedly succeeded with ledger data" >&2
  exit 1
fi
grep -q 'Cannot roll back enrollment lifecycle while lifecycle events exist' \
  "${LOG_DIR}/enrollment-lifecycle-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzzz_akademate_next_enrollment_lifecycle';" "1"
assert_query "SELECT count(*) FROM enrollment_lifecycle_events;" "5"

psql_owner -c "DELETE FROM enrollment_lifecycle_events;" >/dev/null
capture_payload_down "${LOG_DIR}/enrollment-lifecycle-rollback.log" '20260803_zzzz_akademate_next_enrollment_lifecycle'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzzz_akademate_next_enrollment_lifecycle';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='enrollment_lifecycle_events';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=9 WHERE name='20260803_zzz_akademate_next_offer_enrollment_conversion';" >/dev/null
if capture_payload_down "${LOG_DIR}/offer-enrollment-conversion-rollback-with-data.log" '20260803_zzz_akademate_next_offer_enrollment_conversion'; then
  echo "Offer enrollment conversion rollback unexpectedly succeeded with enrollment data" >&2
  exit 1
fi
grep -q 'Cannot roll back offer enrollment conversion while converted enrollments exist' \
  "${LOG_DIR}/offer-enrollment-conversion-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzz_akademate_next_offer_enrollment_conversion';" "1"
assert_query "SELECT count(*) FROM enrollments WHERE offer_submission_id IS NOT NULL;" "3"

psql_owner -c "DELETE FROM enrollments; DELETE FROM leads WHERE status='converted'; UPDATE course_runs SET current_enrollments=0 WHERE codigo IN ('FORM-B','FULL-LIMITED-B','FULL-WAITLIST-B','LAST-SEAT-B','INCONSISTENT-CANCEL-B','CONCURRENT-CANCEL-B');" >/dev/null
capture_payload_down "${LOG_DIR}/offer-enrollment-conversion-rollback.log" '20260803_zzz_akademate_next_offer_enrollment_conversion'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzz_akademate_next_offer_enrollment_conversion';" "0"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='enrollments' AND column_name='offer_submission_id';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=8 WHERE name='20260803_zz_akademate_next_offer_submission_review';" >/dev/null
if capture_payload_down "${LOG_DIR}/offer-submission-review-rollback-with-data.log" '20260803_zz_akademate_next_offer_submission_review'; then
  echo "Offer submission review rollback unexpectedly succeeded with review data" >&2
  exit 1
fi
grep -q 'Cannot roll back offer submission review while review events exist' \
  "${LOG_DIR}/offer-submission-review-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zz_akademate_next_offer_submission_review';" "1"
assert_query "SELECT count(*) FROM offer_submission_review_events;" "5"

psql_owner -c "DELETE FROM offer_submission_review_events; UPDATE offer_submissions SET status='pending_review' WHERE status IN ('approved','rejected','archived');" >/dev/null
capture_payload_down "${LOG_DIR}/offer-submission-review-rollback.log" '20260803_zz_akademate_next_offer_submission_review'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zz_akademate_next_offer_submission_review';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='offer_submission_review_events';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=7 WHERE name='20260803_akademate_next_public_offer_submissions';" >/dev/null
if capture_payload_down "${LOG_DIR}/public-offer-submissions-rollback-with-data.log" '20260803_akademate_next_public_offer_submissions'; then
  echo "Public offer submission rollback unexpectedly succeeded with submission data" >&2
  exit 1
fi
grep -q 'Cannot roll back public offer submissions while submission data exists' \
  "${LOG_DIR}/public-offer-submissions-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_submissions';" "1"
assert_query "SELECT count(*) FROM offer_submissions;" "9"

psql_owner -c "DELETE FROM offer_submissions;" >/dev/null
capture_payload_down "${LOG_DIR}/public-offer-submissions-rollback.log" '20260803_akademate_next_public_offer_submissions'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_submissions';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='offer_submissions';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=6 WHERE name='20260803_akademate_next_public_offer_projection';" >/dev/null
capture_payload_down "${LOG_DIR}/public-offer-projection-rollback.log" '20260803_akademate_next_public_offer_projection'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_projection';" "0"
assert_query "SELECT count(*) FROM pg_proc WHERE proname='akademate_next_get_public_offer';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=5 WHERE name='20260803_akademate_next_offer_runtime_access';" >/dev/null

if capture_payload_down "${LOG_DIR}/offer-access-rollback-with-data.log" '20260803_akademate_next_offer_runtime_access'; then
  echo "Offer access rollback unexpectedly succeeded with academy offer data" >&2
  exit 1
fi
grep -q 'Cannot roll back offer runtime access while academy offer data exists' \
  "${LOG_DIR}/offer-access-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_runtime_access';" "1"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='course_runs';" "true|true"

psql_owner -c "DELETE FROM course_runs; DELETE FROM courses; DELETE FROM areas_formativas WHERE codigo='OFFER-PROOF';" >/dev/null
capture_payload_down "${LOG_DIR}/offer-access-rollback-empty.log" '20260803_akademate_next_offer_runtime_access'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_runtime_access';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='course_runs';" "false|false"

psql_owner -c "INSERT INTO areas_formativas(nombre,codigo) VALUES ('Rollback offer area','ROLLBACK-OFFER'); INSERT INTO courses(codigo,slug,name,area_formativa_id,tenant_id) SELECT 'ROLLBACK-OFFER','rollback-offer','Rollback offer',id,(SELECT id FROM tenants WHERE slug='tenant-a') FROM areas_formativas WHERE codigo='ROLLBACK-OFFER'; INSERT INTO course_runs(course_id,codigo,start_date,end_date,tenant_id,publication_access,share_slug) SELECT id,'ROLLBACK-OFFER-RUN','2099-02-01','2099-02-02',tenant_id,'public','rollback-offer' FROM courses WHERE codigo='ROLLBACK-OFFER'; UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=4 WHERE name='20260803_akademate_next_offer_conversion_modes';" >/dev/null
assert_query "SELECT max(batch)::text FROM payload_migrations;" "4"
assert_query "SELECT count(*) FROM course_runs WHERE publication_access='public' AND share_slug='rollback-offer';" "1"

if capture_payload_down "${LOG_DIR}/offer-rollback-with-data.log" '20260803_akademate_next_offer_conversion_modes'; then
  echo "Offer rollback unexpectedly succeeded with configured course offers" >&2
  exit 1
fi
grep -q 'Cannot roll back offer conversion modes while configured course offers exist' \
  "${LOG_DIR}/offer-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_conversion_modes';" "1"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='course_runs' AND column_name='offer_price_amount';" "1"

psql_owner -c "DELETE FROM course_runs; DELETE FROM courses; DELETE FROM areas_formativas WHERE codigo='ROLLBACK-OFFER'; UPDATE payload_migrations SET batch=2 WHERE name='20260803_akademate_next_offer_conversion_modes'; UPDATE payload_migrations SET batch=3 WHERE name='20260802_akademate_next_signage';" >/dev/null

if capture_payload_down "${LOG_DIR}/rollback-with-data.log" '20260802_akademate_next_signage'; then
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

psql_owner -c "
  INSERT INTO tenants (name, slug, domain, active)
  VALUES ('Ticket rollback tenant', 'ticket-rollback', 'ticket-rollback.example', true);
  INSERT INTO areas_formativas (nombre, codigo)
  VALUES ('Ticket rollback area', 'ROLLBACK-TICKET-AREA');
  INSERT INTO courses (codigo, slug, name, area_formativa_id, tenant_id)
  SELECT 'ROLLBACK-TICKET-COURSE', 'rollback-ticket-course', 'Ticket rollback course',
    area.id, tenant.id
  FROM areas_formativas area
  CROSS JOIN tenants tenant
  WHERE area.codigo='ROLLBACK-TICKET-AREA' AND tenant.slug='ticket-rollback';
  INSERT INTO course_runs (
    course_id, codigo, start_date, end_date, tenant_id, conversion_mode,
    payment_plan, offer_price_amount
  )
  SELECT course.id, 'ROLLBACK-TICKET-RUN', '2099-03-01', '2099-03-02', course.tenant_id,
    'paid_registration', 'full_amount', 149.50
  FROM courses course
  WHERE course.codigo='ROLLBACK-TICKET-COURSE';
  INSERT INTO event_offer_ticket_types (
    tenant_id, course_run_id, slug, name, ticket_kind, price_amount, max_per_registration
  )
  SELECT tenant_id, id, 'rollback-ticket', 'Rollback ticket', 'paid', 149.50, 1
  FROM course_runs
  WHERE codigo='ROLLBACK-TICKET-RUN' AND conversion_mode='paid_registration'
  ORDER BY id
  LIMIT 1;
" >/dev/null
assert_query "SELECT count(*) FROM event_offer_ticket_types;" "1"
psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=12 WHERE name='20260809_akademate_next_event_ticket_types';" >/dev/null
if capture_payload_down "${LOG_DIR}/event-ticket-types-rollback-with-data.log" '20260809_akademate_next_event_ticket_types'; then
  echo "Event ticket type rollback unexpectedly succeeded with ticket configuration" >&2
  exit 1
fi
grep -q 'Cannot roll back event ticket types while ticket configuration exists' \
  "${LOG_DIR}/event-ticket-types-rollback-with-data.log"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260809_akademate_next_event_ticket_types';" "1"
assert_query "SELECT count(*) FROM event_offer_ticket_types;" "1"

psql_owner -c "DELETE FROM event_offer_ticket_types;" >/dev/null
capture_payload_down "${LOG_DIR}/event-ticket-types-rollback.log" '20260809_akademate_next_event_ticket_types'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260809_akademate_next_event_ticket_types';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='event_offer_ticket_types';" "0"
psql_owner -c "
  DELETE FROM course_runs WHERE codigo='ROLLBACK-TICKET-RUN';
  DELETE FROM courses WHERE codigo='ROLLBACK-TICKET-COURSE';
  DELETE FROM areas_formativas WHERE codigo='ROLLBACK-TICKET-AREA';
  DELETE FROM tenants WHERE slug='ticket-rollback';
" >/dev/null

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=10 WHERE name='20260803_zzzzz_akademate_next_paid_offer_orders';" >/dev/null
capture_payload_down "${LOG_DIR}/paid-offer-orders-rollback-clean.log" '20260803_zzzzz_akademate_next_paid_offer_orders'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzzzz_akademate_next_paid_offer_orders';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname IN ('paid_offer_orders','paid_offer_payment_events');" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=9 WHERE name='20260803_zzzz_akademate_next_enrollment_lifecycle';" >/dev/null
capture_payload_down "${LOG_DIR}/enrollment-lifecycle-rollback-clean.log" '20260803_zzzz_akademate_next_enrollment_lifecycle'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzzz_akademate_next_enrollment_lifecycle';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='enrollment_lifecycle_events';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=8 WHERE name='20260803_zzz_akademate_next_offer_enrollment_conversion';" >/dev/null
capture_payload_down "${LOG_DIR}/offer-enrollment-conversion-rollback-clean.log" '20260803_zzz_akademate_next_offer_enrollment_conversion'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zzz_akademate_next_offer_enrollment_conversion';" "0"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='enrollments' AND column_name='offer_submission_id';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=7 WHERE name='20260803_zz_akademate_next_offer_submission_review';" >/dev/null
capture_payload_down "${LOG_DIR}/offer-submission-review-rollback-clean.log" '20260803_zz_akademate_next_offer_submission_review'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_zz_akademate_next_offer_submission_review';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='offer_submission_review_events';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=6 WHERE name='20260803_akademate_next_public_offer_submissions';" >/dev/null
capture_payload_down "${LOG_DIR}/public-offer-submissions-rollback-clean.log" '20260803_akademate_next_public_offer_submissions'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_submissions';" "0"
assert_query "SELECT count(*) FROM pg_class WHERE relname='offer_submissions';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=5 WHERE name='20260803_akademate_next_public_offer_projection';" >/dev/null
assert_query "SELECT max(batch)::text FROM payload_migrations;" "5"
capture_payload_down "${LOG_DIR}/public-offer-projection-rollback-clean.log" '20260803_akademate_next_public_offer_projection'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_public_offer_projection';" "0"
assert_query "SELECT count(*) FROM pg_proc WHERE proname='akademate_next_get_public_offer';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=4 WHERE name='20260803_akademate_next_offer_runtime_access';" >/dev/null
capture_payload_down "${LOG_DIR}/offer-access-rollback-clean.log" '20260803_akademate_next_offer_runtime_access'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_runtime_access';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='course_runs';" "false|false"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='course_runs' AND column_name='tenant_id';" "YES"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=2 WHERE name='20260803_akademate_next_offer_conversion_modes'; UPDATE payload_migrations SET batch=3 WHERE name='20260802_akademate_next_signage';" >/dev/null
capture_payload_down "${LOG_DIR}/rollback-empty.log" '20260802_akademate_next_signage'
assert_query "SELECT count(*) FROM pg_class WHERE relname LIKE 'signage_%' AND relkind='r';" "0"
assert_query "SELECT relrowsecurity::text || '|' || relforcerowsecurity::text FROM pg_class WHERE relname='campuses';" "false|false"
assert_query "SELECT has_table_privilege('${APP_USER}','campuses','SELECT')::text || '|' || has_table_privilege('${APP_USER}','campuses','INSERT')::text || '|' || has_table_privilege('${APP_USER}','campuses','UPDATE')::text || '|' || has_table_privilege('${APP_USER}','campuses','DELETE')::text;" "false|false|false|false"
assert_query "SELECT is_nullable FROM information_schema.columns WHERE table_name='campuses' AND column_name='tenant_id';" "YES"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260802_akademate_next_signage';" "0"

psql_owner -c "UPDATE payload_migrations SET batch=1; UPDATE payload_migrations SET batch=3 WHERE name='20260803_akademate_next_offer_conversion_modes';" >/dev/null
capture_payload_down "${LOG_DIR}/offer-rollback-empty.log" '20260803_akademate_next_offer_conversion_modes'
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260803_akademate_next_offer_conversion_modes';" "0"
assert_query "SELECT count(*) FROM information_schema.columns WHERE table_name='course_runs' AND column_name IN ('publication_access','conversion_mode','offer_price_amount');" "0"
assert_query "SELECT count(*) FROM payload_migrations WHERE name IN ('20260802_akademate_next_signage','20260803_akademate_next_offer_conversion_modes','20260803_akademate_next_offer_runtime_access','20260803_akademate_next_public_offer_projection','20260803_akademate_next_public_offer_submissions','20260803_zz_akademate_next_offer_submission_review','20260803_zzz_akademate_next_offer_enrollment_conversion','20260803_zzzz_akademate_next_enrollment_lifecycle','20260803_zzzzz_akademate_next_paid_offer_orders');" "0"
assert_query "SELECT count(*) FROM payload_migrations WHERE name IN ('20260803_zzzzzz_akademate_next_dashboard_projection','20260803_zzzzzzz_akademate_next_dashboard_least_privilege');" "2"
assert_query "SELECT count(*) FROM payload_migrations WHERE name='20260809_akademate_next_event_ticket_types';" "0"
assert_query "SELECT count(*) FROM payload_migrations WHERE name NOT IN ('20260803_zzzzzz_akademate_next_dashboard_projection','20260803_zzzzzzz_akademate_next_dashboard_least_privilege','20260809_akademate_next_event_ticket_types');" "4"

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

printf '%s\n' '{"postgres":"16","migrationDirectory":"migrations-next","publicOfferProjection":"host-scoped-and-rollback-clean","publicOfferSubmissions":"idempotent-rate-limited-and-rollback-guarded","submissionReview":"audited-reversible-and-rollback-guarded","submissionEnrollment":"tenant-scoped-idempotent-capacity-and-rollback-guarded","enrollmentLifecycle":"audited-capacity-reconciled-and-rollback-guarded","paidOfferOrders":"financial-evidence-guarded-and-rollback-clean","eventTicketTypes":"data-guarded-and-rollback-clean","offerAccessRollbackWithData":"rejected","signageRollbackWithData":"rejected","offerRollbackWithData":"rejected","emptyRollbacks":"clean","nullCampus":"transactionally-rejected"}'

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TENANT_ADMIN_DIR="${ROOT_DIR}/apps/tenant-admin"
INIT_SCRIPT="${ROOT_DIR}/infrastructure/akademate-next/postgres-init/010-create-app-role.sh"
CONTAINER="akademate-next-public-offer-browser-${$}"
DATABASE="akademate_next_public_offer_browser"
OWNER_USER="akademate_next_owner"
OWNER_PASSWORD="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))")"
APP_USER="akademate_next_app"
APP_PASSWORD="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))")"
PAYLOAD_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
AUTH_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
PEPPER="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
OUTPUT_DIR="${ROOT_DIR}/.codex-loop-runs/next-public-offer-browser"
DATABASE_PORT=""
WEB_PORT="$(node -e "const s=require('node:net').createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close()})")"
SERVER_PID=""

cleanup() {
  local exit_code=$?
  if [[ -n "${SERVER_PID}" ]]; then kill "${SERVER_PID}" >/dev/null 2>&1 || true; fi
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
  if [[ ${exit_code} -ne 0 ]]; then
    tail -n 120 "${OUTPUT_DIR}/server.log" >&2 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"
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
    DATABASE_PORT="$(docker port "${CONTAINER}" 5432/tcp | sed -E 's/.*:([0-9]+)$/\1/')"
    break
  fi
  sleep 1
done
[[ -n "${DATABASE_PORT}" ]] || { echo "PostgreSQL browser QA database did not start" >&2; exit 1; }

OWNER_URL="postgresql://${OWNER_USER}:${OWNER_PASSWORD}@127.0.0.1:${DATABASE_PORT}/${DATABASE}"
APP_URL="postgresql://${APP_USER}:${APP_PASSWORD}@127.0.0.1:${DATABASE_PORT}/${DATABASE}"

(
  cd "${TENANT_ADMIN_DIR}"
  env AKADEMATE_RUNTIME=next DATABASE_URL="${OWNER_URL}" AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" \
    PAYLOAD_SECRET="${PAYLOAD_SECRET}" PAYLOAD_DB_PUSH=false node_modules/.bin/payload migrate
) >"${OUTPUT_DIR}/migrate.log" 2>&1

docker exec -i "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
INSERT INTO tenants (name, slug, domain, contact_email, branding_primary_color)
VALUES ('North Star Academy', 'north-star', 'learn.qa.example', 'hello@northstar.example', '#2457F5');
INSERT INTO areas_formativas (nombre, codigo) VALUES ('Leadership', 'QA-LEADERSHIP');
INSERT INTO courses (codigo, slug, name, short_description, modality, area_formativa_id, tenant_id)
SELECT 'QA-COURSE', 'applied-learning-lab', 'Applied Learning Lab',
  'A focused two-day programme for collaborative leadership practice.', 'hibrido', a.id, t.id
FROM areas_formativas a CROSS JOIN tenants t
WHERE a.codigo = 'QA-LEADERSHIP' AND t.slug = 'north-star';
INSERT INTO course_runs (
  course_id, codigo, start_date, end_date, enrollment_deadline, tenant_id,
  publication_access, share_slug, conversion_mode, form_template_key,
  capacity_policy, max_students, current_enrollments, status
)
SELECT c.id, 'QA-RUN', '2099-09-12 09:00:00+00', '2099-09-13 17:00:00+00',
  '2099-09-10 23:59:59+00', c.tenant_id, 'public', 'applied-learning-lab',
  'approval_required', 'admissions_form', 'limited', 24, 16, 'enrollment_open'
FROM courses c WHERE c.codigo = 'QA-COURSE';
INSERT INTO users (password, name, role, tenant_id, email)
SELECT 'not-used', 'QA Manager', 'admin', t.id, 'manager@northstar.example'
FROM tenants t WHERE t.slug = 'north-star';
WITH inserted_lead AS (
  INSERT INTO leads (
    first_name, last_name, email, phone, gdpr_consent,
    privacy_policy_accepted, status, priority, tenant_id, updated_at, created_at
  )
  SELECT 'Grace', 'Hopper', 'grace.waitlist@example.test', '', true, true,
    'converted', 'medium', t.id, now(), now()
  FROM tenants t WHERE t.slug = 'north-star'
  RETURNING id, tenant_id
)
INSERT INTO enrollments (
  tenant_id, student_id, course_run_id, status, payment_status,
  total_amount, amount_paid, enrolled_at, created_by_id, updated_at, created_at
)
SELECT lead.tenant_id, lead.id, run.id, 'waitlisted', 'pending',
  0, 0, now(), users.id, now(), now()
FROM inserted_lead lead
JOIN course_runs run ON run.tenant_id = lead.tenant_id AND run.codigo = 'QA-RUN'
JOIN users ON users.tenant_id = lead.tenant_id AND users.email = 'manager@northstar.example';
SQL

MANAGER_USER_ID="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc "SELECT id FROM users WHERE email = 'manager@northstar.example'")"
TENANT_ID="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc "SELECT id FROM tenants WHERE slug = 'north-star'")"
[[ "${MANAGER_USER_ID}" =~ ^[1-9][0-9]*$ && "${TENANT_ID}" =~ ^[1-9][0-9]*$ ]] || { echo "Browser QA identity seed failed" >&2; exit 1; }
AUTH_TOKEN="$(cd "${TENANT_ADMIN_DIR}" && env AUTH_SECRET="${AUTH_SECRET}" USER_ID="${MANAGER_USER_ID}" TENANT_ID="${TENANT_ID}" node --input-type=module - <<'NODE'
import { SignJWT } from 'jose'
const token = await new SignJWT({ tenantId: Number(process.env.TENANT_ID), type: 'akademate-next-session' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer('akademate-next')
  .setAudience('akademate-next-learning')
  .setSubject(process.env.USER_ID)
  .setIssuedAt()
  .setExpirationTime('10m')
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET))
process.stdout.write(token)
NODE
)"

(
  cd "${TENANT_ADMIN_DIR}"
  env NODE_ENV=production AKADEMATE_RUNTIME=next DATABASE_URL="${APP_URL}" \
    AKADEMATE_NEXT_DB_APP_USER="${APP_USER}" PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
    AKADEMATE_NEXT_AUTH_SECRET="${AUTH_SECRET}" \
    AKADEMATE_NEXT_ENROLLMENTS_ENABLED=true \
    AKADEMATE_NEXT_OFFERS_ENABLED=true AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED=true \
    AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED=true \
    AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL=https://akademate.com/legal/privacy \
    AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION=2026-08-03 \
    AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER="${PEPPER}" \
    node_modules/.bin/next start --hostname 127.0.0.1 --port "${WEB_PORT}"
) >"${OUTPUT_DIR}/server.log" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 45); do
  if curl --silent --fail --header 'Host: learn.qa.example' \
    "http://127.0.0.1:${WEB_PORT}/o/applied-learning-lab" >/dev/null; then break; fi
  sleep 1
done
curl --silent --fail --header 'Host: learn.qa.example' \
  "http://127.0.0.1:${WEB_PORT}/o/applied-learning-lab" >/dev/null

env \
  AKADEMATE_NEXT_PUBLIC_OFFER_QA_URL="http://north-star.localhost:${WEB_PORT}/o/applied-learning-lab" \
  AKADEMATE_NEXT_PUBLIC_OFFER_QA_OUTPUT="${OUTPUT_DIR}" \
  AKADEMATE_NEXT_PUBLIC_OFFER_QA_AUTH_TOKEN="${AUTH_TOKEN}" \
  node "${ROOT_DIR}/scripts/verify-next-public-offer-browser.mjs"

SUBMISSIONS="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc 'SELECT count(*) FROM offer_submissions')"
[[ "${SUBMISSIONS}" = "1" ]] || { echo "Expected one browser-created submission, got ${SUBMISSIONS}" >&2; exit 1; }
REVIEW_STATE="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc "SELECT os.status || '|' || count(e.id) FROM offer_submissions os LEFT JOIN offer_submission_review_events e ON e.tenant_id=os.tenant_id AND e.submission_id=os.id GROUP BY os.status")"
[[ "${REVIEW_STATE}" = "approved|1" ]] || { echo "Expected one audited approved decision, got ${REVIEW_STATE}" >&2; exit 1; }
ENROLLMENT_STATE="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc "SELECT e.status || '|' || e.payment_status || '|' || cr.current_enrollments FROM enrollments e JOIN course_runs cr ON cr.tenant_id=e.tenant_id AND cr.id=e.course_run_id WHERE e.offer_submission_id IS NOT NULL")"
[[ "${ENROLLMENT_STATE}" = "withdrawn|pending|17" ]] || { echo "Expected a withdrawn enrollment with payment unchanged and capacity reconciled to 17, got ${ENROLLMENT_STATE}" >&2; exit 1; }
WAITLIST_STATE="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc "SELECT e.status || '|' || count(event.id) FROM enrollments e LEFT JOIN enrollment_lifecycle_events event ON event.tenant_id=e.tenant_id AND event.enrollment_id=e.id JOIN leads lead ON lead.tenant_id=e.tenant_id AND lead.id=e.student_id WHERE lead.email='grace.waitlist@example.test' GROUP BY e.status")"
[[ "${WAITLIST_STATE}" = "confirmed|1" ]] || { echo "Expected the oldest waiter to be promoted with one event, got ${WAITLIST_STATE}" >&2; exit 1; }
LIFECYCLE_EVENTS="$(docker exec "${CONTAINER}" psql -U "${OWNER_USER}" -d "${DATABASE}" -Atc 'SELECT count(*) FROM enrollment_lifecycle_events')"
[[ "${LIFECYCLE_EVENTS}" = "2" ]] || { echo "Expected two lifecycle events, got ${LIFECYCLE_EVENTS}" >&2; exit 1; }
printf '%s\n' "{\"postgres\":\"16\",\"nextPort\":${WEB_PORT},\"persistedSubmissions\":1,\"reviewState\":\"approved\",\"reviewEvents\":1,\"enrollmentState\":\"withdrawn\",\"paymentState\":\"pending\",\"currentEnrollments\":17,\"promotedWaiters\":1,\"lifecycleEvents\":2,\"evidence\":\"${OUTPUT_DIR}\"}"

# Akademate Next Learning Capability Audit

Last updated: 2026-07-30

Baseline audited: `0ca1b43ea229fc531dab79388925fc73e8077eab`.

| Capability | Baseline verdict | Evidence / gap |
| --- | --- | --- |
| Administrative access | Implemented | Payload users and operational roles exist. |
| Student access | Partial | Embedded campus auth/enrolment works; identity is separate from users. |
| Teacher access | Missing | Teacher is a Staff type, not an authenticated scoped principal. |
| Role dashboards | Partial | Admin and embedded student campus exist; teacher shell is missing. |
| Independent `apps/campus` | Stub/fragmented | Payload config has no collections and auth endpoints do not match the active backend. |
| Modules and lessons | Partial | Payload CRUD exists for admin/gestor; authoring UI is not connected. |
| Assignments/submissions | Partial model | Submission fields exist; student delivery and teacher review flows are missing. |
| Quizzes | Stub | JSON fields exist without question bank, attempts or evaluation workflow. |
| Gradebook/feedback | Partial and split | Grade model exists in a second Payload stack, not the active tenant runtime. |
| Announcements | Missing | No durable LMS announcement model/API. |
| Chat | Missing | Realtime transport exists; no conversations, participants, messages or retention. |
| Realtime | Partial technical layer | Tenant/user rooms exist but are not durable messaging authority. |

## P0 findings

1. `Submissions.create` accepts every authenticated user and the collection lacks
   the canonical tenant field.
2. Modules and lessons allow authenticated reads without enrolment or explicit
   teacher assignment.
3. Two LMS models and two campus surfaces have diverged.
4. Teacher is not an authentication/security principal.

## Selected architecture

- `tenant-admin` remains the initial canonical Payload/API backend.
- `apps/campus` becomes a frontend-only application with distinct student and
  teacher shells.
- The embedded campus remains transitional until parity tests pass.
- A single learning domain owns membership, course content, activity,
  submission, grade and conversation authorization.
- Realtime is delivery only; durable data and server authorization are source
  authority.

## Implemented after audit

- `65e9beef`: isolated Next Compose/data-plane and deny-list.
- `b03226ff`: academic membership access contract.
- `7f6d7801`: explicit conversation-participant access contract.
- `e3f2b869`: durable message command with derived identity and idempotency key.
- `4bd5fbcd`: assignment, submission and grade domain workflow.
- `2de0813f`: reference repository contract for durable learning records.
- `4970449b`: dynamic, fail-closed Payload collection runtime boundary.
- `d208a6c1`: separate database owner/migrator and non-bypass application role.
- `4e653739`: Next-only integer learning migration with forced RLS.
- `43564692`: canonical deny-all Next collection manifest.
- `0e941a17`: physical course-field alignment and PostgreSQL-safe identifiers.

These commits are domain/infrastructure foundations. They do not yet prove a
rendered teacher portal, student delivery, gradebook or live chat.

## Persistence lineage decision

- The active Next backend is `apps/tenant-admin` and its Payload schema uses
  integer identifiers.
- `packages/db` uses a separate UUID/Drizzle lineage and is not the persistence
  authority for these learning commands.
- The seven canonical learning tables will be created by a Payload migration
  registered only for exact runtime `next`.
- Student and staff profiles require explicit, unique links to tenant-scoped
  Payload users before a learning membership can be persisted.
- Existing Payload `Submissions` and the split UUID assignments/grades tables
  are not reusable for the canonical workflow.

## Local persistence evidence

- A fresh isolated PostgreSQL 16 database accepted the exact three-migration
  Next chain: baseline, student tenant scope and canonical learning schema.
- All seven learning tables reported both `relrowsecurity=true` and
  `relforcerowsecurity=true`.
- The application role reported `rolsuper=false`, `rolcreaterole=false`,
  `rolcreatedb=false` and `rolbypassrls=false`.
- Adversarial synthetic checks rejected missing context, cross-tenant access,
  non-participant chat writes, student grade writes, duplicate message commands
  and cross-scope submissions. Draft grades remained hidden until publication.
- This is local SQL/runtime evidence. It does not prove Payload CLI migration
  bookkeeping, a rendered campus flow, staging or production deployment.

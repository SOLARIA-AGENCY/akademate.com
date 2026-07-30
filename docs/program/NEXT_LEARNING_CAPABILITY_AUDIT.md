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

These commits are domain/infrastructure foundations. They do not yet prove a
rendered teacher portal, student delivery, gradebook or live chat.

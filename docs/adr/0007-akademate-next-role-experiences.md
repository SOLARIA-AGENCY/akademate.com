# ADR 0007: Akademate Next role experiences

Status: Accepted

## Context

Administrative staff, teachers and students all require authenticated access,
but they must not share the same navigation, privileges or data surface. The MVP
contains both an embedded campus in `tenant-admin` and an independent
`apps/campus`, plus partial LMS collections.

## Solution Registry

| Approach | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Canonical `apps/campus` with student and teacher shells | 9 | 9 | 9 | 7 | 9 | Selected |
| Keep student campus embedded in `tenant-admin` | 6 | 5 | 6 | 8 | 6 | Transitional only |
| Create a third dedicated teacher application | 8 | 6 | 8 | 3 | 4 | Rejected |

## Decision

- `apps/tenant-admin` is the backoffice for authorized administrative staff.
- `apps/campus` becomes the canonical learning application with distinct
  student and teacher shells.
- Student access is derived from active enrolment membership.
- Teacher access is derived from explicit course-run assignment, not a generic
  staff or tenant role.
- Shared modules, lessons, assignments, submissions, gradebook and messaging
  live in domain packages/APIs, never duplicated per shell.
- The embedded `/campus` routes remain transitional until parity tests pass,
  then redirect to the canonical campus.

## Required capabilities

Teachers prepare course content, publish lessons, create assignments, review
submissions, record attendance, grade with rubrics, return feedback and
communicate inside assigned course runs. Students consume lessons, submit work,
see published feedback/grades and communicate only inside authorized academic
contexts. Administrative staff manage operations without automatically reading
private course conversations.

## Communication boundary

Chat is durable and tenant-scoped. Every conversation has explicit members and
an academic context such as course run, enrolment, assignment or support case.
Realtime delivery is transport only; membership is re-authorized server-side
against durable state on subscribe and write. Moderation, retention, reporting,
attachments and audit events are part of the contract.

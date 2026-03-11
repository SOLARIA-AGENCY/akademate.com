---
phase: quick-2
plan: 02
wave: 2a
subsystem: api
tags: [api-keys, rest-api, v1, multi-tenant, payload-cms]
dependency_graph:
  requires:
    - quick-2/wave1 (lib/apiKeyAuth.ts, ApiKeys collection, middleware)
  provides:
    - /api/v1/me
    - /api/v1/courses
    - /api/v1/courses/:id
    - /api/v1/students
    - /api/v1/enrollments
    - /api/v1/analytics
  affects:
    - middleware.ts (reads x-api-bearer-token header)
tech_stack:
  added: []
  patterns:
    - requireV1Auth helper returning discriminated union { ok: true, auth } | { ok: false, response }
    - Tenant isolation via where: { tenant: { equals: Number(tenantId) } }
    - offset-to-page conversion for Payload 1-indexed pagination
    - force-dynamic + nodejs runtime on all v1 routes
key_files:
  created:
    - apps/tenant-admin/lib/v1Auth.ts
    - apps/tenant-admin/app/api/v1/me/route.ts
    - apps/tenant-admin/app/api/v1/courses/route.ts
    - apps/tenant-admin/app/api/v1/courses/[id]/route.ts
    - apps/tenant-admin/app/api/v1/students/route.ts
    - apps/tenant-admin/app/api/v1/enrollments/route.ts
    - apps/tenant-admin/app/api/v1/analytics/route.ts
  modified: []
decisions:
  - "PATCH /courses/:id strips 'tenant' from body to prevent tenant hijacking"
  - "POST /students validates email presence before Payload create call"
  - "POST /enrollments maps studentId/courseRunId to Payload field names student/course_run"
  - "/api/v1/analytics fetches enrollments limit:1000 to compute completion_rate in memory (acceptable for current scale)"
metrics:
  duration: "~8 min"
  completed: "2026-03-11"
  tasks_completed: 1
  files_created: 7
---

# Phase quick-2 Plan 02 (Wave 2a): /api/v1 REST Endpoints Summary

**One-liner:** 7-file REST layer under /api/v1 secured by scope-checked API keys with per-tenant data isolation.

## What Was Built

### lib/v1Auth.ts — Auth helper

`requireV1Auth(request, scope)` centralises all auth logic for v1 routes:
- Reads `x-api-bearer-token` header (set by middleware) or falls back to raw `Authorization: Bearer`
- Delegates to `validateBearerToken` from wave-1
- Checks scope is present in the key's scopes array
- Returns a discriminated union: `{ ok: true, auth: ValidatedApiKey }` or `{ ok: false, response: NextResponse }`

### Route Handlers

| Route | Methods | Scope | Notes |
|-------|---------|-------|-------|
| `/api/v1/me` | GET | any | Returns key name, scopes, tenant_id, rate_limit_per_day, created_at, last_used_at |
| `/api/v1/courses` | GET, POST | courses:read / courses:write | Paginated (limit/offset), tenant filter |
| `/api/v1/courses/:id` | GET, PATCH | courses:read / courses:write | Tenant guard on both read and write |
| `/api/v1/students` | GET, POST | students:read / students:write | POST validates email required |
| `/api/v1/enrollments` | GET, POST | enrollments:read / enrollments:write | POST body: { studentId, courseRunId } |
| `/api/v1/analytics` | GET | analytics:read | KPIs: total_students, total_courses, total_enrollments, active_enrollments, completion_rate |

### Response Schema

Success:
```json
{ "data": <object|array>, "total": 42, "limit": 20, "offset": 0 }
```

Error:
```json
{ "error": "Human readable message", "code": "MACHINE_CODE" }
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `apps/tenant-admin/lib/v1Auth.ts` exists
- [x] `apps/tenant-admin/app/api/v1/me/route.ts` exists
- [x] `apps/tenant-admin/app/api/v1/courses/route.ts` exists
- [x] `apps/tenant-admin/app/api/v1/courses/[id]/route.ts` exists
- [x] `apps/tenant-admin/app/api/v1/students/route.ts` exists
- [x] `apps/tenant-admin/app/api/v1/enrollments/route.ts` exists
- [x] `apps/tenant-admin/app/api/v1/analytics/route.ts` exists
- [x] Commit 3cf3e4e exists

## Self-Check: PASSED

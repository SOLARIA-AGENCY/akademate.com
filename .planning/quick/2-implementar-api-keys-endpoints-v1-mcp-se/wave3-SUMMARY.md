---
phase: quick-2
plan: 04
wave: 3
subsystem: api
tags: [openapi, mcp, chatgpt-actions, documentation]
key-files:
  created:
    - apps/tenant-admin/app/api/v1/openapi/route.ts
    - apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts
    - packages/mcp-server/package.json
    - packages/mcp-server/tsconfig.json
    - packages/mcp-server/src/index.ts
    - packages/mcp-server/README.md
  modified: []
decisions:
  - "OpenAPI spec hardcoded as JS object (not file-read) — simpler, no IO at request time, always valid JSON"
  - "CORS * on openapi.json and ai-plugin.json — required for ChatGPT and MCP clients to fetch without browser restrictions"
  - "MCP server uses StdioServerTransport — standard for Claude Desktop/Cursor integration"
  - "Client-side text filter for get_courses search param — avoids adding query complexity to the API tier"
  - "Workspace already has packages/* glob in root package.json — no modification needed"
metrics:
  completed: "2026-03-11"
  tasks: 5
  files: 6
  commit: 9acc3cc
---

# Wave 3 Plan 04: OpenAPI 3.1 Spec + ChatGPT Manifest + MCP Server

OpenAPI 3.1 spec, ChatGPT Actions manifest, and standalone MCP server package for connecting Claude Desktop and other MCP clients to the Akademate V1 API.

## Tasks Completed

| # | Task | Files | Commit |
|---|------|-------|--------|
| A1 | GET /api/v1/openapi.json — OpenAPI 3.1 spec | app/api/v1/openapi/route.ts | 9acc3cc |
| A2 | GET /.well-known/ai-plugin.json — ChatGPT manifest | app/.well-known/ai-plugin.json/route.ts | 9acc3cc |
| B1 | packages/mcp-server package.json + tsconfig.json | packages/mcp-server/{package.json,tsconfig.json} | 9acc3cc |
| B2 | MCP Server src/index.ts — 6 tools + 2 resources | packages/mcp-server/src/index.ts | 9acc3cc |
| B3 | README.md — integration guide for Claude Desktop / Cursor / Continue.dev | packages/mcp-server/README.md | 9acc3cc |

## Artifacts

### GET /api/v1/openapi.json
- Public endpoint (no auth required)
- OpenAPI 3.1.0 valid JSON
- Documents all 8 endpoint operations: GET+POST /courses, GET+PATCH /courses/{id}, GET+POST /students, GET+POST /enrollments, GET /analytics, GET /me
- Complete schemas: Course, Student, Enrollment, Analytics, ApiKeyInfo, ApiError, PaginatedMeta
- Security scheme: `bearerAuth` (HTTP Bearer)
- CORS `Access-Control-Allow-Origin: *` + `Cache-Control: public, max-age=3600`

### GET /.well-known/ai-plugin.json
- Public endpoint (no auth required)
- ChatGPT Actions / OpenAI plugin manifest v1
- Points to `https://app.akademate.com/api/v1/openapi.json`
- Auth type: `service_http` bearer
- CORS `*` + `Cache-Control: public, max-age=86400`

### packages/mcp-server
- Package: `@akademate/mcp-server` v0.1.0
- Runtime: Node.js ESM, TypeScript target ES2022 / module Node16
- Dependency: `@modelcontextprotocol/sdk ^1.0.0` (workspace has override at 1.25.2)
- Transport: StdioServerTransport (compatible with all major MCP clients)

**Tools (6):**
- `get_courses` — list courses, optional text filter (client-side)
- `get_course` — detail by ID
- `get_students` — list students
- `get_analytics` — dashboard KPIs
- `create_enrollment` — POST to /api/v1/enrollments
- `get_schedule` — upcoming course runs (via /api/v1/courses)

**Resources (2):**
- `akademate://courses` — course catalog (first 100)
- `akademate://students` — student list (first 100)

**Config:** `AKADEMATE_API_URL` + `AKADEMATE_API_KEY` env vars

## Deviations from Plan

None — plan executed exactly as written.

The root `package.json` already had `packages/*` in the `workspaces` array, so no modification was needed (constraint satisfied).

## Self-Check

- FOUND: apps/tenant-admin/app/api/v1/openapi/route.ts
- FOUND: apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts
- FOUND: packages/mcp-server/package.json
- FOUND: packages/mcp-server/tsconfig.json
- FOUND: packages/mcp-server/src/index.ts
- FOUND: packages/mcp-server/README.md
- FOUND commit: 9acc3cc

## Self-Check: PASSED

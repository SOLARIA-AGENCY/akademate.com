# Akademate.com — Pre-Deployment Audit Report

**Date:** 2026-02-12
**Auditor:** Claude Code (Autonomous Multi-Agent Supervisor — Opus 4.6)
**Previous Audit:** 7.0/10 (Dec 2025)
**Branch:** main (commit `1e19715`)
**Files audited:** 1,271 TS/TSX across 7 apps + 16 packages

---

## Executive Summary

- **Previous score:** 7.0/10
- **Current score:** 5.5/10
- **Total gaps found:** 28
- **Blockers for deployment:** 4
- **Critical issues:** 4
- **High issues:** 10
- **GO/NO-GO:** **NO-GO** — 4 blockers and 4 critical issues must be resolved before production deployment

Despite significant progress since Dec 2025 (tests grew from 354 to 895, RLS policies comprehensive, Stripe billing fully wired), the platform has critical security vulnerabilities, broken infrastructure, and key functional gaps that make production deployment unsafe.

---

## Track A: Static Analysis

### AUD-01: TypeScript Errors

**Total: 3 errors** (all in test/mock files)

| Error | File | Line |
|-------|------|------|
| TS1128 | `apps/web/__mocks__/fixtures.ts` | 61 |
| TS1005 | `apps/web/e2e/home-page.spec.ts` | 24 |
| TS1135 | `vitest.workspace.config.ts` | 20 |

**Verdict:** Production source compiles cleanly. LOW severity.

### AUD-02: ESLint Issues

**Total measurable: 752+ errors, 0 warnings.** Full monorepo lint OOMs (heap limit ~2GB exceeded).

| Scope | Errors |
|-------|--------|
| apps/web | 73 |
| apps/campus | 476 |
| packages (api, auth, db, lms, leads) | 203 |
| apps/tenant-admin | OOM (too large to lint) |

**Verdict:** CI will fail with `--max-warnings=0`. Needs heap increase or split config. HIGH severity.

### AUD-03: Type Safety Escapes

| Directive | Count |
|-----------|-------|
| `as any` | **389** (98.7% in tenant-admin) |
| `@ts-ignore` | 0 |
| `@ts-expect-error` | 0 |

**Top 5 offenders:**
1. `apps/tenant-admin/app/api/lms/lessons/[id]/route.ts` — 22
2. `apps/tenant-admin/app/api/billing/payment-methods/__tests__/route.test.ts` — 20
3. `apps/tenant-admin/app/api/billing/subscriptions/[id]/__tests__/route.test.ts` — 19
4. `apps/tenant-admin/app/api/billing/subscriptions/__tests__/route.test.ts` — 18
5. `apps/tenant-admin/app/api/lms/enrollments/[id]/route.ts` — 15

**Root cause:** LMS collections referenced by string name (`'modules' as any`) not yet in Payload config.
**Verdict:** Increased from 50+ (Dec 2025) to 389. P0 TYPE-001 has **regressed**. HIGH severity.

### AUD-04: Dependency Health

**Vulnerabilities: 15 total**

| Severity | Count | Key Packages |
|----------|-------|--------------|
| Critical | 1 | `@payloadcms/drizzle` — **SQL injection** (< 3.73.0) |
| High | 4 | `next` (DoS), `@modelcontextprotocol/sdk`, `axios`, `fast-xml-parser` |
| Moderate | 10 | `lodash` (prototype pollution), `undici` x2, `hono` x4, `payload` (IDOR) |

**Version Splits:**

| Package | Issue |
|---------|-------|
| `zod` | **v3 / v4 split** — packages/types + apps/campus on v4, everything else on v3 |
| `vitest` | **v2 / v4 split** across workspace |
| `typescript` | Minor drift (^5.6.0 to ^5.9.3) — ranges overlap, acceptable |

**Verdict:** SQL injection in @payloadcms/drizzle is a **BLOCKER**. Zod v3/v4 split is HIGH risk for shared schemas.

### AUD-05: Dead Code

**9 of 15 packages have ZERO external consumers:**

| Package | Exported Symbols | Consumers |
|---------|-----------------|-----------|
| @akademate/catalog | 15 | 0 |
| @akademate/operations | 30+ | 0 |
| @akademate/lms | 40+ | 0 |
| @akademate/leads | 20+ | 0 |
| @akademate/reports | 7 | 0 |
| @akademate/imports | 10 | 0 |
| @akademate/notifications | 6 | 0 |
| @akademate/tenant | 6 | 0 |
| @akademate/db | 50+ | 0 (internal only) |

**Verdict:** 60% of packages may be dead code or pre-built for future. MEDIUM severity.

---

## Track B: Test Coverage

### AUD-06, AUD-07: Unit Test Coverage

**Results: 36 test files, 895 passed, 0 failed, 14 skipped**
**Coverage: 78.6% statements, 71.0% branches, 70.9% functions, 79.1% lines**

| App/Package | Test Files | Status |
|-------------|-----------|--------|
| tenant-admin | 65 | Good |
| admin-client | 6 | Moderate |
| campus | 6 | Moderate |
| portal | 1 | Minimal |
| web | 1 | Minimal |
| **ops** | **0** | **ZERO** |
| **payload** | **0** | **ZERO** |
| **packages/types** | **0** | **ZERO** |
| **packages/ui** | **0** | **ZERO** |

**Weak spots:** `jobs/src/gdpr/retention.ts` (14% stmts), `realtime/src/hooks/useSocket.ts` (0%), `realtime/src/server/createServer.ts` (33%).

### AUD-08: E2E Results

**14 E2E spec files, ~599 test blocks** across 8 app targets. Not executed (requires running apps).
Coverage is broad but has not been validated. CI E2E job is gated behind `${{ env.RUN_E2E == 'true' }}` — **disabled by default**.

### AUD-09: Fixture Quality

**Zero centralized fixtures or seeds.** Tests use inline mock data. No reusable test data infrastructure.

### AUD-10: Load Readiness

| Check | Status |
|-------|--------|
| DB connection pool | 20 max / 2 min (tenant-admin) |
| Redis | 256MB, allkeys-lru, maxRetries=3 |
| Container resource limits | **NONE** |
| Load test infrastructure | **NONE** |

**Verdict:** Capacity limits are unknown. No container constraints means one runaway service starves others. HIGH severity.

---

## Track C: Functional Gaps

| Flow | AUD | Status | Evidence | Severity |
|------|-----|--------|----------|----------|
| Tenant Registration | AUD-11 | **MISSING** | No registration endpoint exists anywhere in apps/. Table+resolution exist, zero creation flow | **CRITICAL** |
| Stripe Billing | AUD-12 | IMPLEMENTED | Checkout→webhook→activation fully wired. 7 event types with real DB mutations. UI 85% | Low |
| GDPR | AUD-13 | **PARTIAL** | Routes exist but `.catch(()=>({docs:[]}))` silently hides failures. Retention worker not wired | HIGH |
| Multitenancy/RLS | AUD-14 | IMPLEMENTED | RLS on 28 tables. `withTenantContext` wrapper. Resolution via subdomain/header/cookie | Low |
| Auth/MFA | AUD-15 | **PARTIAL** | JWT+RBAC coded. Login delegates to Payload CMS, not custom JWT. MFA has TOTP funcs but no enrollment endpoint, no enforcement | HIGH |
| Campus Virtual | AUD-16 | **PARTIAL** | Login+enrollment+progress OK. No certificate generation despite table+page existing | MEDIUM |
| BullMQ Workers | AUD-17 | **STUB** | Only factory functions. Zero actual processor implementations. No Redis config. No startup script | HIGH |
| Feature Flags | AUD-18 | IMPLEMENTED | Full API with plan gating, % rollout, per-tenant overrides | Low |

**Summary:** 3 IMPLEMENTED, 4 PARTIAL/STUB, 1 MISSING. The missing tenant registration flow means no onboarding path exists.

---

## Track D: Docker & Infrastructure

### AUD-19: Dockerfile Audit

All 3 Dockerfiles (payload, web, admin) use proper multi-stage builds, non-root users, and `node:22-alpine`.

**BLOCKER:** `curl` is NOT installed in any Alpine runner stage. All docker-compose healthchecks use `CMD curl -f ...` and will **fail permanently**.

### AUD-20: docker-compose Analysis

| Service | Healthcheck | Issue |
|---------|------------|-------|
| postgres | `pg_isready` | PASS |
| redis | `redis-cli ping` | PASS |
| payload | `curl /api/health` | **FAIL** (no curl, no endpoint) |
| web | `curl /` | **FAIL** (no curl) |
| admin | `curl /` | **FAIL** (no curl) |
| nginx | none | **MISSING** |
| certbot | none | Acceptable |

**Additional issues:**
- Hardcoded `POSTGRES_PASSWORD: akademate_dev_2025` (line 18)
- Postgres/Redis ports exposed to host (should be internal-only in production)
- web/admin `depends_on: payload` lacks `condition: service_healthy`

### AUD-21: Health Endpoints

| Service | Target | Exists? |
|---------|--------|---------|
| payload (3003) | `/api/health` | **NO** — only socket server has `/health` on different port |
| web (3006) | `/` | Page check only, no dedicated health route |
| admin (3004) | `/` | Referenced in middleware exclusion but no actual handler |
| tenant-admin | `/api/health` | YES — only proper health endpoint (not in compose) |

### AUD-22: nginx Configuration

**PASS:** Security headers, rate limiting zones (api:30r/s, web:50r/s), gzip, upstream definitions match ports, TLSv1.2+1.3, proxy headers.

**FAIL:**
- CORS `Access-Control-Allow-Origin: $http_origin` reflects ANY origin with credentials=true
- No HSTS header
- Wildcard tenant subdomain may match admin/api subdomains if order-dependent

---

## Track E: Security

### AUD-23: Secrets Scan

| Finding | Severity |
|---------|----------|
| Hardcoded creds in `infra/solaria-digital-field--operations/docker-compose.single.yml` (DB passwords, JWT secret) | CRITICAL |
| S3 fallback to `minioadmin/minioadmin` in `apps/admin-client/lib/s3.ts:28-29` | MEDIUM |
| `.gitignore` correctly excludes `.env` files. No `.env` committed | PASS |

### AUD-24: PAYLOAD_SECRET

**BLOCKER:** Three config files fall back to weak plaintext strings if env var is unset:
- `apps/payload/payload.config.ts:605` → `'development-secret-change-me'`
- `apps/tenant-admin/src/payload.config.ts:109` → `'YOUR_SECRET_HERE'`
- `apps/campus/payload.config.ts:12` → `'your-secret-key'`

Four campus API routes fall back to `'campus-secret-key-change-in-production'` for `CAMPUS_JWT_SECRET`.

**Impact:** If env vars are not set in production, JWTs can be forged with publicly known secrets.

### AUD-25: Cookie Security

| Finding | Severity |
|---------|----------|
| Tenant cookie: httpOnly=true, secure=prod, sameSite=lax | PASS |
| Admin token in JS-readable cookie (`js-cookie` in `apps/admin-client/providers/RealtimeProvider.tsx:34`) | HIGH |
| Tenant-admin token in `localStorage` (`apps/tenant-admin/lib/auth.ts:10`) | HIGH |

**Impact:** XSS vulnerability allows immediate token exfiltration from admin and tenant-admin apps.

### AUD-26: Rate Limiting

| Component | Status |
|-----------|--------|
| Application-layer (`packages/api/src/middleware/rateLimit.ts`) | PASS — real implementation with Redis + presets |
| Nginx (`nginx.conf:48-49`) | PASS — api:30r/s, web:50r/s with burst |
| Solaria dashboard (`dashboard/server.js:57`) | FAIL — disabled |

### AUD-27: CORS

| Finding | Severity |
|---------|----------|
| nginx reflects `$http_origin` + `credentials=true` (default.conf:108) | **CRITICAL** |
| tenant-admin falls back to `*` when no Origin header (middleware.ts:184) | MEDIUM |
| Solaria Socket.IO `cors: { origin: "*" }` (server.js:33) | HIGH |

---

## Track F: Documentation Accuracy

### AUD-28: TASKS_TODO.md Verification

All 44 items marked `[x]`. Of 12 sampled claims:

| Verdict | Count |
|---------|-------|
| TRUE | 2 (MFA TOTP for ops, Feature flags) |
| PARTIAL | 7 (GDPR, RLS hooks, Workers, OTEL, Ops dashboard, Campus, Test coverage) |
| FALSE | 3 (E2E in CI, Security scan, shadcn/ui) |

**TASKS_TODO.md is unreliable as a progress indicator.**

### AUD-29: Previous Audit Remediation (Dec 2025)

| P0/P1 Issue | Fixed? | Evidence |
|-------------|--------|----------|
| SEC-001: Secrets in repo | PARTIAL | No .env committed, but docker-compose has hardcoded password |
| SEC-002: RLS not verified | TRUE | 30 comprehensive RLS policies verified |
| TYPE-001: 50+ `as any` | **FALSE — REGRESSED** | Now 389 occurrences (was 50+) |
| DEP-001: Version inconsistencies | UNVERIFIED | Not addressed in STATUS_REPORT |
| TEST-001: Coverage gaps | PARTIAL | 895 tests (up from 354), but 4 modules still at 0 |

### AUD-30: ADR Compliance

| ADR | Decision | Compliant? |
|-----|----------|-----------|
| 0001 Multitenancy | RLS + tenant_id + domain resolution | PARTIAL — policies are SQL files, not in migrations |
| 0002 Auth | JWT + httpOnly + no DEV_AUTH_BYPASS | PARTIAL — DEV_AUTH_BYPASS still in code |
| 0003 Storage | R2/MinIO + presigned uploads | PARTIAL — no MinIO in docker-compose, namespace not enforced |
| 0004 UI Kit | shadcn/ui centralized | **FALSE** — packages/ui has 1 component, no shadcn |
| 0005 CI/CD | lint/test/build per PR | PARTIAL — E2E and security gated off by default |

### AUD-31: Scripts

| Script | Verdict |
|--------|---------|
| `deploy.sh` | PARTIAL — functional but fragile env loading (`export $(grep...)` breaks on spaces), no rollback |
| `backup.sh` | PARTIAL — works but no integrity verification (no checksum, no test-restore) |

---

## Prioritized Gap List

| # | Gap | Severity | Track | Effort | Blocks Deploy |
|---|-----|----------|-------|--------|--------------|
| 1 | SQL injection in `@payloadcms/drizzle` < 3.73.0 | BLOCKER | A | 1h (upgrade) | YES |
| 2 | PAYLOAD_SECRET weak fallback strings in 3 configs | BLOCKER | E | 2h (throw on missing) | YES |
| 3 | Healthchecks broken — curl not in Alpine images | BLOCKER | D | 1h (use wget or install curl) | YES |
| 4 | Payload has no `/api/health` endpoint | BLOCKER | D | 2h (create route) | YES |
| 5 | Nginx CORS reflects any origin + credentials=true | CRITICAL | E | 2h (whitelist domains) | YES |
| 6 | Tenant registration flow MISSING entirely | CRITICAL | C | 2-3d (full feature) | YES (no onboarding) |
| 7 | Hardcoded DB password in docker-compose.yml | CRITICAL | D | 1h (use env var) | YES |
| 8 | Hardcoded creds in Solaria docker-compose | CRITICAL | E | 1h (move to .env) | YES |
| 9 | Auth tokens in JS-accessible storage (XSS risk) | HIGH | E | 1d (httpOnly cookies) | Conditional |
| 10 | CAMPUS_JWT_SECRET weak fallback in 4 routes | HIGH | E | 2h (throw on missing) | Conditional |
| 11 | BullMQ workers are stubs — no real processors | HIGH | C | 2-3d (implement) | Conditional |
| 12 | MFA not enforced in any login flow | HIGH | C | 1d (wire to login) | Conditional |
| 13 | GDPR export silently swallows errors (.catch) | HIGH | C | 1d (proper error handling) | Conditional |
| 14 | 389 `as any` assertions (regressed from 50+) | HIGH | A | 2-3d (proper types) | No |
| 15 | 752+ ESLint errors, OOM on full lint | HIGH | A | 1d (fix + heap config) | No |
| 16 | Zod v3/v4 split across workspace | HIGH | A | 1d (standardize) | Conditional |
| 17 | 4 modules with 0 tests (ops, payload, types, ui) | HIGH | B | 2d (basic coverage) | No |
| 18 | Zero container resource limits in docker-compose | HIGH | B | 2h (add limits) | Conditional |
| 19 | No HSTS header in nginx | HIGH | D | 30min (add header) | Conditional |
| 20 | DEV_AUTH_BYPASS still referenced in code | HIGH | F | 2h (remove or guard) | Conditional |
| 21 | Campus: no certificate generation | MEDIUM | C | 1d (implement) | No |
| 22 | Zero centralized test fixtures/seeds | MEDIUM | B | 1d (create fixtures) | No |
| 23 | 9/15 packages have zero consumers | MEDIUM | A | 1d (audit + prune) | No |
| 24 | E2E and security CI jobs disabled by default | MEDIUM | F | 2h (enable) | Conditional |
| 25 | ADR-0004 (UI kit) not implemented | MEDIUM | F | 2-3d (build out) | No |
| 26 | RLS policies not in Drizzle migrations | MEDIUM | F | 1d (add migration) | Conditional |
| 27 | Backup script: no integrity verification | MEDIUM | F | 4h (add checksums) | No |
| 28 | Deploy script: fragile env loading | LOW | F | 2h (fix parser) | No |

---

## Remediation Order

### Phase 0: Blockers (must fix before ANY deployment)
1. **Upgrade `@payloadcms/drizzle`** to >= 3.73.0 (SQL injection fix)
2. **Replace PAYLOAD_SECRET fallbacks** with `throw new Error()` on missing env var in all 3 configs
3. **Fix healthchecks**: Install `curl` in Dockerfile runner stages OR switch to `wget -q --spider`
4. **Create `/api/health` endpoint** in `apps/payload/`

### Phase 1: Critical Security (before public access)
5. **Fix nginx CORS** — replace `$http_origin` with explicit allowed origins list
6. **Remove hardcoded passwords** from docker-compose.yml and Solaria configs
7. **Fix CAMPUS_JWT_SECRET fallbacks** — same pattern as PAYLOAD_SECRET
8. **Move auth tokens to httpOnly cookies** (admin-client + tenant-admin)

### Phase 2: Functional Gaps (before customer onboarding)
9. **Build tenant registration flow** (endpoint + DB creation + config + first user)
10. **Implement BullMQ worker processors** (email, webhook, search sync)
11. **Wire MFA challenge to login flow** (at least for ops role)
12. **Fix GDPR error handling** — replace `.catch(()=>{})` with proper error propagation

### Phase 3: Quality & Compliance (before scale)
13. Standardize zod to v4 across workspace
14. Reduce `as any` count (create LMS Payload collections)
15. Fix ESLint errors + OOM issue
16. Add container resource limits
17. Enable E2E and security CI jobs
18. Add HSTS header to nginx
19. Remove DEV_AUTH_BYPASS references

---

## GO/NO-GO Decision

### **NO-GO**

**Justification:**

Akademate.com has made genuine progress since Dec 2025 — test count grew from 354 to 895, RLS policies are comprehensive, Stripe billing is fully functional, and the core architecture (multitenancy, feature flags) is solid. However, the platform is **not safe to deploy to production** due to:

1. **4 Blockers** that would cause immediate operational or security failures:
   - SQL injection vulnerability in the ORM layer
   - PAYLOAD_SECRET can silently fall back to publicly known strings
   - Docker healthchecks are universally broken
   - Primary backend (Payload) has no health endpoint

2. **4 Critical issues** that expose the platform to active exploitation:
   - CORS allows any origin to make authenticated requests
   - Database credentials hardcoded in committed files
   - No tenant onboarding path exists

3. **Documentation unreliability**: TASKS_TODO.md claims 100% completion, but verification shows 2/12 TRUE, 7/12 PARTIAL, 3/12 FALSE. The P0 `as any` issue has regressed from 50+ to 389. Trust in project status claims is low.

### Conditional GO Path

If the 4 blockers and 4 critical issues (items 1-8 in remediation order) are resolved, a **limited beta deployment** with trusted tenants could proceed, with items 9-12 completed within the first 2 weeks. Full production deployment requires completing through Phase 2 minimum.

**Estimated effort to reach Conditional GO:** 3-5 developer-days.
**Estimated effort to reach full production readiness:** 3-4 developer-weeks.

---

*Generated: 2026-02-12 by Claude Code (Opus 4.6)*
*Project: Akademate.com v0.0.1 | Owner: SOLARIA Agency (C-BIAS ENTERPRISES)*
*Audit method: 6-track parallel agent analysis with Vibe Kanban supervision*

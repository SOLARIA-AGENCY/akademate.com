# Akademate Architecture Overview

**Version:** 1.0.0
**Last Updated:** December 2025
**Status:** Production-Ready with Remediation

---

## Executive Summary

Akademate is a multi-tenant SaaS platform for training institutions. The architecture follows a monorepo structure with clear separation between applications, shared packages, and infrastructure.

| Metric | Value |
|--------|-------|
| Apps | 7 |
| Packages | 12 |
| Unit Tests | 641 |
| E2E Tests | 44 |
| Quality Score | 7.0/10 |

---

## System Architecture

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                      INTERNET                           │
                                    └───────────────────────────┬─────────────────────────────┘
                                                                │
                                    ┌───────────────────────────▼─────────────────────────────┐
                                    │                    LOAD BALANCER                        │
                                    │               (Nginx / Cloudflare)                      │
                                    └───────────────────────────┬─────────────────────────────┘
                                                                │
                    ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
                    │                                           │                                           │
        ┌───────────▼───────────┐               ┌───────────────▼───────────────┐           ┌───────────────▼───────────────┐
        │   @akademate/web      │               │   @akademate/portal           │           │   @akademate/admin-client     │
        │   Public Website      │               │   Tenant Portal               │           │   SaaS Admin Dashboard        │
        │   :3006               │               │   :3002                       │           │   :3001                       │
        └───────────┬───────────┘               └───────────────┬───────────────┘           └───────────────┬───────────────┘
                    │                                           │                                           │
                    │               ┌───────────────────────────┼───────────────────────────┐               │
                    │               │                           │                           │               │
                    │   ┌───────────▼───────────┐   ┌───────────▼───────────┐   ┌───────────▼───────────┐   │
                    │   │   @akademate/payload  │   │  @akademate/campus    │   │ @akademate/tenant-admin│   │
                    │   │   API + CMS           │   │  Student Campus       │   │  Academy Dashboard    │   │
                    │   │   :3003               │   │  :3005                │   │  :3009                │   │
                    │   └───────────┬───────────┘   └───────────┬───────────┘   └───────────┬───────────┘   │
                    │               │                           │                           │               │
                    └───────────────┼───────────────────────────┼───────────────────────────┼───────────────┘
                                    │                           │                           │
                    ┌───────────────▼───────────────────────────▼───────────────────────────▼───────────────┐
                    │                              SHARED PACKAGES LAYER                                    │
                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
                    │  │   api   │ │api-client│ │  auth   │ │ catalog │ │   db    │ │  jobs   │ │  leads  │ │
                    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                         │
                    │  │   lms   │ │operations│ │ tenant  │ │  types  │ │   ui    │                         │
                    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                         │
                    └───────────────────────────────────────────┬───────────────────────────────────────────┘
                                                                │
                    ┌───────────────────────────────────────────▼───────────────────────────────────────────┐
                    │                               DATA LAYER                                              │
                    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
                    │  │   PostgreSQL    │  │     Redis       │  │    R2/MinIO     │  │     BullMQ      │  │
                    │  │   (Primary DB)  │  │   (Cache/Queue) │  │   (File Storage)│  │   (Job Queue)   │  │
                    │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
                    └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Architecture

### Domain Packages

| Package | Description | Dependencies | Tests |
|---------|-------------|--------------|-------|
| `@akademate/catalog` | Course catalog management | db | 47 |
| `@akademate/leads` | Lead management & scoring | db | 23 |
| `@akademate/operations` | Enrollments, calendar, attendance | db | - |
| `@akademate/lms` | Learning management system | db | - |

### Infrastructure Packages

| Package | Description | Dependencies | Tests |
|---------|-------------|--------------|-------|
| `@akademate/db` | Drizzle ORM schema & migrations | drizzle-orm | 58 |
| `@akademate/api` | REST API utilities, GDPR, rate limiting | types | 186 |
| `@akademate/auth` | JWT, sessions, password hashing | types | 45 |
| `@akademate/tenant` | Multi-tenant resolution & context | types | 25 |
| `@akademate/jobs` | BullMQ job definitions | types | 8 |

### Shared Packages

| Package | Description | Dependencies | Tests |
|---------|-------------|--------------|-------|
| `@akademate/types` | TypeScript types & Zod schemas | zod | 111 |
| `@akademate/ui` | UI components (shadcn/ui based) | react | - |
| `@akademate/api-client` | Multi-tenant API SDK | types | 20 |

### Package Dependency Graph

```
                          ┌─────────────┐
                          │   @types    │
                          └──────┬──────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─────────┐             ┌─────────┐             ┌─────────┐
   │   db    │             │   api   │             │  auth   │
   └────┬────┘             └────┬────┘             └────┬────┘
        │                       │                       │
        │         ┌─────────────┼─────────────┐        │
        │         │             │             │        │
        ▼         ▼             ▼             ▼        ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ catalog │ │  leads  │ │operations│ │   lms   │ │ tenant  │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## Multi-Tenancy Architecture

### Tenant Resolution Strategy

```
Request → [X-Tenant-ID Header] → [Cookie] → [Subdomain] → [Custom Domain]
                 ↓                  ↓            ↓               ↓
            API calls         Sessions      demo.akademate.io  custom.com
```

### Database Isolation

- **Strategy:** Row-Level Security (RLS) with `tenant_id` column
- **Schema:** Shared tables with tenant isolation via policies
- **Indexing:** All queries filtered by `tenant_id` first

```sql
-- Example RLS policy
CREATE POLICY tenant_isolation ON courses
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Tenant Context Flow

```typescript
// packages/tenant/src/middleware.ts
export async function tenantMiddleware(req, res, next) {
  const resolution = getFullTenantResolution(req.headers)
  if (!resolution.isValid) {
    return res.status(400).json({ error: 'Tenant required' })
  }
  req.tenantId = resolution.tenantId
  next()
}
```

---

## Application Architecture

### Apps Overview

| App | Purpose | Framework | Port |
|-----|---------|-----------|------|
| `web` | Public marketing site | Next.js 15 | 3006 |
| `portal` | Tenant student portal | Next.js 15 | 3002 |
| `admin-client` | SaaS administration | Next.js 15 | 3001 |
| `tenant-admin` | Academy management | Next.js 15 | 3009 |
| `campus` | Student LMS | Next.js 15 | 3005 |
| `payload` | CMS + API backend | Payload 3 | 3003 |
| `ops` | Operations dashboard | Next.js 15 | - |

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  Login  │────▶│  Auth   │────▶│   JWT   │
└─────────┘     └─────────┘     │ Package │     │  Token  │
                                └─────────┘     └────┬────┘
                                                     │
                                                     ▼
                                               ┌─────────┐
                                               │ Session │
                                               │ (Redis) │
                                               └─────────┘
```

---

## Data Architecture

### Core Schema Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                          TENANT                                 │
│  id, slug, name, settings, branding, plan_id                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │    COURSES      │     │     LEADS       │
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │ tenant_id (FK)  │
│ role, email     │     │ title, price    │     │ email, status   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   COURSE_RUNS   │              │
         │              │ start, end, seats│             │
         │              └────────┬────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   ENROLLMENTS   │
                        │ user_id, run_id │
                        │ status, paid    │
                        └─────────────────┘
```

### GDPR Data Handling

- **Article 5:** Data minimization in collection
- **Article 7:** Consent tracking with `consent_logs` table
- **Article 15:** Data export via `GDPRExportService`
- **Article 17:** Right to erasure via `GDPRDataDeletionService`

---

## Security Architecture

### Authentication

- **Method:** JWT + Session tokens
- **Storage:** Redis for sessions, HTTPOnly cookies for tokens
- **Password:** Argon2id hashing (via `@akademate/auth`)

### Authorization

- **Model:** Role-Based Access Control (RBAC)
- **Roles:** `super_admin`, `admin`, `manager`, `user`, `student`
- **Granularity:** Tenant-scoped permissions

### Rate Limiting

```typescript
// packages/api/src/rateLimit.ts
export const rateLimiters = {
  api: new RateLimiter({ max: 100, window: '1m' }),
  auth: new RateLimiter({ max: 5, window: '15m' }),
  upload: new RateLimiter({ max: 10, window: '1h' }),
}
```

---

## Testing Architecture

### Test Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  44 tests
                    │ (Playwright)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Integration │  ~100 tests
                    │   Tests     │
                    └──────┬──────┘
                           │
            ┌──────────────▼──────────────┐
            │        Unit Tests           │  541 tests
            │         (Vitest)            │
            └─────────────────────────────┘
```

### Test Commands

```bash
# Unit tests
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode

# E2E tests
pnpm test:e2e          # Run all E2E tests
pnpm test:e2e:web      # Web portal only
pnpm test:e2e:admin    # Admin client only
pnpm test:e2e:mobile   # Mobile viewport
pnpm test:e2e:ui       # Interactive UI mode
```

---

## Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      Hetzner Cloud                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Nginx     │  │  Node.js    │  │  PostgreSQL │             │
│  │ (Reverse    │──│  Apps       │──│  16         │             │
│  │  Proxy)     │  │  (PM2)      │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Redis     │  │   R2/MinIO  │  │   BullMQ    │             │
│  │  (Cache)    │  │  (Storage)  │  │  (Workers)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
[Push] → [Lint/Type Check] → [Unit Tests] → [E2E Tests] → [Build] → [Deploy]
```

---

## Related Documentation

- [Multitenancy ADR](./adr/0001-multitenancy.md)
- [Authentication ADR](./adr/0002-auth.md)
- [Storage ADR](./adr/0003-storage.md)
- [UI Kit ADR](./adr/0004-ui-kit.md)
- [CI/CD ADR](./adr/0005-ci-cd.md)
- [Audit Report December 2025](./AUDIT_REPORT_DIC2025.md)
- [Project Milestones](./PROJECT_MILESTONES.md)

---

## Appendix: Quick Reference

### Development Commands

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Run tests
pnpm test
pnpm test:e2e

# Database
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio

# Linting
pnpm lint
pnpm format
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `S3_ENDPOINT` | R2/MinIO endpoint | Yes |
| `S3_ACCESS_KEY` | Storage access key | Yes |
| `S3_SECRET_KEY` | Storage secret key | Yes |

---

*Generated: December 2025*
*Akademate v0.0.1*

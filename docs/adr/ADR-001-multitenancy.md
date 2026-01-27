# ADR-001: Multi-tenancy Strategy

**Status:** Accepted
**Date:** 2026-01-27
**Decision Makers:** Engineering Team

## Context

Akademate.com is a SaaS LMS platform serving multiple training institutions (tenants). Each tenant requires:

- Complete data isolation from other tenants
- Customizable branding and configuration
- Independent user management
- Shared infrastructure for cost efficiency

We needed to decide on a multi-tenancy architecture that balances security, performance, and operational complexity.

## Decision

We chose **Row-Level Security (RLS)** implemented at the application layer via Payload CMS Access Control.

### Implementation Details

1. **Tenant Identification**
   - Each resource has a `tenant` field (UUID foreign key)
   - Tenant resolved via: subdomain → `x-tenant-id` header → domain mapping

2. **Access Control Layer** (`apps/payload/access/tenantAccess.ts`)
   ```typescript
   export const readOwnTenant: Access = ({ req }) => {
     if (isSuperadmin(user)) return true;
     return { tenant: { in: getUserTenantIds(user) } };
   };
   ```

3. **Automatic Tenant Injection** (`apps/payload/hooks/injectTenantId.ts`)
   - `beforeValidate` hook automatically sets tenant on create
   - Prevents tenant manipulation on update

4. **Role Hierarchy**
   | Role | Scope | Capabilities |
   |------|-------|--------------|
   | SUPERADMIN | Global | All tenants, system config |
   | ADMIN | Tenant | Full tenant access |
   | GESTOR | Tenant | CRUD operations |
   | MARKETING | Tenant | Campaigns, leads |
   | ASESOR | Tenant | Students, enrollments |
   | LECTURA | Tenant | Read-only access |

## Alternatives Considered

### 1. Database-per-Tenant
- **Pros:** Complete isolation, independent scaling
- **Cons:** Complex migrations, high operational overhead, expensive
- **Rejected:** Operational complexity too high for current scale

### 2. Schema-per-Tenant (PostgreSQL schemas)
- **Pros:** Good isolation, shared infrastructure
- **Cons:** Complex connection pooling, migration complexity
- **Rejected:** Payload CMS doesn't natively support dynamic schemas

### 3. Row-Level Security (Chosen)
- **Pros:** Simple queries, shared indexes, easy backup/restore
- **Cons:** Requires careful access control, no database-level isolation
- **Accepted:** Best balance of simplicity and security for our scale

## Consequences

### Positive
- Single database simplifies operations and backups
- Shared indexes improve query performance
- Easy to add new tenants (just create tenant record)
- Payload CMS Access Control provides declarative security

### Negative
- Requires disciplined access control in all collections
- Potential for cross-tenant data leaks if hooks/access misconfigured
- Query performance may degrade with very large tenant counts

### Mitigations
- Comprehensive unit tests for all access functions
- Automated security audits for tenant isolation
- Database indexes on `tenant` field for all collections

## Verification

Run tenant isolation tests:
```bash
pnpm exec vitest run apps/payload/access
```

## References

- `apps/payload/access/tenantAccess.ts` - Access control functions
- `apps/payload/hooks/injectTenantId.ts` - Tenant injection hooks
- `docs/INFORME_SAAS_MULTITENANT_ENTERPRISE.md` - Full architecture docs

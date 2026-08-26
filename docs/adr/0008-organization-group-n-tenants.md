# 0008 — OrganizationGroup + N tenants

- Status: Accepted (domain contract). Schema/data split deferred.
- Date: 2026-08-26
- Product successor to ADR 0006 / legal-entity-inside-tenant shadow for the commercial model.
- Complements: campus_kind physical/virtual remains a location discriminator inside a tenant.

## Context

An Akademate account can operate N legal entities. Each entity needs its own accounting, billing, enrollments, and campus. A sede (physical or virtual) is not a tenant. Five entities at CEP is one Enterprise example, not a platform constant.

The existing `packages/tenant` multi-entity shadow models `legalEntityId` under one `tenantId`. That evidence layer is not the product model.

## Decision

- `OrganizationGroup` holds plan, deployment, `tenantSeats`, SSO, branding, and consolidated reporting. It is not an academic tenant.
- `Tenant[N]` = one legal entity. Journals and enrollments require `tenantId` NOT NULL.
- `Location { kind: physical | virtual }` does not consume a seat.
- Shared Person + memberships/engagements. Cross-tenant resources use `ResourceGrant`.
- Included seats = 1 on starter/pro/enterprise. Extra tenants are sold as **Entidad adicional**.
- Onboarding asks “¿misma razón social?” to choose Location vs new tenant seat.
- No `if tenantId === 1`. No group-level journal.

## Consequences

- Domain module: `packages/tenant/src/organization-account.ts`. Billing limit: `PlanSchema.limits.tenantSeats`.
- Do not mix this contract into a mega-commit of unrelated SaaS dirty files.
- Data split of an existing single-tenant academy is a later canary, not this wave.

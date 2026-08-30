# 0016. Foundation P0 canonical core

- Status: Accepted
- Date: 2026-08-28
- Spec: AKADEMATE-MASTER-ARCHITECTURE-2026-08-28.md sections 2, 5, 21, 23, 27.2, ADR-004/005/006/010

## Context

The monorepo had a tenant row, a global user row and a membership join, plus a parallel Payload integer schema used by tenant-admin. Plan, deployment, blueprint and organization model were collapsed into `tenants.plan`. Feature flags doubled as product switches. There was no Account/OrganizationGroup, LegalEntity, ActorContext or cell metadata.

Better Auth already owns the table `accounts` (OAuth). That name cannot mean OrganizationGroup.

## Decision

Evolve `packages/db` as the transactional core.

- New table `organization_groups` for Account/OrganizationGroup. Do not reuse `accounts`.
- Evolve `tenants` with organizationGroupId, blueprint, organizationModel, deploymentMode, regionId, cellId, deploymentId.
- New `legal_entities` (V1: one primary per tenant).
- Evolve `centers` as Location. New `campuses` for experience spaces.
- Evolve `users` as global Person. Keep email unique. Keep `memberships` as TenantMembership. New `organization_group_memberships`.
- New `blueprints`, `capabilities`, `tenant_capabilities`, `policies`.
- Evolve `feature_flags.purpose` to rollout/experiment only.
- Evolve `audit_logs` with actorType, purpose, correlationId.
- RLS `withTenantContext` accepts UUID and positive integer during the Payload expand window.

Stored plan enum stays `starter|pro|enterprise`. Commercial names Launch/Business/Enterprise are a mapping, not a rewrite.

## Consequences

- Payload serial tables are not dual-written in this phase. Mapping lives in `docs/architecture/MAPPING-MASTER-2026-08-28.md`.
- CEP-specific host conditionals are frozen. Vertical behaviour goes through blueprint + capability + policy.
- Rollback is drop of new tables/columns. Existing business rows are not rewritten except nullable backfill of group, legal entity and default campus.

## Rollback

Apply the inverse of `packages/db/migrations/0005_foundation_p0.sql`. Drop new tables and columns. Do not restore dropped CEP forks. There are none in this change.

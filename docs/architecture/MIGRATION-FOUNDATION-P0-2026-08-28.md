# Migration notes. Foundation P0. 2026-08-28

## File

`packages/db/migrations/0005_foundation_p0.sql`

Expand only. Re-runnable. No DROP. No column rename.

## Apply

Against the Postgres that already hosts the Drizzle UUID schema (`packages/db`). Do not run this file against the Payload serial database used by live tenant-admin. Those are different PK types for `tenants`/`users`.

```bash
psql "$DATABASE_URL" -f packages/db/migrations/0005_foundation_p0.sql
```

`drizzle-kit migrate` will also pick it up via `packages/db/migrations/meta/_journal.json` tag `0005_foundation_p0`.

## Backfill

- One `organization_groups` row per existing tenant, slug = tenant slug.
- One primary `legal_entities` row per tenant, legal_name = tenant name, jurisdiction ES.
- One default hybrid `campuses` row per tenant, slug `default`.
- Blueprint `professional_training` v1 and the Appendix B capability catalog.

Existing course, enrollment and billing rows are untouched.

## Rollback

1. Stop writing foundation services.
2. Drop new tables: `policies`, `tenant_capabilities`, `capabilities`, `blueprints`, `campuses`, `legal_entities`, `organization_group_memberships`, `organization_groups`.
3. Drop new columns on `tenants`, `users`, `centers`, `feature_flags`, `audit_logs`.
4. Drop new enum types if unused.

Do this only on the Drizzle database. Take a snapshot first. Spec 27.9. Observe, then contract. This PR does not contract.

## Out of scope

Outbox, object storage provider, health baseline, Offering canonicalization, Payload PK unification.

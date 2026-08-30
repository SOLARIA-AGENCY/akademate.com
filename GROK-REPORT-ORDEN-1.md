# GROK-REPORT-ORDEN-1

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE

## 1. Que se hizo (Fase 0 + Fase 1)

### Fase 0. Discovery

Inventario real del monorepo frente a `AKADEMATE-MASTER-ARCHITECTURE-2026-08-28.md`.

Entregable. `docs/architecture/MAPPING-MASTER-2026-08-28.md`

Hallazgo principal. Hay dos esquemas con los mismos nombres de tabla y PKs incompatibles.

- Payload serial en `apps/tenant-admin` (ops de academia).
- Drizzle UUID en `packages/db` (core canonico + billing).

P0 evoluciona Drizzle. Payload no se dual-escribe. Course sigue siendo el atomo academico (Fase 2). CEP es el default implicito por host/slug/tenant `1`. Esas excepciones quedan congeladas. El equivalente de producto es Blueprint + Capability + Policy.

### Fase 1. Foundation P0 (expand, no rewrite)

ADR. `docs/adr/0016-foundation-p0-canonical-core.md`
Migration. `packages/db/migrations/0005_foundation_p0.sql` (re-runnable, sin DROP)

- NEW `organization_groups` (Account). No se reutiliza Better Auth `accounts`.
- EVOLVE `tenants`. group, blueprint, organizationModel, deploymentMode, regionId, cellId, deploymentId.
- NEW `legal_entities` (V1. 1 tenant = 1 legal entity primaria).
- EVOLVE `centers` como Location. NEW `campuses`.
- EVOLVE `users` como Person global. EVOLVE `memberships` como TenantMembership. NEW `organization_group_memberships`.
- NEW `blueprints`, `capabilities`, `tenant_capabilities`, `policies`.
- EVOLVE `feature_flags.purpose` (rollout/experiment). Capabilities son producto.
- EVOLVE `audit_logs` con actorType, purpose, correlationId.
- ActorContext + `withTenantContext` acepta UUID y enteros Payload.
- Plan stored `starter|pro|enterprise` se mapea a Launch/Business/Enterprise. Plan != Deployment.

Fuera de esta orden. Fases 2 a 7. Outbox. ObjectStorage. Health. Stripe en `apps/web`. Deploy. Merge a main.

## 2. SHA HEAD y rama

- Rama. `feat/foundation-p0-2026-08-28`
- HEAD. `4a2411c951708f22d2f687da3cee54ae86cf5f0e`
- Base. `origin/main` `64df89fd1f53372a01fc5f337a17d52ec55b1161`
- Commits.
  - `1fc477a` docs(architecture): map existing schema to foundation P0
  - `d35b06e` feat(db): evolve foundation P0 core
  - `4a2411c` docs: add GROK-REPORT-ORDEN-1 for foundation P0

## 3. URL del PR

https://github.com/SOLARIA-AGENCY/akademate.com/pull/7

Ordenes 2 y 3 van en el mismo PR. Ver `GROK-REPORT-ORDEN-2.md` (cookie banner) y `GROK-REPORT-ORDEN-3.md` (ENTERPRISE/ON-PREMISE).

Abierto contra `main`. No mergeado.

## 4. Tests. comando y resultado

Entorno. Node v20.19.2 (el repo pide >=22). Vitest 4.1.2. Sin `DATABASE_URL`, los tests de RLS contra Postgres se saltan.

```text
$ pnpm --filter @akademate/db test
Test Files  6 passed (6)
Tests       95 passed | 16 skipped (111)
```

16 skipped. `describe.skipIf(!shouldRunIntegration)` en `packages/db/__tests__/rls.isolation.test.ts` cuando no hay `DATABASE_URL` + `RUN_DB_TESTS=true`. Los tests de formato de tenant id (UUID + entero) si corren.

```text
$ cd packages/tenant && pnpm exec vitest run
Test Files  2 passed (2)
Tests       26 passed (26)
```

```text
$ pnpm exec tsc -p packages/db/tsconfig.json --noEmit
$ pnpm exec tsc -p packages/types/tsconfig.json --noEmit
$ pnpm exec tsc -p packages/tenant/tsconfig.json --noEmit
exit 0
```

No se ejecuto `pnpm test` del monorepo completo (tenant-admin/jsdom). La cobertura pedida es unit + isolation/RLS del foundation enviado.

Integracion Postgres pendiente.

```text
psql "$DATABASE_URL" -f packages/db/migrations/0005_foundation_p0.sql
RUN_DB_TESTS=true pnpm --filter @akademate/db test
```

No aplicar `0005` sobre la DB Payload serial de produccion.

## 5. Huecos / no hecho / riesgos / rollback

### No hecho (a proposito)

- Fases 2 a 7 (Offering, enrollment comercial, campus adaptativo, etc.).
- Outbox, ObjectStorageProvider, health baseline (spec 27.2 extra, fuera de la lista de la orden).
- Unificar PKs Payload integer vs Drizzle UUID.
- Dual-write a collections Payload.
- Quitar conditionals CEP existentes.
- Checkout/Stripe en `apps/web`.
- Deploy, Hetzner, OVH, merge a main.

### Riesgos

1. Dual schema. Correr `0005_foundation_p0.sql` contra Postgres Payload serial falla o crea tablas paralelas. `apps/tenant-admin` Payload y el cliente Drizzle leen el mismo `DATABASE_URL`. No hay split de runtime. No aplicar 0005 ahi.
2. RLS Drizzle castea `app.tenant_id` a uuid. `withTenantContext` acepta enteros para no romper callers Payload, pero un integer en `set_config` no aísla filas UUID. Hay que pasar UUID contra tablas Drizzle.
3. Isolation Postgres no se ejecuto aqui (16 tests skipped). `rls.isolation.test.ts` sigue usando PKs enteros de la era Payload. Probar con `RUN_DB_TESTS=true` en una DB UUID.
4. `drizzle-kit migrate` no aplica los SQL sueltos `0001_enable_rls.sql` / `0002_complete_rls.sql`. El journal solo tiene 0000, 0001_slim, 0002_mysterious, 0005.
5. Backfill crea un group por tenant (slug = tenant slug). Grupos reales multi-tenant (CEP) hay que reagrupar a mano. No se inventan tenants.
6. `policies` unique con NULLs en Postgres no colapsa defaults de plataforma. Aceptable en P0.
7. Node 22 no estaba en este runner. Tests en Node 20.

### Rollback

Inverso de `0005_foundation_p0.sql`. DROP de tablas y columnas nuevas. Filas de courses/enrollments/billing no se tocan. Detalle en `docs/architecture/MIGRATION-FOUNDATION-P0-2026-08-28.md`.

## 6. Files / tables affected

### Files (principales)

- `docs/architecture/MAPPING-MASTER-2026-08-28.md`
- `docs/architecture/MIGRATION-FOUNDATION-P0-2026-08-28.md`
- `docs/adr/0016-foundation-p0-canonical-core.md`
- `AKADEMATE-MASTER-ARCHITECTURE-2026-08-28.md`
- `packages/types/src/foundation.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/foundation/*`
- `packages/db/src/rls/withTenantContext.ts`
- `packages/db/src/rls/policies.sql`
- `packages/db/migrations/0005_foundation_p0.sql`
- `packages/tenant/src/capabilities.ts`
- tests en `packages/db/__tests__` y `packages/tenant/__tests__`

### Tables

NEW

- `organization_groups`
- `organization_group_memberships`
- `legal_entities`
- `campuses`
- `blueprints`
- `capabilities`
- `tenant_capabilities`
- `policies`

EVOLVE (columnas)

- `tenants` (organization_group_id, blueprint_*, organization_model, deployment_mode, region_id, cell_id, deployment_id, timezone, locale, currency, config)
- `users` (given_name, family_name, locale, timezone, status)
- `memberships` (unique user+tenant)
- `centers` (location_kind, timezone, is_primary)
- `feature_flags` (purpose)
- `audit_logs` (organization_group_id, actor_type, purpose, correlation_id, channel, policy_decision)

KEEP

- Better Auth `accounts`, `sessions`, `verifications`
- `courses`, `course_runs`, billing Stripe, LMS, leads (Fase 2+)

GROK BUILD AKADEMATE

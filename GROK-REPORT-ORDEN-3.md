# GROK-REPORT-ORDEN-3

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Que se hizo

ENTERPRISE y ON-PREMISE siguen en el schema (plan / deployment_mode). No se pintan en chrome.

- Default de tenant. `starter` + `managed_cloud`. Cero badges.
- Sidebar y footer. 0 matches ENTERPRISE/ON-PREMISE aunque el tenant sea enterprise+on_premise.
- Configuracion. `TenantPlanBadges` solo si `plan === enterprise` y/o `deploymentMode === on_premise`.
- GET `/api/config?section=academia` devuelve plan/deploymentMode. Integer/Payload cae a starter/managed_cloud. UUID/Drizzle lee columnas si existen.

No if-tenant==CEP. No Hetzner. No OVH. No checkout en apps/web. No merge. No deploy.

## SHA y rama

- Rama. `feat/foundation-p0-2026-08-28`
- Commit. `acedd66` feat(tenant-admin): keep ENTERPRISE and ON-PREMISE off chrome
- HEAD. se actualiza al commitear este informe

## PR

https://github.com/SOLARIA-AGENCY/akademate.com/pull/7

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run \
  __tests__/lib/tenantPlanChrome.test.ts \
  __tests__/configuracion/TenantPlanBadges.test.tsx \
  __tests__/layout/chrome-plan-badges.test.tsx \
  __tests__/configuracion/unified-page.test.tsx
# 4 files, 11 + 33 = 44 passed (chrome 3, badges 2, helper 3, unified 33)
```

Comando conjunto Orden 2+3

```text
cd apps/tenant-admin && pnpm exec vitest run \
  __tests__/public/CookieBanner.test.tsx \
  __tests__/lib/tenantPlanChrome.test.ts \
  __tests__/configuracion/TenantPlanBadges.test.tsx \
  __tests__/layout/chrome-plan-badges.test.tsx
# 4 files, 11 passed
```

## Files

- `apps/tenant-admin/lib/tenantPlanChrome.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/configuracion/TenantPlanBadges.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/configuracion/page.tsx`
- `apps/tenant-admin/app/api/config/route.ts`
- `apps/tenant-admin/__tests__/lib/tenantPlanChrome.test.ts`
- `apps/tenant-admin/__tests__/configuracion/TenantPlanBadges.test.tsx`
- `apps/tenant-admin/__tests__/layout/chrome-plan-badges.test.tsx`

## Huecos

Ops UI para *setear* plan/deployment no se anadio. Settings muestra, no edita. Payload serial no tiene esas columnas. Los tenants integer nunca veran los badges hasta que existan en su fila.

GROK BUILD AKADEMATE

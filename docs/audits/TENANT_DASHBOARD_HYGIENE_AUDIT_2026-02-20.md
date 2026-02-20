# Tenant Dashboard Hygiene Audit (2026-02-20)

## Executive Summary
- `✓` Repo hygiene aplicada en `apps/tenant-admin`: eliminados artefactos transpilados obsoletos y duplicados TS/JS.
- `✓` Runtime confirmado: menú lateral mantiene sección `Campus Virtual` y rutas LMS visibles.
- `✓` Infra hygiene en NEMESIS: limpieza de bundles/caché Docker completada con recuperación masiva de espacio.
- `⚠` Queda deuda técnica de tipado en tenant-admin (preexistente, no causada por esta limpieza).

## Scope
- Repositorio local: `apps/tenant-admin` + hardening de Docker build tenant.
- Servidor NEMESIS: limpieza de caché/builds Docker antiguos.
- Verificación funcional rápida post-limpieza (auth dev + sidebar + endpoints principales).

## Findings

### 1) Artefactos obsoletos en tenant-admin (`P1`)
- Se detectaron archivos generados mezclados con código fuente:
  - `*.js` y `*.d.ts` con fuente real en `*.ts`/`*.tsx`
  - `*.js.map` y `*.d.ts.map`
- Impacto:
  - Riesgo alto de shadowing de módulos (Node/Next resolviendo `.js` viejo en lugar de `.tsx` actualizado).
  - Evidencia real previa: `AppSidebar.js` desactualizado ocultaba `Campus Virtual` aunque `AppSidebar.tsx` ya lo tenía.

### 2) Bundle hygiene Docker (`P1`)
- NEMESIS tenía alto volumen de caché/build legacy.
- Antes:
  - Images: `106.4GB`
  - Build cache: `101GB`
- Después:
  - Images: `14.72GB`
  - Build cache: `0B`
- Recuperación aproximada: `~192GB`.

### 3) Estado funcional post-limpieza (`P2`)
- Endpoints externos:
  - `http://100.99.60.106:3004 -> 307`
  - `http://100.99.60.106:3005 -> 200`
  - `http://100.99.60.106:3006 -> 200`
  - `http://100.99.60.106:3008 -> 200`
  - `http://100.99.60.106:3009 -> 307`
  - `http://100.99.60.106:3003/admin -> 200`
- Verificación tenant sidebar autenticado:
  - `Campus Virtual: OK`
  - `Inscripciones LMS: OK`
  - `CAMPUS VIRTUAL: OK`

## Actions Executed

### Repo cleanup
- Eliminados artefactos transpilados obsoletos en `apps/tenant-admin`.
- Resultado de diff:
  - `1456 files changed`
  - `62284 deletions`
  - `4 insertions`
- Estado final de artefactos en working tree:
  - `*.js.map`: `0`
  - `*.d.ts.map`: `0`
  - `*.d.ts`: solo `next-env.d.ts`
  - `*.js`: solo `next.config.js` + `app/(payload)/admin/importMap.js`

### Preventive control añadido
- Script nuevo: `apps/tenant-admin/scripts/audit-transpiled-artifacts.mjs`
- Script npm nuevo:
  - `apps/tenant-admin/package.json` -> `"audit:hygiene": "node ./scripts/audit-transpiled-artifacts.mjs"`
- Validación:
  - `pnpm --filter @akademate/tenant-admin audit:hygiene` -> `OK`

### Docker build hardening
- Archivo: `infrastructure/docker/Dockerfile.tenant-admin`
- Mejora:
  - limpieza explícita de `.next`/`.turbo` durante build para evitar bundles stale.

## Validation Runs
- `pnpm --filter @akademate/tenant-admin audit:hygiene` -> PASS.
- `pnpm --filter @akademate/tenant-admin exec vitest run tests/components/programacion-page.test.tsx tests/components/realtime-provider.test.tsx` -> PASS (3/3).
- `pnpm --filter @akademate/tenant-admin typecheck` -> FAIL por deuda histórica de tipado (múltiples módulos, no regresión de esta limpieza).

## Residual Risks
- `P1` Deuda de TypeScript strict en tenant-admin (numerosos errores de dominio y tipos Payload/Zod).
- `P2` `akademate-nginx` permanece `unhealthy` en NEMESIS (apps principales operativas, pero requiere corrección de healthcheck/proxy).

## Recommended Next Steps
1. Ejecutar remediación por lotes de `typecheck` (priorizar `app/api/*` y `src/collections/*`).
2. Añadir `audit:hygiene` al pipeline CI de tenant-admin como gate obligatorio.
3. Corregir healthcheck de `nginx` en staging para cerrar higiene operativa.

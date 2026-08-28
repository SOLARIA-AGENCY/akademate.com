# GROK-REPORT-DASHBOARD-OVERFLOW

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Que se hizo

DoD. Scroll vertical = documento/pantalla. No overflow-y interno en `main`. Cards a tamano natural.

Causa residual. `overflow-x: hidden` en el shell (y en body) computa `overflow-y: auto`. Eso vuelve a crear un scrollport interno aunque `main` ya no tenga `overflow-y-auto`.

Cambio.

- Shell y `main` sin overflow. `overflow: visible`.
- Clip horizontal en `html`/`body` con `overflow-x: clip` (no `hidden`).
- Grids del dashboard con `min-w-0`. Items de grid con `min-width: 0`.
- `course-instance-card` ya no tiene `max-height: 580px`.
- Sidebar navy no se toco.

## SHA y rama

- Rama. `feat/foundation-p0-2026-08-28`
- PR. https://github.com/SOLARIA-AGENCY/akademate.com/pull/7
- HEAD. `22e441ba0894ec972ccb848ec987b31913fc91cd`

No merge. No deploy. No branding.

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run __tests__/layout/dashboard-overflow.test.ts
# 1 file, 5 passed
```

Contrato en 1440 / 1024 / 768. las mismas clases, sin `md:overflow-y-auto`. Falla si `main` vuelve a `overflow-y-auto` o si el shell vuelve a `h-screen` + `overflow-hidden` o `overflow-x-hidden`.

## Files

- `apps/tenant-admin/app/(app)/(dashboard)/dashboard-shell.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/layout.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/_components/DashboardHome.tsx`
- `apps/tenant-admin/app/globals.css`
- `apps/tenant-admin/__tests__/layout/dashboard-overflow.test.ts`

## Huecos

jsdom no mide overflow real en pixels. No hay browser tools en este runner.

GROK BUILD AKADEMATE

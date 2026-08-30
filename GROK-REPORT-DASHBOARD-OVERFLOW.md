# GROK-REPORT-DASHBOARD-OVERFLOW

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Que se hizo

DoD. Scroll vertical = documento/pantalla. No overflow-y interno en `main`. Cards a tamano natural. Sin scroll interno en la card.

Causa residual. `overflow-x: hidden` computa `overflow-y: auto`.

Cambio de layout.

- Shell y `main` con `overflow: visible`.
- Clip horizontal en `html`/`body` con `overflow-x: clip`.
- Grids con `min-w-0`.
- `course-instance-card` sin `max-height: 580px`.

Addendum CEP OVH-Ω.

1. Filtros superiores. texto a la izquierda, no centrado. Select `text-left`, `align=start`, sin `line-clamp-1`. PageHeader filters `justify-start text-left`. Listados cursos/alumnos/ciclos igual.
2. Card "Hoy en la academia". texto completo con `whitespace-normal break-words`. Sin truncate, line-clamp, max-height ni overflow-y.

## SHA y rama

- Rama. `feat/foundation-p0-2026-08-28`
- PR. https://github.com/SOLARIA-AGENCY/akademate.com/pull/7
- HEAD. `b72c3f0ea6772b9e1fc5d9f98c6b33bdfde784f6`

No merge. No deploy. No branding. No if-tenant==CEP.

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run \
  __tests__/layout/dashboard-overflow.test.ts \
  __tests__/dashboard-campus-integration.test.tsx
# 2 files, 8 passed
```

## Files

- `apps/tenant-admin/app/(app)/(dashboard)/dashboard-shell.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/layout.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/_components/DashboardHome.tsx`
- `apps/tenant-admin/app/globals.css`
- `apps/tenant-admin/@payload-config/components/ui/select.tsx`
- `apps/tenant-admin/@payload-config/components/ui/card.tsx`
- `apps/tenant-admin/@payload-config/components/ui/PageHeader.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/cursos/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/alumnos/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/ciclos-medio/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/ciclos-superior/page.tsx`
- `apps/tenant-admin/__tests__/layout/dashboard-overflow.test.ts`

GROK BUILD AKADEMATE

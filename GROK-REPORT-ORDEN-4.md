# GROK-REPORT-ORDEN-4

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Que se hizo

Rail y canvas son columnas de viewport (`h-svh`).

1. Rail. header `shrink-0`, nav `min-h-0 flex-1 overflow-y-auto`, footer `shrink-0` con CTA Matriculación (color primary Akademate, no `#f2014b`) y Ayuda. Visible a zoom 100% sin bajar zoom.
2. Canvas. scrollea las cards (`overflow-y-auto` en `.dashboard-canvas-scroll`). Título sticky. Cards a tamano natural, sin overflow-y interno.
3. Outline. invisible en web. Solo `html[data-ipad-app]` (Capacitor / standalone). Nunca por viewport.
4. Sidebar `bg-sidebar`. Sin tokens CEP.

No HolidayCalendar. No if-tenant==CEP. No merge. No deploy.

## SHA y rama

- Rama. `feat/foundation-p0-2026-08-28`
- PR. https://github.com/SOLARIA-AGENCY/akademate.com/pull/7
- HEAD. `c3c3dd89434c2fd73f585839594f67583ef8e889`

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run \
  __tests__/layout/dashboard-overflow.test.ts \
  __tests__/lib/detect-ipad-app.test.ts \
  __tests__/dashboard-campus-integration.test.tsx
# 3 files, 8 passed
```

Cubre rail pin, overflow-x clip, Hoy sin clamp, outline solo iPad-app.

## Files

- `apps/tenant-admin/app/(app)/(dashboard)/dashboard-shell.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/layout.tsx`
- `apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/_components/DashboardHome.tsx`
- `apps/tenant-admin/app/globals.css`
- `apps/tenant-admin/app/ClientLayout.tsx`
- `apps/tenant-admin/lib/detect-ipad-app.ts`
- `apps/tenant-admin/__tests__/layout/dashboard-overflow.test.ts`
- `apps/tenant-admin/__tests__/lib/detect-ipad-app.test.ts`

## Huecos

No se midio 1440 / 1280×800 / 1024×768 en navegador. El contrato es `h-svh` + `min-h-0` en el nav. jsdom no calcula altura real.

GROK BUILD AKADEMATE

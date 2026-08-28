# GROK-REPORT-DASHBOARD-OVERFLOW

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE

## Que se hizo

El dashboard recortaba las cards porque el shell era `h-screen overflow-hidden` y `main` era `flex-1 overflow-y-auto overflow-x-hidden`. El scroll vivia en un pane interno.

Ahora el documento hace el scroll vertical. Las cards no se clippean. overflow-x sigue en 0 a nivel de pagina (`overflow-x-hidden` en el shell y en `body`).

Sidebar fijo intacto. Sin cambios de branding. Sin CEP.

## SHA y rama

- Rama. `feat/foundation-p0-2026-08-28`
- HEAD. `12179e4d1f6d1e5c7e364da445edbe21a727fd0e`
- PR. https://github.com/SOLARIA-AGENCY/akademate.com/pull/7

No merge. No deploy.

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run __tests__/layout/dashboard-overflow.test.ts
# 1 file, 3 passed
```

El test falla si `main` vuelve a `overflow-y-auto` o si el shell vuelve a `h-screen` + `overflow-hidden`.

## Files

- `apps/tenant-admin/app/(app)/(dashboard)/dashboard-shell.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/layout.tsx`
- `apps/tenant-admin/__tests__/layout/dashboard-overflow.test.ts`

## Huecos

No se midio 1440/1024/768 en navegador (no hay browser tools aqui). jsdom no calcula overflow real. El contrato es de clases, no de pixels.

GROK BUILD AKADEMATE

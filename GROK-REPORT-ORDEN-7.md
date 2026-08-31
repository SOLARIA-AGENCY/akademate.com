# GROK-REPORT-ORDEN-7

Fecha. 2026-08-31
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Ficha UI

- Superficie. dashboard
- Catálogo. shadcn
- Slug. `@shadcn/sidebar-16` (SiteHeader sticky + breadcrumb). Sin slug extra.
- Source. `apps/tenant-admin/@payload-config/components/site-header.tsx`. Palanca `apps/tenant-admin/scripts/strip-page-header.mjs`.
- Tokens. `--sidebar: 222 47% 12%`. `--background: 220 16% 95%`. Cards `bg-card`. KPI/contenido en `Card`.
- Salto. ninguno.

## Que se hizo

Quita PageHeader de inner pages. El título sale de SiteHeader sticky + breadcrumb. No hay reemplazo local.

- Palanca AST (`strip-page-header.mjs`) recorre páginas, borra `<PageHeader>`, deja `actions`/`filters` como controles de página.
- 91 archivos, 100 tags. Se elimina `PageHeader.tsx`, stories y mock.
- ComingSoonPage ya no pinta header. Cards se quedan.
- Breadcrumbs cubren más segmentos (facturación, campañas, FAQs, etc.).
- Convocatorias web conservan badges `n total` / `n publicadas` como contenido, no como título.

Misma rama `feat/sidebar-16-header`. PR #8. No merge. No CEP. No Holiday. No OVH/Hetzner.

## SHA y rama

- Rama. `feat/sidebar-16-header`
- PR. https://github.com/SOLARIA-AGENCY/akademate.com/pull/8
- Base. `origin/main` `40d8272e8f32d644c8e8e73842f1ed23ad5e0600`
- HEAD feat. `7359e5196a73538d449c9901d783121ec453e14c`

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run \
  __tests__/layout/no-page-header.test.ts \
  __tests__/layout/sidebar-16-header.test.ts \
  __tests__/layout/weagle-header.test.ts \
  __tests__/layout/dashboard-overflow.test.ts \
  __tests__/layout/sidebar-click-scroll.test.tsx \
  __tests__/layout/chrome-plan-badges.test.tsx \
  __tests__/ciclos-nuevo.test.tsx \
  __tests__/web-convocatorias.test.tsx
# 8 files, 39 tests, pass
# inner pages sin PageHeader; SiteHeader sticky
```

Sin pase en navegador.

## Files

- `apps/tenant-admin/scripts/strip-page-header.mjs`
- `apps/tenant-admin/__tests__/layout/no-page-header.test.ts`
- `apps/tenant-admin/@payload-config/components/site-header.tsx`
- páginas dashboard (91) + `ComingSoonPage.tsx`
- delete `PageHeader.tsx` + stories + mock

## Huecos

Títulos dinámicos (nombre de curso, sede) no caben en breadcrumb por path. Se ve el id. Callers de ComingSoonPage aún pasan `title` que no se pinta. Indentación de algunas toolbars queda heredada del JSX original.

GROK BUILD AKADEMATE

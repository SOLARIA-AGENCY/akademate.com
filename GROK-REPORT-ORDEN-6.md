# GROK-REPORT-ORDEN-6

Fecha. 2026-08-31
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Ficha UI

- Superficie. dashboard
- Catálogo. shadcn
- Slug. `@shadcn/sidebar-16` (block: sidebar + sticky site header)
- Source. `apps/tenant-admin/@payload-config/components/site-header.tsx`, `search-form.tsx`, `app-sidebar.tsx` (demo, no montado), `nav-*.tsx`, `@payload-config/blocks/sidebar-16/page.tsx`
- Tokens. `--sidebar: 222 47% 12%`. `--background: 220 16% 95%`. Rail `bg-sidebar`. Canvas `bg-background`. Cards `bg-card` `rounded-2xl` `shadow-sm`.
- Salto. ninguno. CLI en `apps/tenant-admin`: `npx shadcn@latest add @shadcn/sidebar-16 --yes --overwrite`. Primitivos UI restaurados desde git. CSS Weagle `hsl(0 0% 98%)` revertido.

## Que se hizo

PageHeader local deja de ser chrome. Card PASS se queda.

- Add CLI de `@shadcn/sidebar-16`. No se copiaron componentes a mano.
- Header local del layout sustituido por `SiteHeader` sticky (`top-0 z-50`).
- `SidebarProvider` controla el toggle. Rail vivo sigue siendo `layout/AppSidebar` (CTA Matriculación + Ayuda, submenús click-only, scrollbar hidden).
- Demo `components/app-sidebar.tsx` (Acme / Enterprise) no se monta en chrome.
- DashboardHome ya no usa PageHeader ni chrome sticky propio. KPIs y Hoy siguen en `Card`.
- Página demo del block movida a `@payload-config/blocks/sidebar-16/page.tsx` para no chocar con el app router.

Mantiene. footer pin, outline solo `html[data-ipad-app]`, ENTERPRISE fuera de chrome, canvas scroll, no Weagle blanco, no CEP.

No HolidayCalendar. No OVH/Hetzner. No merge.

## SHA y rama

- Rama. `feat/sidebar-16-header`
- PR. https://github.com/SOLARIA-AGENCY/akademate.com/pull/8
- Base. `origin/main` `40d8272e8f32d644c8e8e73842f1ed23ad5e0600`
- HEAD feat. `ec339d21a70867b9891ff38172a431c597de19e0`

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run \
  __tests__/layout/sidebar-16-header.test.ts \
  __tests__/layout/weagle-header.test.ts \
  __tests__/layout/dashboard-overflow.test.ts \
  __tests__/layout/sidebar-click-scroll.test.tsx \
  __tests__/layout/chrome-plan-badges.test.tsx
# 5 files, 20 tests, pass
# sticky SiteHeader, rail navy, no PageHeader in chrome
```

No se verificó en navegador. No hay servidor en :3009 ni MCP de browser en esta sesión.

## Files

- `apps/tenant-admin/@payload-config/components/site-header.tsx`
- `apps/tenant-admin/@payload-config/components/search-form.tsx`
- `apps/tenant-admin/@payload-config/components/app-sidebar.tsx`
- `apps/tenant-admin/@payload-config/components/nav-main.tsx`
- `apps/tenant-admin/@payload-config/components/nav-projects.tsx`
- `apps/tenant-admin/@payload-config/components/nav-secondary.tsx`
- `apps/tenant-admin/@payload-config/components/nav-user.tsx`
- `apps/tenant-admin/@payload-config/blocks/sidebar-16/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/layout.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/dashboard-shell.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/_components/DashboardHome.tsx`
- `apps/tenant-admin/__tests__/layout/sidebar-16-header.test.ts`
- `apps/tenant-admin/__tests__/layout/weagle-header.test.ts`
- `apps/tenant-admin/__tests__/layout/dashboard-overflow.test.ts`

## Huecos

`PageHeader.tsx` sigue en inner pages (cursos, sedes, etc.). No es chrome. El demo del block aún pinta "Enterprise" si alguien lo monta. Breadcrumbs cubren segmentos conocidos; el resto se capitaliza. Sin pase visual 1440 / 1280×800 / 1024×768.

GROK BUILD AKADEMATE

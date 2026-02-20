# Tenant Dashboard Visual Audit (2026-02-20)

## Executive Summary
- Scope: `apps/tenant-admin` dashboard visual system and component usage.
- Result: base shadcn stack is present and usable, but visual consistency is partial.
- Priority: standardize page composition and reduce ad-hoc visual decisions.

## Metrics
- UI components available in `@payload-config/components/ui`: 49+
- Dashboard pages detected under `app/(dashboard)`: 60+
- Shared shell present: sidebar + header + footer in `app/(dashboard)/layout.tsx`

## Findings

### P1 - Inconsistent page composition pattern
- Some pages use a standardized header/card rhythm, others render custom wrappers and spacing.
- Impact: uneven visual hierarchy and inconsistent scanning speed for users.
- Recommendation: enforce a common page recipe:
  - `PageHeader`
  - KPI row (`Card` x 3/4)
  - content grid (`Card` for tables/charts)
  - action zone with `Button` variants only.

### P1 - Mixed token usage and hardcoded colors
- Sidebar section separators still use hardcoded magenta (`#F2014B`).
- Impact: harder theming and visual drift across tenant brands.
- Recommendation: migrate to semantic tokens (`--primary`, `--sidebar-*`) and remove direct hex values from layout components.

### P2 - Component capability not exposed to product teams
- Rich component set exists (`dialog`, `sheet`, `tabs`, `table`, `pagination`, `tooltip`, etc.) but there is no in-app showcase.
- Impact: repeated custom UI work instead of reuse.
- Recommendation: keep a `/design-system` catalog page in dashboard for implementation references.

### P2 - Information density and spacing rhythm varies by module
- Some pages are compact and others oversized in paddings/gaps.
- Impact: perceived quality inconsistency and slower navigation.
- Recommendation: adopt spacing scale per section type:
  - page sections: `space-y-6`
  - intra-card blocks: `space-y-4`
  - control rows: `gap-2`/`gap-3`

## Delivered with this iteration
- New in-app catalog page: `/design-system`
- New client dashboard mockup: `/diseno/mockup-dashboard`
- Sidebar navigation links for both pages.

## Next Actions
1. Replace hardcoded sidebar color with tokenized variable.
2. Migrate top 10 visited pages to shared composition pattern.
3. Add visual regression snapshots for shell + key pages.

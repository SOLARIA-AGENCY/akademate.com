# Tenant UI Audit & Standardization - 2026-02-20

## Executive Summary
- Scope audited: sidebar interaction states, design system coverage, dashboard mockup coverage, header/title consistency across dashboard pages.
- Dashboard pages audited: 73
- Pages already using `PageHeader`: 4
- Pages not yet standardized with `PageHeader`: 69
- Severity status:
  - P1: Inconsistent title/header pattern across most dashboard pages.
  - P1: Collapsed sidebar icon centering and hover affordance were inconsistent.
  - P2: Design system lacked calendar views (day/week/month/year) and several product patterns.

## Fixes Applied In This Iteration

### 1) Sidebar UX and Interaction States
File: `apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx`
- Added deterministic collapsed sizing (`h-10 w-10 mx-auto`) for top-level entries to keep icons centered.
- Reworked hover and active states with stronger visual feedback:
  - `hover:bg-primary/10`
  - subtle border and shadow
  - left accent rail in expanded mode
- Kept collapsed mode clean by hiding left accent rail to preserve icon centering.

### 2) Design System Expansion (Academate-ui aligned)
File: `apps/tenant-admin/app/(dashboard)/design-system/page.tsx`
- Added new `Calendarios` tab with complete scheduling suite:
  - Daily timeline pattern
  - Weekly workload pattern
  - Monthly matrix pattern
  - Yearly planning pattern
- Added `ToggleGroup` controls for view switching.
- Added a dedicated "Librería Akademate-ui integrada" section with reusable product modules:
  - Calendar Suite
  - Leads Dashboard
  - Task Board
  - Chat Workspace
  - Files Hub
- Added explicit header standardization rules under patterns.

### 3) Mockup Dashboard Expansion
File: `apps/tenant-admin/app/(dashboard)/diseno/mockup-dashboard/page.tsx`
- Added `Planner Académico Unificado` block with tabs:
  - Diario
  - Semanal
  - Mensual
  - Anual
- Included visual patterns for agenda slots, weekly capacity, monthly calendar matrix and annual quarter planning.

## Header/Title Standardization Audit

### Current state
- Standardized (`PageHeader`): 4/73 (5.5%)
- Non-standardized pages: 69/73 (94.5%)

### Key risks
- Inconsistent visual rhythm and hierarchy.
- Uneven spacing and title framing behavior.
- Cross-module UX drift (especially between config/content/operations areas).

### Standard target
- Use `PageHeader` as default shell for all first-level and CRUD pages.
- `withCard=true` by default.
- Shared spacing contract: header block + `space-y-6` content rhythm.

## Proposed Migration Waves
1. Wave 1 (P1): Core operations
   - `/dashboard`, `/programacion`, `/planner`, `/cursos`, `/campus-virtual`, `/leads`, `/matriculas`, `/analiticas`, `/administracion/*`.
2. Wave 2 (P1): Academic entities
   - `/alumnos`, `/profesores*`, `/personal*`, `/sedes*`, `/ciclos*`, `/cursos/*`.
3. Wave 3 (P2): Configuration and content
   - `/configuracion/*`, `/contenido/*`, `/web/*`, `/ayuda`, `/estado`.

## Validation
- Typecheck: `pnpm --filter @akademate/tenant-admin exec tsc --noEmit --pretty false` -> PASS.


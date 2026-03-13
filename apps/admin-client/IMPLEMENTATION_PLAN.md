# Ops Dashboard Redesign — Implementation Plan

## Objetivo

Transformar el ops dashboard en el command center real de Akademate con:
- KPIs reales de SaaS (MRR, ARR, churn, retención)
- Navegación reorganizada en 7 secciones
- Páginas de finanzas, analytics y auditoría
- Acceso programático via Bearer token (AI agents)

## Fases

### Phase 0 — Interactive Cards + Real SaaS KPIs
API: `/api/ops/mrr`, `/api/ops/churn`, `/api/ops/growth`
UI: 12 KPI cards (3 filas × 4), todas clickables con prefiltros

### Phase 1 — Nav + Finanzas + Auditoría
Sidebar: 7 secciones (Overview, Clientes, Finanzas, Analytics, Soporte, Infra, Operaciones)
Páginas: `/finanzas` (P&L), `/auditoria` (audit log con badges AI/human/system)
DB: tabla `saas_expenses` + CRUD endpoints

### Phase 2 — Analytics & Retention
DB: `tenant_events`, `mrr_snapshots`
Páginas: `/analytics` (MRR trend, churn, cohort table, LTV)

### Phase 3 — Programmatic API (post-MVP)
API Keys con scopes, OpenAPI spec, webhooks básicos

## Stack
- Next.js 15 App Router — `apps/admin-client/`
- PostgreSQL — `lib/db.ts` pool singleton
- React Query — `hooks/use-ops-data.ts`
- Plan prices hardcoded: starter=€199, professional=€299, enterprise=€599

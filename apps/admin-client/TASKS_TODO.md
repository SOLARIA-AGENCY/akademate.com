# Tasks — Ops Dashboard Redesign

## PHASE 0: Interactive Cards + Real KPIs ✅

- [x] P0-1: Crear `/api/ops/mrr` — MRR calculado de tenants × precio_plan + trend
- [x] P0-2: Crear `/api/ops/churn` — tenants inactivos, churned MRR, tasa churn
- [x] P0-3: Crear `/api/ops/growth` — nuevos este mes, trial→paid conversion, recent signups
- [x] P0-4: Reescribir dashboard home — 3 filas × 4 KPI cards (Revenue / Clientes / Health)
- [x] P0-5: Todas las KPI cards son clickables con Link → página destino

## PHASE 1: Nav Restructure + Finanzas + Auditoría ✅

- [x] P1-1: Tabla `saas_expenses` — auto-create en primer uso (finanzas/gastos endpoint)
- [x] P1-2: Endpoints CRUD `/api/ops/finanzas/gastos` — GET lista + POST crear + PUT/DELETE por id
- [x] P1-3: Endpoint `/api/ops/finanzas/pl` — P&L: MRR - gastos = margen
- [x] P1-4: Restructurar sidebar — 7 secciones (Overview/Clientes/Finanzas/Analytics/Soporte/Infra/Ops)
- [x] P1-5: Página `/dashboard/finanzas` — 3 summary cards + tabla gastos + formulario de alta
- [x] P1-6: Página `/dashboard/auditoria` — tabla con filtros + actor badges (AI/human/system)

## PHASE 2: Analytics & Retention ✅

- [x] P2-1: Endpoint `/api/ops/analytics` — MRR trend 12m, LTV, ARPU
- [x] P2-2: Endpoint `/api/ops/analytics/retencion` — cohort table, churn history
- [x] P2-3: Página `/dashboard/analytics` — KPIs + gráficos de crecimiento
- [x] P2-4: Página `/dashboard/analytics/retencion` — cohort table + churn visual

## PHASE 3: Programmatic API (pendiente post-MVP)

- [ ] P3-1: API Keys collection en DB + UI en /configuracion/apis
- [ ] P3-2: Middleware Bearer token auth para todos los /api/ops/* endpoints
- [ ] P3-3: OpenAPI spec en /api/v1/openapi.json
- [ ] P3-4: Webhooks básicos: tenant.created, payment.failed

## COMPLETED

- Phase 0: MRR/churn/growth APIs + 12-KPI dashboard home
- Phase 1: 7-section sidebar + finanzas page + audit log
- Phase 2: Analytics + retention cohort pages

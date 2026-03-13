# Ops Dashboard Redesign — Design Document

**Date:** 2026-03-13
**Status:** Approved
**Approach:** Option C — Hybrid (new Home + correct architecture in phases)

---

## Context

The current ops dashboard (`apps/admin-client/`) is a 11-page panel designed as a demo. It needs to become the **primary operations command center** for the full Akademate ops team — a hybrid team of humans and AI agents. All functionality must be accessible both via UI and programmatically via API (Bearer token auth).

---

## Navigation Architecture

Seven functional domains, replacing the current duplicated/disorganized sidebar:

```
OVERVIEW
  Command Center          /dashboard

CLIENTES
  Tenants                 /dashboard/tenants
  Registro / Alta         /dashboard/tenants/new
  Impersonar              /dashboard/impersonar

FINANZAS
  P&L Overview            /dashboard/finanzas
  Ingresos                /dashboard/finanzas/ingresos
  Gastos Operativos       /dashboard/finanzas/gastos
  Suscripciones/Planes    /dashboard/suscripciones

ANALYTICS
  Crecimiento             /dashboard/analytics
  Retención & Churn       /dashboard/analytics/retencion

SOPORTE
  Tickets                 /dashboard/soporte

INFRAESTRUCTURA
  Estado del Sistema      /dashboard/estado
  API Console             /dashboard/api

OPERACIONES
  Equipo & Roles          /dashboard/equipo
  Audit Log               /dashboard/auditoria
  Configuración           /dashboard/configuracion
  Roadmap                 /dashboard/roadmap
```

---

## KPI Architecture — Command Center Home

Three rows of 4 cards each, all interactive (clickable with pre-applied filters):

### Row 1 — Revenue
| Card | Value | Trend | Link |
|------|-------|-------|------|
| MRR | Sum(plan_price × active_tenants) | vs last month | /finanzas/ingresos |
| ARR | MRR × 12 | vs last month | /finanzas/ingresos |
| MRR Growth | % change vs prior month | — | /analytics |
| Churned MRR | Revenue lost from cancellations | this month | /analytics/retencion |

### Row 2 — Clientes
| Card | Value | Trend | Link |
|------|-------|-------|------|
| Total Tenants | COUNT(active) | — | /tenants |
| Nuevos este mes | Signups this month | vs last month | /tenants?filter=new |
| Churned este mes | Cancellations this month | — | /analytics/retencion |
| Trial → Paid | Conversion rate % | — | /suscripciones |

### Row 3 — Health (operational semaphore)
| Card | Source | Link |
|------|--------|------|
| Uptime | /api/ops/service-health | /estado |
| Tickets abiertos | /api/ops/support-tickets | /soporte |
| API Error Rate | /api/ops/api-stats | /api |
| Costes mes | saas_expenses table | /finanzas/gastos |

Below the KPI rows:
- Weekly activity bar chart (existing, kept)
- Top tenants by usage (new)
- Urgent tickets mini-list (new)
- Recent signups (new)
- Enterprise Readiness score (existing, kept)

---

## Data Architecture

### New PostgreSQL Tables

```sql
-- Operational expenses
CREATE TABLE saas_expenses (
  id           BIGSERIAL PRIMARY KEY,
  category     VARCHAR(50),   -- infrastructure | software | marketing | other
  vendor       VARCHAR(100),
  amount_eur   DECIMAL(10,2),
  description  TEXT,
  period_month DATE,          -- first day of the relevant month
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly MRR snapshots (avoid recalculating)
CREATE TABLE mrr_snapshots (
  id             BIGSERIAL PRIMARY KEY,
  period_month   DATE UNIQUE,
  mrr_eur        DECIMAL(10,2),
  arr_eur        DECIMAL(10,2),
  new_mrr        DECIMAL(10,2),
  churned_mrr    DECIMAL(10,2),
  expansion_mrr  DECIMAL(10,2),
  tenant_count   INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant lifecycle events
CREATE TABLE tenant_events (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   VARCHAR(100),
  event_type  VARCHAR(50), -- signup|trial_start|converted|upgraded|downgraded|churned
  plan_from   VARCHAR(50),
  plan_to     VARCHAR(50),
  mrr_delta   DECIMAL(10,2),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ops team audit log (humans + AI agents)
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    VARCHAR(100),
  actor_type  VARCHAR(20),   -- human | ai_agent | system
  action      VARCHAR(100),  -- tenant.created, ticket.resolved, etc.
  resource    VARCHAR(100),
  resource_id VARCHAR(100),
  payload     JSONB,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### New API Endpoints

```
REVENUE
  GET  /api/ops/mrr                   MRR + 6-month trend
  GET  /api/ops/mrr/history           Full monthly history
  GET  /api/ops/arr                   ARR + projection

CHURN & RETENTION
  GET  /api/ops/churn                 Churn rate + churned tenants
  GET  /api/ops/retention/cohorts     Monthly cohort table
  GET  /api/ops/growth                New signups, trial conversion, net new

FINANCE
  GET    /api/ops/finanzas/pl         P&L: revenue - expenses = margin
  GET    /api/ops/finanzas/gastos     List operational expenses
  POST   /api/ops/finanzas/gastos     Create expense
  PUT    /api/ops/finanzas/gastos/:id Update expense
  DELETE /api/ops/finanzas/gastos/:id Delete expense

AUDIT
  GET  /api/ops/audit-log             Audit trail with filters

TEAM (Phase 3)
  GET  /api/ops/team                  Team members
  POST /api/ops/team                  Add member/agent

WEBHOOKS (Phase 4)
  POST /api/ops/webhooks              Register endpoint
  GET  /api/ops/webhooks/events       Delivery history
```

### AI Agent / Programmatic Access Contract

```
Auth:       Authorization: Bearer <api_key>
Format:     Content-Type: application/json (always)
Errors:     { error: string, code: string, retryable: boolean }
Pagination: { docs, total, page, totalPages, hasNext }
Audit:      All POST/PATCH/DELETE writes to audit_log with actor_type='ai_agent'
Freshness:  X-Data-As-Of: <ISO timestamp> header on all GET responses
```

---

## Page Designs

### /finanzas — P&L Dashboard
- 3 summary cards: Ingresos MRR | Gastos totales | Margen bruto %
- 6-month bar chart: revenue bars vs expenses line
- Breakdown tables: revenue by plan tier, expenses by category
- "Registrar gasto" quick action button

### /analytics — Growth & Retention
- MRR trend line chart (12 months)
- Net new tenants bar chart (new minus churned)
- Monthly cohort retention table
- Churn rate area chart with target line (< 3%)
- LTV estimate: avg tenure × avg MRR per tenant

### /auditoria — Audit Log
- Filterable table: actor, action type, resource, date range
- Actor badges: 🤖 ai_agent | 👤 human | ⚙️ system
- Detail panel: before/after payload for each action
- Quick filters: "Solo AI" | "Solo humanos" | "Solo errores"

---

## Implementation Phases

### Phase 0 — Interactive Cards + Real KPIs (2-3 days)
- Wrap all dashboard cards with `Link` + hover styles
- 3 new endpoints: /api/ops/mrr, /api/ops/churn, /api/ops/growth
- Replace 4 current cards with 12 KPIs in 3 rows
- Calculate MRR from existing tenants × hardcoded plan prices

### Phase 1 — Nav Restructure + Base Pages (3-4 days)
- New sidebar with 7 organized sections
- Create /finanzas with basic P&L (calculated revenue - manual expenses)
- saas_expenses table + CRUD
- /auditoria connected to existing audit_log

### Phase 2 — Analytics & Retention (4-5 days)
- tenant_events table + auto-registration on signup/churn
- mrr_snapshots table + monthly job
- /analytics with MRR trend, net new, churn rate
- Cohort retention table
- LTV estimation

### Phase 3 — Full Programmatic API (3-4 days)
- Real API Keys with scopes (UI in /configuracion/apis)
- All Phase 0-2 endpoints accessible via Bearer token
- audit_log records ai_agent vs human actor_type
- OpenAPI spec at /api/v1/openapi.json
- Basic webhooks: tenant.created, ticket.opened, payment.failed

### Phase 4 — Stripe + Full Accounting (post-MVP)
- Stripe webhooks → auto-register real MRR
- Real invoices from Stripe API
- Accounting export (CSV/PDF)

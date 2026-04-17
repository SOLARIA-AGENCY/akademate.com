# CEP Formación — Remediación técnica Marketing/Leads (2026-04-17)

## Alcance aplicado
- Métricas de campañas Meta: consolidación de mapeo de resultados/leads y endurecimiento de endpoints de campañas.
- Calidad operativa de leads: exclusión de `is_test` en vistas operativas y bloqueo de acciones sensibles sobre leads de test.
- Atribución y contexto comercial: enriquecimiento de `GET /api/leads/[id]` con `lead_program` para guion dinámico.
- UX comercial en ficha de lead (`/inscripciones/[id]`): guion visual reforzado, nombre del lead en mayúsculas/negrita, árbol de decisión completo y botones directos por estado.
- Analíticas Meta: lectura `snapshot-first` con fallback live y nuevo processor de sync en jobs.

## Cambios de código clave
- `apps/tenant-admin/app/api/leads/[id]/route.ts`
  - Enriquecimiento `lead_program` (convocatoria/curso/ciclo/precio/modalidad/horas/prácticas/financiación).
- `apps/tenant-admin/app/(app)/(dashboard)/inscripciones/[id]/page.tsx`
  - Guion comercial desglosado por programa real y árbol con estados CRM accionables.
- `apps/tenant-admin/app/api/analytics/dashboard/route.ts`
  - Estrategia de lectura de analíticas Meta desde snapshot con fallback live.
- `packages/jobs/src/processors/metaAnalyticsSync.ts`
  - Nuevo processor para sincronización periódica de snapshots Meta.

## Cobertura de pruebas ejecutadas
- API leads:
  - `tests/api/leads-create-route.test.ts`
  - `tests/api/leads-list-route.test.ts`
  - `tests/api/leads-dashboard-route.test.ts`
  - `tests/api/leads-route-id.test.ts`
  - `tests/api/leads-interactions-route.test.ts`
  - `tests/api/leads-enroll-route.test.ts`
- API Meta/analíticas:
  - `tests/api/meta-campaigns-route.test.ts`
  - `tests/api/meta-campaign-detail-route.test.ts`
  - `tests/api/meta-health-route.test.ts`
  - `tests/api/meta-ad-accounts-route.test.ts`
  - `tests/api/meta-webhook-leads-route.test.ts`
  - `tests/api/analytics-dashboard-route.test.ts`
- Unit:
  - `tests/unit/meta-graph-result-metric.test.ts`
  - `tests/unit/campanas.test.tsx`
  - `tests/unit/campanas-2026-filter.test.tsx`
- Jobs:
  - `packages/jobs/__tests__/jobs.test.ts`

## Estado final
- Cambios listos para release en rama principal.
- Validación técnica focalizada completada para superficies modificadas.

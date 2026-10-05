# IMPLEMENTATION PLAN — Akademate 100% Producto

**Fecha:** 17 Enero 2026
**Objetivo:** Completar producto end-to-end (técnico + funcional) hasta 100% entregable.
**Alcance:** Multitenancy core, API, auth, billing, ops/dashboard, tenant admin, campus, front pública, storage/media, feature flags, CI/CD, GDPR, E2E, docs.

## Decisión oficial de arquitectura — 2026-09-02

Akademate SaaS debe evolucionar a una plataforma completamente serverless y
Cloudflare-native. Esta decisión incorpora como fuente normativa el paquete
`AKA-ARCH-SAAS-001` Rev E, cuya referencia canónica está en
`docs/architecture/official/`.

### Runtime objetivo de Akademate

- Cloudflare Workers como runtime de las siete unidades:
  `akademate-app`, `akademate-control`, `akademate-integrations`,
  `akademate-media`, `akademate-events`, `akademate-automation` y
  `akademate-agents`.
- D1 Control más shards D1 de tenants mediante `TenantDataContext`.
- R2 con prefijos `tenants/{tenantId}/`.
- Durable Objects para coordinación, idempotencia, rate limiting, presencia y
  sesiones de agentes.
- Queues con DLQ y Workflows para procesos asíncronos.
- Cloudflare Stream para vídeo.
- Cloudflare Access para Platform Ops y Akademate Identity para usuarios de
  academias.

### Restricciones no negociables

- El core de Akademate no incorpora PostgreSQL, Redis, BullMQ, Docker ni un VPS
  como dependencias del runtime final.
- `akademate.com` y `www.akademate.com` permanecen en el Worker de marketing
  OpenNext.
- Las superficies SaaS, campus, API y operaciones deben migrarse al runtime
  Cloudflare definido en Rev E.
- El aislamiento de tenants debe pasar siempre por `TenantDataContext` y
  `tenantId`. No se permiten consultas directas sin contexto de tenant.
- Los agentes solo pueden modificar datos a través del Control API y de las
  políticas R0-R4.

### Analítica y optimización de leads

La analítica oficial de Akademate será Cloudflare Analytics Engine, con los
datasets definidos por la arquitectura:

- `platform_usage`
- `tenant_usage`
- `platform_health`
- `business_events`
- `ai_usage`
- `media_usage`

La captura de leads debe emitir eventos sin PII, incluyendo como mínimo:
`landing_view`, `cta_click`, `lead_form_view`, `lead_form_start`,
`lead_submit` y `lead_created`. El backend sigue siendo la fuente de verdad
para confirmar `lead_created` después de persistir el lead correctamente.

Los eventos deben conservar contexto útil para optimización, como campaña,
source, medium, página, formulario, placement y tenant. Nunca deben incluir
nombre, email, teléfono ni payload de formulario.

La disponibilidad se comprobará con Workers Logs, Traces y Metrics, además de
un monitor sintético externo que verifique las rutas públicas, autenticación y
una transacción crítica.

### Umami queda limitado a CEP OVH

Umami no forma parte del runtime ni de la analítica oficial de Akademate.
Queda reservado para `cepformacion.akademate.com`, cuya infraestructura sigue
siendo un despliegue clásico de servidor en OVH.

Para CEP OVH:

- Umami se instalará como proyecto Docker independiente.
- Tendrá PostgreSQL de analítica separado de la base de datos académica.
- Se publicará en `https://cepformacion-umami.akademate.com` mediante el
  Traefik de CEP y DNS de Cloudflare.
- El script de seguimiento se cargará únicamente en las páginas públicas de
  `cepformacion.akademate.com`, condicionado por
  `CEP_UMAMI_WEBSITE_ID`.
- El dashboard de control CEP mostrará un enlace externo a Umami dentro de
  `Web > Analíticas`. No se usará un iframe ni se compartirán sesiones entre
  orígenes.
- Su instancia, datos, backups y eventos permanecerán aislados de Akademate
  SaaS.

### Secuencia de migración

1. Mapear `UNIT-*`, rutas Wrangler y bindings del runtime oficial.
2. Crear D1 Control, shards iniciales y `TenantDataContext`.
3. Migrar almacenamiento a R2 y procesos asíncronos a Queues/Workflows.
4. Implementar los siete Workers y los cinco Durable Objects.
5. Migrar identidad, Access, Stream, Policy Engine y AI Gateway.
6. Instrumentar Analytics Engine y los eventos de lead.
7. Validar aislamiento, salud, transacciones sintéticas y observabilidad.
8. Retirar progresivamente PostgreSQL, Redis y los contenedores del runtime
   SaaS cuando cada unidad tenga paridad funcional y un rollback validado.

---

## Fase 0 — Preparación y control
1. Confirmar definición de “100%” y criterios de aceptación por módulo.
2. Consolidar backlog único (documentos + gaps reales en código).
3. Configurar métricas de progreso y reglas de “done”.

## Fase 1 — Bloqueos técnicos (compilación + types)
4. Resolver errores TS strict (prioridad P1) y habilitar typecheck estable.
5. Asegurar build limpio por paquete/app.

## Fase 2 — Plataforma base (multitenancy + auth + billing)
6. Completar multitenancy core (resolver dominio, claims, RLS hooks SDK/Payload).
7. Completar auth (staff/alumno, cookies httpOnly, RBAC, MFA ops).
8. Integración Stripe end-to-end (checkout, portal, webhooks, metering).

## Fase 3 — Producto funcional (apps)
9. Dashboard Ops (métricas, tenants, domains, billing overview).
10. Dashboard Cliente (CRM, media, branding, domains, catalog CRUD completo).
11. Front pública por tenant (SEO, páginas, forms con UTM/captcha).
12. Campus virtual (inscripciones, cursos, progreso, certificados).

## Fase 4 — Infra y jobs
13. BullMQ workers (email, webhooks, search sync) tenant-aware.
14. Storage & media (R2/MinIO, uploads presignados, thumbs).
15. Feature flags (rollout %, kill switches, UI control).

## Fase 5 — Compliance + CI/CD + QA
16. GDPR completo (endpoints + UI + jobs + auditoría).
17. CI/CD completo (lint/typecheck/test/build/security/e2e).
18. E2E críticos (Playwright + smoke + data seeding).

## Fase 6 — Documentación y release
19. ADRs iniciales + runbooks operativos.
20. Verificación final y checklist de release.

---

## Ralph Loop 2026-02 — Estabilización Post-Auditoría
1. Corregir suites con fallo en monorepo (notifications, realtime, configs de test locales).
2. Re-ejecutar suites objetivo y dejar evidencia auditable.
3. Endurecer endpoints LMS para entornos parcialmente migrados.
4. Ejecutar smoke audit live en NEMESIS y documentar estado final.

## Ralph Loop 2026-02-20 — Burn-down de Typecheck tenant-admin
1. Priorizar errores homogéneos de alto impacto (CollectionSlug/relations, hooks typedDoc).
2. Cerrar por lotes funcionales (Colecciones -> LMS APIs -> GDPR APIs -> Dashboard UI -> Stripe).
3. Gate obligatorio por iteración: `pnpm --filter @akademate/tenant-admin typecheck`.
4. Persistir evidencia por iteración en `LOGS.md` con delta de errores.
5. Estado 2026-02-20 (cierre): `typecheck=0 errores`, `lint=PASS`, `tests=37 files PASS`.

---

## Definition of Done (global)
- Build + typecheck + unit + e2e verdes.
- Feature complete por módulos clave.
- CI/CD operativo.
- GDPR y seguridad validados.
- Documentación mínima lista.

## Ralph Loop 2026-02-20 — Remediación Dashboard CEP (ejecución)
1. Estabilizar routing/layout en App Router para evitar runtime en navegación.
2. Cerrar fallos críticos de accesibilidad funcional (sidebar, administración, marketing, leads).
3. Sincronizar identidad de sesión en shell y perfil.
4. Validar con gate de typecheck de tenant-admin.

## Ralph Loop 2026-02-20 — Sistema y Unificación de Diseño (activo)
1. Resolver auth crítica transversal (Payload/Ops/Tenant) con pruebas de endpoint reales.
2. Corregir excepciones funcionales de producto (`web /cursos`, campus credenciales dev).
3. Ejecutar unificación visual por tokens y componentes shadcn entre servicios.
4. Cerrar con auditoría funcional + visual y veredicto GO/NO-GO.
5. Fuente de ejecución: `docs/audits/AKADEMATE_RALPH_LOOP_TASK_RUNNER_2026-02-20.md`.

## Ralph Loop 2026-02-21 — Homogeneización total de páginas tenant (activo)
1. Plan maestro de cobertura total por rutas: `docs/design/TENANT_DASHBOARD_HOMOGENIZATION_MASTER_PLAN_2026-02-21.md`.
2. Ejecutar iteraciones atómicas por página (1 página por loop) con gate de typecheck.
3. Desplegar incrementalmente en NEMESIS tras cada iteración validada.

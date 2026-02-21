# TASKS TODO — Akademate 100%

## 0) Preparacion y control
- [x] Consolidar backlog unico desde docs (remediation, handoff, milestones) -> TASKS_TODO atomico.
- [x] Definir criterios de "done" por modulo (tests, features, docs, seguridad).
- [x] Crear checklist global de release (pre-prod/prod).

## 1) TS strict (docs/STRICT_TYPES_MIGRATION.md)
- [x] Agregar jsx a tsconfig de packages/realtime.
- [x] Agregar jsx a tsconfig de packages/tenant.
- [x] Agregar jsx a tsconfig de packages/ui.
- [x] Corregir null checks y mocks en tests de packages/realtime.
- [x] Corregir tipos en packages/reports (pdf.ts).
- [x] Corregir zod enums en packages/types.
- [x] Limpiar variables no usadas (packages/realtime, packages/tenant).

## 2) GDPR end-to-end (docs/GDPR_FEATURES.md)
- [x] API export: apps/tenant-admin/app/api/gdpr/[userId]/export/route.ts.
- [x] API delete: apps/tenant-admin/app/api/gdpr/[userId]/delete/route.ts.
- [x] API consent: apps/tenant-admin/app/api/gdpr/[userId]/consent/route.ts.
- [x] UI GDPR settings page (tenant-admin).
- [x] Jobs retention en packages/jobs (BullMQ).
- [x] Tests unitarios + e2e para flujos GDPR.

## 3) CI/CD completo (docs/CI_CD_PIPELINE.md)
- [x] Actualizar workflows: lint, typecheck, unit tests + coverage.
- [x] Agregar paso E2E (Playwright) en CI.
- [x] Agregar build artifacts.
- [x] Agregar security scan (SCA/SAST) basico.
- [x] Documentar variables/secretos requeridos.

## 4) E2E criticos (docs/E2E_TESTS.md)
- [x] Auditar E2E existentes vs escenarios requeridos.
- [x] Implementar escenarios faltantes (auth, campus, admin, billing, GDPR).
- [x] Agregar data seeding/fixtures estables.

## 5) Multitenancy core (docs/specs/ACADEIMATE_SPEC.md)
- [x] Resolver dominio -> tenant (subdominio + custom domain).
- [x] Claims JWT con tenant_id + roles.
- [x] RLS hooks en Payload + SDK con tenant_id obligatorio.
- [x] Theming por tenant via CSS vars.
- [x] Assets en R2/MinIO namespaced por tenant.

## 6) Auth + seguridad (docs/PROJECT_MILESTONES.md)
- [x] Cookies httpOnly/secure.
- [x] CORS por tenant.
- [x] RBAC por tenant (staff/alumno/ops).
- [x] MFA TOTP para ops (SESSION_HANDOFF task 32).
- [x] Auditoria de operaciones sensibles.

## 7) Billing & Stripe (BILLING_UI_IMPLEMENTATION.md, SESSION_HANDOFF)
- [x] Stripe checkout + portal server-side.
- [x] Stripe webhooks handlers (task 35).
 - [x] Suspension por impago (webhooks invoice.payment_failed/paid -> tenant status).
 - [x] Metering basico (usage_meter + limites).
 - [x] Integrar UI billing con backend real.

## 8) Jobs/infra (SESSION_HANDOFF tasks 33,34,37)
- [x] Worker email (BullMQ).
- [x] Worker webhooks (BullMQ).
- [x] Worker search sync (BullMQ).
- [x] Observabilidad OTEL basica.

## 9) Storage & media (SESSION_HANDOFF task 23)
- [x] Integrar R2/MinIO + presigned uploads.
- [x] Media manager (tenant-admin).
- [x] Thumbs opcionales.

## 10) Feature flags (SESSION_HANDOFF task 24)
- [x] Flags por tenant/plan.
- [x] UI de rollout (% + kill switch).

## 11) Apps producto
- [x] Dashboard Ops (metrics, tenants, domains, billing overview).
- [x] Dashboard Cliente (CRM, branding, domains, catalog CRUD completo).
- [x] Front publica tenant (SEO, paginas, forms UTM/captcha).
- [x] Campus virtual (inscripciones, progreso, certificados).

## 12) Documentacion minima
- [x] ADRs iniciales (multitenancy, auth, storage, UI kit, CI/CD).
- [x] Runbooks base (backup/restore, incident, deploy).

## 13) Verificacion final
- [x] Full test suite + coverage target.
- [x] Smoke tests apps.
- [x] Security checklist + GDPR verification.
- [x] Crear COMPLETION.txt cuando todo pase.

## 14) Ralph Loop 2026-02 (post-auditoría runtime)
- [x] Corregir `packages/notifications` (test `replyTo` vs `reply_to`).
- [x] Corregir `packages/realtime` (`skipAuth` no respeta middleware esperado).
- [x] Ejecutar y cerrar batería de tests objetivo en verde (`web`, `auth`, `notifications`, `realtime`, `tenant-admin` runtime).
- [x] Ejecutar smoke audit live final en NEMESIS y registrar evidencia.
- [x] Corregir runtime `tenant-admin` en rutas de administración con error 500 (`roles`, `actividad`) y desplegar fix en NEMESIS.
- [x] Re-ejecutar auditoría integral multitenant con estado PASS (`docs/audits/platform-audit-2026-02-20T00-19-18-290Z.md`).

## 15) Ralph Loop 2026-02-20 (Typecheck tenant-admin a 0)
- [x] Normalizar `relationTo` y `tenantField` (CollectionSlug estricto) en colecciones Payload.
- [x] Corregir hooks `trackCourseRunCreator` y `trackEnrollmentCreator` (`typedDoc` inexistente).
- [x] Corregir `Campuses.ts` (`CampusData` debe satisfacer `TypeWithID`).
- [x] Corregir hooks de `Leads` (`captureConsentMetadata` con tipo de documento explícito).
- [x] Corregir helper `src/types/payload-helpers.ts` (index signature incompatible).
- [x] Corregir tipado de `AuditLogs` hooks + `src/hooks/auditLog.ts`.
- [x] Corregir bloque LMS API (`enrollments`, `lessons`, `modules`, `progress`, `campus/*`).
- [x] Corregir bloque GDPR API (`app/api/gdpr/**/*`).
- [x] Corregir bloque dashboard pages (`ciclos`, `medios`, `profesores`, `sedes`, `facturacion`).
- [x] Corregir `@payload-config/lib/stripe.ts` (firmas Stripe v20).

## 16) Ralph Loop 2026-02-20 (Dashboard Tenant CEP hardening)
- [x] Corregir arquitectura de layouts Next App Router (`<html>/<body>` solo en root layout).
- [x] Corregir navegación crítica de sidebar (`Dashboard`, `Administración`, `Marketing`, `Personal`).
- [x] Unificar identidad de usuario en header/perfil mediante sesión real (`/api/auth/session`).
- [x] Implementar endpoint faltante `GET /api/leads` para desbloquear módulo comercial.
- [x] Activar acciones básicas en Planner (tabs, exportar, imprimir).
- [x] Añadir formulario funcional de edición para sedes (`/sedes/[id]/editar`).
- [x] Endurecer `api/staff` para no romper runtime sin `DATABASE_URL` (degradación 503).
- [x] Gate de calidad: `pnpm --filter @akademate/tenant-admin exec tsc --noEmit --pretty false`.

## 17) Ralph Loop 2026-02-20 (Sistema + UI unificada)
- [x] Crear task runner ejecutable de iteraciones (`docs/audits/AKADEMATE_RALPH_LOOP_TASK_RUNNER_2026-02-20.md`).
- [x] Baseline técnico inicial de servicios y probes de auth.
- [x] Corregir `POST /api/users/login` en Payload (`500 Something went wrong`).
- [x] Validar/seed usuario `ops@akademate.com` superadmin y credenciales admin CMS.
- [x] Corregir integración auth de Ops contra Payload.
- [x] Corregir SSR exception en `web /cursos` con fallback estable.
- [x] Documentar credenciales dev de campus en launchpad.
- [x] Ejecutar unificación visual según tokens (Ops/Payload reference style).
- [x] Unificar login de Campus al patrón visual Ops/Payload (card + CTA gradiente + layout responsivo).
- [x] Auditoría visual final con evidencia y veredicto GO/NO-GO.
- [x] Cerrar deuda `typecheck` de `admin-client` (presign aws smithy + tipado sidebar asChild/ref).

## 18) Ralph Loop 2026-02-20 (Estandarización visual progresiva de headers)
- [x] Wave 1: estandarizar `PageHeader` + icono en `programacion`, `cursos`, `leads`, `analiticas`.
- [x] Wave 2: estandarizar `PageHeader` + icono en `dashboard`, `matriculas`, `lista-espera`, `alumnos`.
- [x] Wave 3: estandarizar `PageHeader` + icono en `administracion/*` y `configuracion/*`.
- [x] Wave 4: estandarizar `PageHeader` + icono en `contenido/*`, `web/*`, `estado`, `facturacion`, `ayuda`.
- [x] Wave 5: estandarizar `PageHeader` + icono en flujos `cursos/[id]`, `cursos/[id]/editar`, `cursos/[id]/convocatoria/[convocationId]`, `cursos/nuevo`.
- [x] Cierre: todas las páginas funcionales de `(dashboard)` usan `PageHeader`/`ComingSoonPage` (queda solo alias técnico `dashboard/page.tsx`).

## 19) Ralph Loop 2026-02-20 (Design System Image-Driven Rollout)
- [x] Iteración 1: baseline visual automático + informe de hallazgos (`docs/audits/tenant-visual-baseline-2026-02-20.md`).
- [x] Iteración 2: alinear shell global a grid spec (topbar 80, sidebar 240/80, spacing lateral).
- [x] Iteración 3: reemplazo inicial de hardcodes de color por tokens en módulos críticos (`ciclos*`, `programacion`, `planner`, `sedes*`) + mejoras de hover/activo sidebar colapsado.
- [x] Iteración 3.1: simplificar `sedes` (header compacto, eliminación de KPIs redundantes, cards/lista con densidad reducida y estilos por tokens).
- [x] Iteración 3.2: simplificar `ciclos-medio` (KPIs densos -> badges compactos, filtros en una sola línea, cards de ciclo con estructura homogénea).
- [x] Iteración 3.3: simplificar `ciclos-superior` (alineado a patrón compacto de `ciclos-medio`).
- [x] Iteración 3.4: simplificar `ciclos` general (eliminar bloque de 6 KPIs, compactar filtros y cards/lista con patrón homogéneo).
- [ ] Iteración 4: normalización de jerarquía tipográfica de cards (24/16/14/16).
- [ ] Iteración 5: integración de patrones pricing/budget/stepper en módulos funcionales.
- [ ] Iteración 6: QA transversal visual + contraste + estados.
- [ ] Iteración 7: cierre, deploy y veredicto GO.

## 21) Ralph Loop 2026-02-21 (Cobertura total por páginas)
- [x] Crear plan maestro de implementación integral por páginas en `docs/design/TENANT_DASHBOARD_HOMOGENIZATION_MASTER_PLAN_2026-02-21.md`.
- [ ] Ejecutar automatización iterativa por olas hasta cubrir 100% rutas de `(dashboard)`.

## 20) Storybook Tenant Admin (2026-02-20)
- [x] Investigar skill de Storybook e instalarlo en entorno de agente.
- [x] Inicializar Storybook en `apps/tenant-admin` con framework Next.js.
- [x] Crear stories iniciales de design system (`Button`, `Badge`, `Input`, `Card`, `PageHeader`).
- [x] Validar build de Storybook (`build-storybook`) y documentar roadmap de crecimiento.
- [ ] Integrar Storybook visual QA en loop de homogeneización de dashboard (pendiente CI + cobertura de módulos).

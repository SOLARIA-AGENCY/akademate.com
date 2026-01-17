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
- [ ] MFA TOTP para ops (SESSION_HANDOFF task 32).
- [x] Auditoria de operaciones sensibles.

## 7) Billing & Stripe (BILLING_UI_IMPLEMENTATION.md, SESSION_HANDOFF)
- [ ] Stripe checkout + portal server-side.
- [ ] Stripe webhooks handlers (task 35).
- [ ] Metering basico + suspension por impago.
- [ ] Integrar UI billing con backend real.

## 8) Jobs/infra (SESSION_HANDOFF tasks 33,34,37)
- [ ] Worker email (BullMQ).
- [ ] Worker webhooks (BullMQ).
- [ ] Worker search sync (BullMQ).
- [ ] Observabilidad OTEL basica.

## 9) Storage & media (SESSION_HANDOFF task 23)
- [ ] Integrar R2/MinIO + presigned uploads.
- [ ] Media manager (tenant-admin).
- [ ] Thumbs opcionales.

## 10) Feature flags (SESSION_HANDOFF task 24)
- [ ] Flags por tenant/plan.
- [ ] UI de rollout (% + kill switch).

## 11) Apps producto
- [ ] Dashboard Ops (metrics, tenants, domains, billing overview).
- [ ] Dashboard Cliente (CRM, branding, domains, catalog CRUD completo).
- [ ] Front publica tenant (SEO, paginas, forms UTM/captcha).
- [ ] Campus virtual (inscripciones, progreso, certificados).

## 12) Documentacion minima
- [x] ADRs iniciales (multitenancy, auth, storage, UI kit, CI/CD).
- [ ] Runbooks base (backup/restore, incident, deploy).

## 13) Verificacion final
- [ ] Full test suite + coverage target.
- [ ] Smoke tests apps.
- [ ] Security checklist + GDPR verification.
- [ ] Crear COMPLETION.txt cuando todo pase.

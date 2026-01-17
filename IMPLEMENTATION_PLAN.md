# IMPLEMENTATION PLAN — Akademate 100% Producto

**Fecha:** 17 Enero 2026
**Objetivo:** Completar producto end-to-end (técnico + funcional) hasta 100% entregable.
**Alcance:** Multitenancy core, API, auth, billing, ops/dashboard, tenant admin, campus, front pública, storage/media, feature flags, CI/CD, GDPR, E2E, docs.

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

## Definition of Done (global)
- Build + typecheck + unit + e2e verdes.
- Feature complete por módulos clave.
- CI/CD operativo.
- GDPR y seguridad validados.
- Documentación mínima lista.

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

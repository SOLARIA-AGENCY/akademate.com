# Akademate — Milestones y Dependencias (10 Dic 2025)

## Alcance y módulos
- Multitenancy core: dominio→tenant, claims JWT, RLS/hooks en Payload/SDK, theming por tenant, seeds superadmin.
- API + lógica: endpoints REST/GraphQL (tenants, users, memberships, courses, course_runs, leads), rate limiting por tenant, webhooks, API keys con scopes, validación zod, repos Drizzle.
- Auth & security: login staff/alumno con cookies httpOnly, MFA para ops, RBAC por tenant, auditoría completa.
- Billing & usage: Stripe (planes/checkout/portal), metering básico, suspensión por impago.
- Jobs/infra lógica: BullMQ+Redis, colas tenant-aware, reintentos (webhooks/email/search), observabilidad OTEL.
- Dashboards ops: métricas globales, health checks, flags, billing overview, gestión tenants/domains.
- Dashboard cliente: CRUD catálogo/convocatorias/sedes, páginas seccionables, blog/FAQ, leads CRM simple, branding/domains, media manager.
- Front pública por tenant: home/cursos/convocatorias/blog/páginas, SEO+sitemaps/OG/JSON-LD, formularios leads con UTM+captcha, custom domain.
- Campus virtual: matrículas, módulos/lecciones, materiales, evaluaciones simples, progreso, certificados.
- Storage & media: R2/MinIO, uploads presignados por tenant, thumbs opcional.
- Feature flags: rollout % y kill switches tenant-aware.
- CI/CD & runbooks: GH Actions lint/typecheck/test/build/migrate, pipelines preview, runbooks backup/restore, IaC scaffold.

## Milestones propuestos (ETA estimada por sprint)
- P0 Multitenancy Core — 1 sprint.
- P0 API + Lógica — 1–2 sprints (dep. multitenancy core).
- P0 Auth & Security — 1 sprint (dep. API base).
- P1 Billing & Usage — 1 sprint (dep. API + jobs).
- P1 Jobs/Infra lógica — 1 sprint (dep. API events).
- P1 Dashboard Ops — 1 sprint (dep. métricas/billing).
- P1 Dashboard Cliente — 2 sprints (dep. API content + storage).
- P1 Front Pública Tenant — 1–1.5 sprints (dep. resolver dominio + API content).
- P1 Campus Virtual — 2 sprints (dep. auth alumno + catálogo + storage).
- P2 Storage & Media — 0.5 sprint.
- P2 Feature Flags — 0.5 sprint.
- P2 CI/CD & Runbooks — 0.5 sprint.

## Dependencias clave
- Cerrar DB/Drizzle + Payload antes de fronts.
- Auth multitenant + RLS prerequisito para cualquier UI integrada.
- Stripe/meters necesita eventos y colas; Ops dashboard depende de esas métricas.
- Campus depende de catálogo, auth alumno y storage.

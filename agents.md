# AGENTS.md - Instrucciones para agentes (Akademate)

## Propósito
Guía rápida para agentes (Claude/Codex/Copilot) sobre el trabajo en este repo.

## Contexto
- Proyecto: Akademate (SaaS multitenant para academias/escuelas).
- Dominio principal: `akademate.com` (ej. `cepfp.akademate.com` o dominio custom).
- Spec principal: `docs/specs/ACADEIMATE_SPEC.md` (v1.5).
- Plan de arranque: `docs/PLAN.md`.
- UI kit: `https://github.com/SOLARIA-AGENCY/Academate-ui`.
- Referencia visual/funcional CEP: `https://github.com/SOLARIA-AGENCY/www.cepcomunicacion.com`.

## Stack objetivo
- Frontends: Next.js 15 (app router), Tailwind v4 + shadcn/ui, TypeScript estricto.
- Backend/API: Payload 3.67+ (Next), Postgres 16, Drizzle ORM.
- Infra/Jobs: Redis 7 + BullMQ, R2/MinIO para assets, OTEL para observabilidad.

## Multitenancy (crítico)
- Todas las entidades deben llevar `tenant_id`.
- Resolución de tenant por dominio (`akademate.com` subdominios o custom) y claims en tokens.
- RLS en hooks Payload y en SDK: filtrar SIEMPRE por `tenant_id`.
- Theming por tenant: CSS vars; assets en R2/MinIO namespaced por tenant.

## TailwindCSS v4 (crítico)
- Colores en `theme.colors`, NO en `theme.extend.colors`.
- PostCSS usa `@tailwindcss/postcss`.
- Revisar `docs/specs/ACADEIMATE_SPEC.md` para tokens/colores.

## Seguridad
- No usar `DEV_AUTH_BYPASS` en prod.
- Cookies httpOnly/secure; CORS por dominio de tenant.
- Rate limiting por tenant/user; auditoría en operaciones sensibles.

## CI/CD y tooling
- pnpm workspaces (`pnpm-workspace.yaml`), Node 22+, pnpm 9+.
- Configs base: `tsconfig.base.json`, `.prettierrc`, `.editorconfig`, `.nvmrc`.
- Próximo: ESLint base, Tailwind/PostCSS templates, workflows en `.github/workflows/`.

## Qué se espera ahora (resumen de PLAN)
- Scaffolds de apps: `ops`, `admin-client`, `campus`, `payload` (layouts/páginas stub).
- Packages: `types`, `ui` (shadcn/tokens), `api-client`, `db` (Drizzle base), `jobs` (BullMQ base).
- ADRs iniciales (multitenancy, auth, storage, UI kit, CI/CD) en `docs/adr/`.
- Workflows CI/CD placeholders (lint/typecheck/test/build, db plan).

## Notas de limpieza
- Evitar directorios voluminosos sin seguimiento que ralenticen análisis; añadir a `.gitignore` si aparece (ej. `apps/cms/@payload-config/components/ui/` en otros entornos).

## Estilo de comunicación CTO (memorizar y aplicar siempre)
- Ejecuta automáticamente todas las acciones posibles de forma programática sin esperar instrucciones adicionales.
- Output según formato “CTO Executive Output Style”:
  - Prioriza resumen ejecutivo (métricas/resultados/decisiones).
  - Detalle solo en excepciones: fallos, bloqueos, issues críticos.
  - Enfoca en next actions y decisiones.
  - Usa símbolos de estado: ✓ éxito, ⚠ parcial, ✗ fallo, 🚫 bloqueado, ⊘ omitido, 🔄 en progreso, 📌 requiere decisión.
  - Progreso para tareas multi-step: Progress [X/Y] y pasos marcados.
  - Tests: resumen (Total/Passed/Failed/Success Rate/Duration); solo detallar fallos o si se pide verbose.
  - Code snippets solo si demuestran bug, implementación a aprobar o se piden explícitamente; preferir referencias de archivo/línea.
  - Niveles de severidad: P0 crítico, P1 alto, P2 medio, P3 bajo.
  - Mantén carga cognitiva baja: conciso, estructurado, sin ruido.

---

## 🚀 SESIÓN: CEP FORMACIÓN - Enterprise Plan & Infraestructura Dedicada (2026-03-05)

**Status:** ✅ Investigación completada | 📋 Plan documentado | 🔄 Listo para Fase 1

### Resumen Ejecutivo
- **Cliente:** CEP FORMACIÓN (cliente principal/flagship)
- **Modelo:** Single-Tenant Dedicado en Hetzner
- **Precio:** €1,200/mes (vs €599/mes plan Enterprise SaaS)
- **Incluye:** Infraestructura dedicada, dominio propio, branding completo, soporte 24/7
- **Timeline:** 8-12 semanas (Fase 0-3)
- **Costo desarrollo:** ~€21,000 (ROI en 9 meses)

### Investigación Realizada

**Agente 1: Planes & Features** ✅
- 3 planes identificados: STARTER (€199/mes), PRO (€299/mes), ENTERPRISE (€599+/mes)
- Sistema de feature flags funcional pero incompleto
- Muchas features son promesas en UI sin backend (SSO, webhooks, audit logs)

**Agente 2: Arquitectura Deployment** ✅
- Docker Compose con 8 apps + PostgreSQL + Redis (arquitectura escalable)
- Multitenant con aislamiento por `tenantId` (ya implementado)
- Fácilmente replicable para instancia dedicada

### Decisiones Tomadas
1. ✅ **Opción:** Single-Tenant Dedicado (vs Multitenant o Híbrido)
2. ✅ **Dominio:** Propio (cepformacion.es)
3. ✅ **Hosting:** Hetzner (Frankfurt, FSN1)
4. ✅ **Gestión:** Dashboard central (multitenancy) + API Bridge para acceso a CEP

### Fases Implementación

```
FASE 0 (COMPLETADA)
└─ Investigación + Documentación ✅

FASE 1 (PRÓXIMA - 6 semanas)
├─ Preparar docker-cep-dedicated/
├─ Configurar Hetzner VPS
├─ Desplegar en Hetzner
├─ Conectar API Bridge al dashboard central
└─ Testing

FASE 2 (4 semanas)
├─ SSO/SAML/OIDC (40h)
├─ White-labeling (20h)
├─ Webhooks (30h)
├─ Audit logs (25h)
├─ API quotas (20h)
└─ Plan validators (25h)

FASE 3 (Mantenimiento continuo)
├─ BI & Analytics
├─ SCIM Directory Sync
├─ Autoscaling
└─ Performance tuning
```

### Documentación Generada
- **Plan completo:** `/root/.claude/plans/lexical-coalescing-tide.md` (350+ líneas)
- **Config referencia:** claude.md (en repo)
- **Estrutura carpetas:** Definida (docker-cep-dedicated/)
- **Variables .env:** Completamente especificadas
- **Nginx config:** Template para 6 dominios
- **Checklist:** Pre-deployment

### Work Items Próxima Sesión

**Alta Prioridad:**
- [ ] Crear rama: `deploy/cep-hetzner-phase1`
- [ ] Crear estructura: `infrastructure/docker-cep-dedicated/`
- [ ] Preparar `.env.cep` con valores
- [ ] Configurar VPS en Hetzner
- [ ] Desplegar docker-compose

**Features Críticas para Lanzamiento (Fase 2):**
- [ ] SSO/SAML/OIDC - Integración AD/Office365
- [ ] White-labeling - Remover branding Akademate
- [ ] Webhooks - Disparadores funcionales
- [ ] Audit logs - Sistema de auditoría
- [ ] API quotas - Validación de límites
- [ ] Plan validators - Restricciones por plan

### Puntos de Atención
- 🔑 **Aislamiento:** Ya implementado (tenantId en FK todas tablas)
- 🔑 **Dominios:** 6 subdominos necesarios (api, admin, dashboard, campus, portal, principal)
- 🔑 **BD:** PostgreSQL dedicada (akademate_cep)
- 🔑 **S3:** Hetzner S3 storage (cepformacion-media bucket)
- 🔑 **API Bridge:** Permitirá gestionar CEP desde dashboard central

### Referencias
- **Planes:** `/packages/types/src/billing.ts` (enums + pricing)
- **Feature Flags:** `/apps/tenant-admin/app/api/feature-flags/route.ts` (validación)
- **Schema:** `/packages/db/src/schema.ts` (tenant isolation)
- **Stripe:** `/apps/tenant-admin/@payload-config/lib/stripe.ts` (integration)
- **Access Control:** `/apps/tenant-admin/src/access/tenantAccess.ts` (RLS)

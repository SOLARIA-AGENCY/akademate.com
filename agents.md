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

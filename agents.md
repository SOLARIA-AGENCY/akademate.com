# AGENTS.md - Instrucciones para agentes (Akademate)

## Propósito
Guía rápida para agentes (Claude/Codex/Copilot) sobre el trabajo en este repo.

## Architecture description (print pack)

Canonical architecture reference from 2026-08-31. Implement against these packs before other specs when they conflict.

- Runtime print: `docs/architecture/official/` (`AKA-ARCH-SAAS-001`)
- UI print: `docs/architecture/ui/` (`AKA-ARCH-UI-001`)
- Interactive maps: `docs/architecture/archify/` (Archify HTML + JSON IR)
- Skill: `akademate-architecture-description` (repo: `.cursor/skills/akademate-architecture-description/SKILL.md`)
- Runtime PDF gate: `python3 ~/.cursor/skills/akademate-architecture-description/scripts/verify_print_pdf.py docs/architecture/official/AKA-ARCH-SAAS-001_v2.0.pdf --expect-pages 55`
- UI PDF gate: `python3 ~/.cursor/skills/akademate-architecture-description/scripts/verify_print_pdf.py docs/architecture/ui/AKA-ARCH-UI-001_v1.0.pdf --expect-pages 46 --needles "flowchart TB,SURF-DASH,ADR-U1,INGEST-JSON,You are implementing AKADEMATE UI,CAT-SHADCN,TenantBranding"`


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

## Learned User Preferences

- UI nueva con primitivos shadcn oficiales (MCP shadcn.io); no inventar componentes.
- Cabeceras de página: solo título (icono si aplica); sin subtítulo descriptivo ni microcopy de ayuda bajo campos.
- Branding CEP (`#f2014b`) no se pinta en akademate.com SaaS; CEP sirve para detectar hardcoded vs tenant-configurable.
- Tokens por defecto Akademate: azul eléctrico de marca, no teal/turquesa ni rojo CEP.
- No mezclar commits, imágenes Docker, DNS ni cuentas Cloudflare entre la línea SaaS akademate.com y CEP Formación OVH. No mover akademate.com de NAZCAMEDIA hasta que el dashboard CEP esté en `dashboard.cepformacion.com`.
- Commit no es deploy; builds `linux/amd64` en Nemesis, no en el Mac. No rebuild OVH/Docker ni merge a main salvo petición explícita. No cargar datos reales de academia hasta que la plantilla esté testeada a fondo.
- UI de producto en español; sin em dash ni ALL-CAPS con tracking en chrome público. Copy corporativo Akademate (BRIK64 Inc LLC) en inglés; contacto `hello@akademate.com`, no `hola@`.
- Sidebar compacta, sin scroll vertical ni línea de legales; misma altura que el header.
- Listados públicos: títulos en sentence-case; columnas alineadas (Ver curso / Matrícula abierta); vista lista = layout de convocatorias. Badge «Matrícula abierta» verde/blanco y fondo verde claro; «Matrícula cerrada» cuando pasa la fecha (Payload). Badges de tipo: desempleados azul/blanco, ocupados verde/blanco, privados rojo/blanco. Botones y badges en una sola línea; títulos largos con ellipsis.
- Menú hamburguesa móvil: subpáginas plegadas hasta el clic; el panel debe poder hacer scroll vertical.
- Orden del rail: Dashboard, Académico, Personal, Campus virtual, Marketing, Web, Finanzas, Administración, Configuración; analíticas viven dentro de Marketing y Web.
- Logos oficiales de colaboradores: nunca recortar; las marcas de partners se tratan como restricción de respeto.

## Learned Workspace Facts

- `cepformacion.com` lo sirve el Worker en `infrastructure/cloudflare/cepformacion-com/` (`MODE=origin-html`) más el `WebsiteRenderer` de Next (`cepformacion-app.akademate.com`, misma web que `cepformacion.akademate.com`); el listado del home sale de `GET /api/public/v1/catalog`. El Worker no abre Postgres, no pide rebuild Next en el VPS ni usa el host `cepformacion.app`. Arreglos visuales en vivo: reescritura en el Worker con lock de hidratación (`createElement`/`textContent`, no `innerHTML`).
- Apex `cepformacion.com/` está en `MODE=origin-html`; `/preview` redirige a `/`.
- Tokens CEP en hosts CEP: marca/CTA `#f2014b`, bloques oscuros `#3E091A`; prohibido `#0066CC` y `#2563eb`.
- `akademate.com` y `www.akademate.com` son el Worker Cloudflare `akademate-web`, no el contenedor Hetzner `akademate-web`.
- `/campus` es una página del chrome público (cabecera, menú y pie), no una landing suelta; el CTA del menú es Campus (sustituye a Contacto). `/campus-virtual` sigue en 404. No crear DNS de `campus.cepformacion.com`. Login nuevo desactivado con «próximamente»; el botón de campus actual apunta a `https://acaten.espacioaulavirtual.com/` sin nombrar ese LMS en la página.
- Tras dump Postgres sobre imagen más nueva, `PAYLOAD_DB_PUSH=true` no añade columnas; listings vacíos o 401 suelen ser schema lag o superadmin con `tenant_id` NULL (`withTenantScope(null)` → tenant equals `-1`).
- Home de cursos públicos: secciones privados / ocupados / desempleados, datos del dashboard, horas y modalidad presencial/teleformación; el badge de idiomas se acorta a «Idiomas».
- Nombres de sede en toda la web: CEP Norte, CEP Sur, CEP Santa Cruz; «Sede» es etiqueta, nunca parte del nombre.
- Asistencia es interna de técnicos (A / F / FJ), no visible al alumnado; umbrales 25% y 75% de horas; dos faltas seguidas alertan; tres faltas sin justificar son motivo de baja.
- Akademate es plantilla agnóstica de academia (deporte, yoga, coaching, etc.); copy de Tenerife o CEP no va hardcodeado.
- Media pública: proxificar solo `/api/media/file/*` contra el host de origen. Purge del Worker: el origen avisa por `POST /internal/purge` con HMAC; si falta el secret, el origen no pega y el Worker no debe 500.
- Login CEP usa identidad de host burgundy, no azul Akademate. Host canónico del dashboard: `dashboard.cepformacion.com` (migración desde `cepformacion-app.akademate.com`).

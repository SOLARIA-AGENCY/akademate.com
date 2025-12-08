# Akademate - Especificación Inicial (Spec-Driven) v1.5

## 0. Contexto y Objetivos
- Producto: SaaS multitenant para academias/escuelas (“Akademate”).
- Superficies:
  - Web pública por tenant (marketing completo, editable: cursos, convocatorias, sedes, blog/noticias, páginas, SEO, branding).
  - Dashboard cliente (admin del tenant): gestión de catálogo, contenido, campus, leads/matrículas, branding/dominios, seguridad.
  - Campus virtual (alumno): matrículas, materiales, evaluaciones, progreso, certificados, soporte.
  - Backoffice Payload (superadmin): soporte técnico y auditoría global.
  - Dashboard global Ops: visión de tenants, billing/usage, feature flags, salud, escalado, soporte.
- Stack: Next.js 15 (app router), TypeScript estricto, Tailwind v4 + shadcn/ui, Payload 3.67+, Postgres 16, Drizzle ORM, Redis 7 + BullMQ, R2/MinIO, OTEL.
- Filosofía: spec-driven, cero bypass de seguridad en prod, multitenancy estricto, UI/UX con accesibilidad AA, CI/CD con gates y migraciones aprobadas.
- Base UI/UX: reutilizar y extender componentes/patrones del repositorio `https://github.com/SOLARIA-AGENCY/Academate-ui` como kit de diseño y referencia de interacción (layouts, navegación, formularios, tablas, theming).
- Referencias visuales y funcionales adicionales: `https://github.com/SOLARIA-AGENCY/www.cepcomunicacion.com` (web pública CEP + admin CMS actual) para estilos, flujos de cursos/convocatorias y consumo de Payload.

## 1. Arquitectura y Multitenancy
- Resolución de tenant por dominio/subdominio (dominio → tenant_id) y por claims en tokens.
- Todas las entidades llevan `tenant_id`; índices compuestos con `tenant_id`.
- Acceso:
  - Dashboard cliente: RBAC por tenant (admin, editor, marketing, docente, soporte, lectura).
  - Campus: alumnos con scope de matrícula.
  - Ops/Backoffice: superadmin global con filtros por tenant.
- Hooks/guards:
  - Inyectar `tenant_id` en queries/mutations (Payload hooks y SDK).
  - Filtrar siempre por `tenant_id`; denegar si falta scoping.
- Theming: CSS vars por tenant; logos, paleta, tipografía, favicon; assets en R2/MinIO namespaced por tenant.
- Resolución de dominio:
  - Dominio principal: `akademate.com`. Ejemplo cliente: `cepfp.akademate.com` o dominio custom.
  - Web pública/campus detectan dominio en middleware; se inyecta `tenant_id` en context y en el SDK.
  - Payload expone endpoint `GET /resolve-tenant?host=<domain>` para SSR/edge.
- Autenticación:
  - Staff: JWT + cookie httpOnly; claims: `sub`, `tenant_id`, `roles`, `exp`, `iat`.
  - Alumnos: JWT + cookie httpOnly; claims: `sub`, `tenant_id`, `enrollments[]`.
  - Superadmin: scope global; se exige MFA.

## 2. Modelo de Datos (todas con `tenant_id`)
- Organización/Auth: tenants, users, roles, memberships, invitations, api_keys, feature_flags, limits/quotas, audit_logs, events.
- Catálogo: courses, course_runs (convocatorias), cycles, centers (sedes), schedules, pricing, modalities, instructors.
- Marketing/CRM: leads, contacts, campaigns, ads_templates, blog_posts, pages (CMS seccionables), faq_items, media/assets, redirects, seo_meta.
- Campus/Alumno: enrollments, modules/lessons, materials (video/pdf/link), assignments, submissions, grades, progress, certificates, announcements, attendance (opcional).
- Ops: status_checks, billing_usage, webhooks, job_events.
- Taxonomías: tags, categories (opcional).
- Campos clave (resumen):
  - `tenants`: id, name, slug, domains[], branding (colors, logo, favicon, fonts), status, plan, limits, createdAt/updatedAt.
  - `users`: id, email, name, password_hash, mfa_secret?, last_login, active.
  - `memberships`: user_id, tenant_id, roles[] (enum), status.
  - `courses`: id, tenant_id, title, slug, summary, description (richtext), cycle_id, tags[], featured, active, hero_media, seo_meta.
  - `course_runs`: id, course_id, tenant_id, center_id, modality, start_date, end_date, schedule, price, seats, status (draft/published/archived), publishedAt.
  - `centers`: id, tenant_id, name, slug, address, city, geo, phones, email, schedule, featured.
  - `leads`: id, tenant_id, contact info, source/utm, course_id?, course_run_id?, consent flags, status, assigned_to.
  - `enrollments`: id, tenant_id, user_id (alumno), course_id, course_run_id?, status (pending/active/completed/cancelled), payment_status, progress.
  - `pages`: id, tenant_id, slug, title, sections (json), seo_meta, publishedAt.
  - `blog_posts`: id, tenant_id, slug, title, content, author, tags[], cover, seo_meta, publishedAt.
  - `materials`: id, tenant_id, lesson_id, type (video/pdf/link), url/storage_ref, duration?, size?, drm? (futuro).
  - `certificates`: id, tenant_id, enrollment_id, issuedAt, template_ref, checksum, download_url.

## 2.1 Índices y rendimiento (resumen)
- `tenant_id` + `slug` en contenido (courses, pages, blog_posts).
- `tenant_id` + `publishedAt DESC` para listados.
- `tenant_id` + `course_id` + `start_date` en convocatorias.
- `tenant_id` + `status` en leads, enrollments.
- GIN para tags/FTS en cursos/blog si aplica.

## 3. Web Pública (por tenant)
- Páginas: home, cursos, curso detalle, convocatorias, sedes, sobre, contacto, blog, artículo, FAQ, noticias, acceso alumnos, checkout/inscripción, landing UTM, 404.
- SEO: meta por página, OpenGraph, JSON-LD, sitemaps por tenant, canonical, redirects gestionables.
- Contenido editable: páginas seccionables (hero, grid, CTA, testimonios), menús, footer, logos, favicons, colores.
- Datos dinámicos: cursos/convocatorias/sedes/blog/FAQ filtrados por `tenant_id`.
- Formularios: lead/contacto/inscripción con consentimiento RGPD; reCAPTCHA/hCaptcha opcional.
- SSR/RSC por defecto; revalidate opcional con webhooks de invalidación.
- Performance: fuentes optimizadas, imágenes con `next/image`, lazy-load, `@tailwindcss/postcss` y `theme.colors`.
- Navegación/SEO:
  - Sitemap por tenant (`/sitemap.xml`); feed RSS/Atom opcional.
  - Schema.org JSON-LD para curso, organización, breadcrumbs.
  - Redirecciones administrables (301/302) por tenant.
  - Etiquetas `hreflang` si multi-idioma.
- Personalización:
  - Paleta/branding inyectada en CSS vars; logos/favicons por tenant.
  - Menús y footers editables en `pages` o `navigation`.
- Datos:
  - Cursos/convocatorias listados con filtros (modalidad, campus, fecha, precio).
  - Sedeso: mapa + horarios/contacto.
  - Blog/noticias: listado y detalle; categorías/tags.
- Formularios:
  - Validación cliente + servidor; honeypot; spam protection opcional.
  - Tracking UTM y consentimiento RGPD almacenado en lead.

## 4. Dashboard Cliente (admin tenant)
- Módulos:
  - Catálogo: CRUD de cursos, ciclos, convocatorias, modalidades, pricing, instructores.
  - Sedes: gestión de centros, direcciones, horarios.
  - Contenido: páginas seccionables, blog, noticias, FAQ, menús, SEO per-page, media manager.
  - CRM/leads: leads, notas, asignación, estados, campañas, fuentes/UTM, pipelines simples.
  - Inscripciones: matrículas, estado de pago, facturación básica, export.
  - Branding/dominio: logos, paleta, tipografías, dominios/custom domains.
  - Campus: módulos/lecciones, materiales, evaluaciones, certificados, anuncios.
  - Config/Seguridad: usuarios/roles del tenant, API keys, webhooks, límites visibles, auditoría por tenant.
- UX: shadcn/ui + Tailwind v4; RHF + zod; tablas con filtros/orden; breadcrumbs; toasts; accesibilidad (focus, aria, contraste).
- Data: React Query/TanStack Query; invalidación tras mutaciones; optimistic updates donde aplique.
- Flujos clave:
  - Crear curso → módulos/convocatorias → publicar.
  - Crear página seccionable (hero + secciones) con preview draft; publicar con SEO.
  - Gestionar leads: vista kanban/simple lista, asignar asesor, cambiar estado, notas.
  - Configurar dominios: agregar dominio, verificar (DNS), activar; fallback subdominio.
  - Branding: subir logo/favicons, definir paleta/tipografías; previsualización en vivo.
- Gestión de media:
  - Upload a R2/MinIO con `tenant_id` en path; pre-sign URLs; transformación de imágenes (thumbs) opcional.
- Seguridad UI:
  - Roles/permissions aplicados a botones y vistas; no mostrar acciones sin permiso.
  - Confirmaciones para operaciones destructivas; soft-delete opcional.

### 4.1 Dashboard Cliente - Secciones detalladas
- **Inicio/Resumen**
  - KPIs: leads nuevos, inscripciones, conversión, cursos publicados, sesiones web.
  - Alertas: dominios pendientes de verificación, cuotas/límites, tareas pendientes.
- **Catálogo**
  - Cursos: tabla + filtros; editor con richtext, SEO, hero, tags, featured.
  - Convocatorias: tabla con fechas, modalidad, sedes; capacidad; estado (draft/published/archived).
  - Ciclos/Áreas: CRUD de categorías académicas.
  - Sedes: CRUD con mapa, horarios, contactos.
  - Instructores: perfil, bio, redes, asignación a cursos.
- **Contenido**
  - Páginas seccionables (hero, grids, testimonios, FAQs, CTA); builder simple.
  - Blog/Noticias: editor richtext/MDX; portada; tags/categorías.
  - FAQ: entradas agrupadas; ordenamiento; visibilidad.
  - Menús/Footers: items personalizados con orden y destinos.
  - Media Manager: subida/búsqueda; carpetas virtuales; metadatos básicos.
- **Marketing y CRM**
  - Leads: lista/kanban; filtros por estado, campaña, asesor; notas; asignación.
  - Campañas: fuentes/UTM; performance básica; plantillas de ads (ads_templates).
  - Formularios: configuración de campos, consentimientos, captcha; destino de webhooks/email.
- **Inscripciones y Pagos (MVP sin gateway o con gateway opcional)**
  - Inscripciones: estado (pending/active/completed/cancelled), pago (pending/paid), curso/convocatoria.
  - Export CSV; actualización manual de pagos; integración futura con pasarela.
- **Branding y Dominios**
  - Paleta/typography; logos (light/dark), favicons.
  - Dominios: alta/edición; verificación DNS; estado; fallback subdominio.
- **Campus (config)**
  - Módulos/lecciones: estructura de curso; orden; requisitos.
  - Materiales: vídeos (link/storage), PDFs, links; duración; tamaño.
  - Evaluaciones: quizzes/entregas simples; puntuación.
  - Certificados: plantilla; firma/checksum; caducidad opcional.
- **Usuarios y Roles (Tenant)**
  - Usuarios staff del tenant; invitaciones; roles; MFA opcional.
  - Logs de acceso básico; revocar sesiones/keys.
- **Webhooks y API**
  - API Keys por tenant; scopes; rotación.
  - Webhooks de eventos (lead.created, enrollment.updated, etc.); retries; logs.
- **Auditoría**
  - Cambios en contenido, permisos, dominio, pagos, certificados.
  - Filtros por usuario/fecha/acción.
- **Ajustes**
  - Idioma/locale; zona horaria.
  - Límites/cuotas visibles (planes).
  - Notificaciones: email de sistema; plantillas básicas.

## 5. Campus Virtual (alumno)
- Acceso: login alumno (JWT/cookie httpOnly) scoped a tenant; matrículas ligadas a `tenant_id`.
- Vistas: mis cursos, detalle curso, materiales (video/pdf/link), tareas y envíos, evaluaciones simples, progreso, certificados descargables (PDF), anuncios/notificaciones, soporte/tickets.
- Control de acceso: solo cursos matriculados; bloqueo si pago pendiente (futuro).
- Integración aula virtual por enlace (Zoom/BBB/WebRTC embebido).
- Funciones:
  - Progreso por módulo/lección; requisitos (completar en orden opcional).
  - Evaluaciones básicas (quizzes/entregas) con calificación simple.
  - Certificados: generación on-demand; verificación por checksum/URL.
  - Notificaciones: anuncios del curso; email opcional; in-app toasts.
  - Soporte: formulario/ticket scoped a curso; notifica a staff del tenant.

## 6. Backoffice Payload (superadmin)
- Collections visibles con filtros por tenant; impersonación segura a dashboard cliente; herramientas de soporte y auditoría.
- Sin bypass de auth; CORS/CSRF adecuados; rate limit interno.
- Operaciones:
  - Búsqueda global por tenant; correcciones de datos; migraciones puntuales.
  - Auditoría: trazabilidad de cambios críticos (leads, enrolments, pagos).
  - Flags: activar/desactivar features por tenant/plan.

## 6bis. Dashboard Global Ops (Academate)
- Propósito: vista global para el equipo de operaciones/soporte.
- Secciones:
  - **Tenants**: listado con estado, plan, límites, dominios, uso (leads, inscripciones, storage).
  - **Health**: métricas p95/p99, RPS, errores, lag de colas; checks por servicio (API, DB, Redis, storage).
  - **Billing/Usage**: consumo por tenant; comparación con plan; alertas de sobreuso; export.
  - **Feature Flags**: activar/desactivar features por tenant/plan.
  - **Tickets Soporte**: bandeja central; SLA; asignación a agentes; etiquetado; estados (open/pending/solved).
  - **Incidentes**: timeline de incidentes; impacto; mitigación; postmortem links.
  - **Jobs/Colas**: estado de colas BullMQ; lag; fallos; reintentos; pausar/reanudar.
  - **Backups/DR**: estado de backups recientes; verificación; disparar restore test.
  - **Seguridad**: eventos sensibles (roles, claves, dominios); MFA cumplimiento; bloqueos.
  - **Dominios**: lista global de dominios; estado de verificación; conflictos.
- Acceso: solo superadmin; MFA obligatorio; todas las acciones auditadas.
- Integración con Payload: lectura/escritura vía API privada; algunas acciones pueden ir directo a DB/infra (runbooks).

## 7. API y SDK
- API: Payload REST/GraphQL + rutas Next personalizadas (webhooks, preview, acciones campus).
- SDK (`packages/api-client`): resuelve tenant por dominio, añade headers/tokens; helpers list/find/mutate; manejo de depth/paginación; soporte revalidate/invalidate.
- RLS en hooks: filtrar por `tenant_id`; denegar si falta scoping; sets automáticos en create/update.
- Endpoints clave (REST):
  - `GET /api/courses?where[tenant_id]=...&where[active]=true&depth=2`
  - `GET /api/course-runs?where[tenant_id]=...&where[status]=published&sort=start_date`
  - `POST /api/leads` (tenant por dominio/header; valida consentimiento)
  - `POST /api/enrollments` (requiere auth alumno o sesión admin)
  - `POST /api/webhooks/cache-invalidate` (payload → frontend)
  - `GET /api/resolve-tenant?host=...`
- SDK:
  - Resolver `tenant_id` por host (cacheado).
  - Firmar peticiones con token de servicio cuando aplique.
  - Manejar revalidate tags por recurso/tenant; invalidar tras mutaciones.

## 8. Jobs y Colas (BullMQ + Redis)
- Colas: lead.created, campaign.sync, stats.rollup, backup.daily, llm.ingest, certificate.generate, mailer, cache-invalidate, webhooks dispatcher.
- `tenant_id` en payload; concurrency configurable; retries con backoff; DLQ opcional.
- Monitorización de lag y fallos; alertas.
- Ejemplos:
  - `lead.created`: notifica email/whatsapp, asigna asesor, registra evento.
  - `campaign.sync`: sync métricas externas (Meta/Ads); guarda en `campaigns`.
  - `stats.rollup`: agrega métricas por tenant (leads, inscripciones, conversión).
  - `backup.daily`: dumps de Postgres + snapshots Redis; subir a storage seguro.
  - `certificate.generate`: render PDF, firmar checksum, subir a storage.

## 9. Observabilidad, Seguridad, RGPD
- OTEL: trazas, métricas (Prometheus/OpenMetrics), logs estructurados; dashboards por tenant y global.
- Salud: checks de API, DB, Redis, colas, storage; surfaced en Ops.
- Seguridad: MFA staff, bloqueo por intentos, CORS por dominio de tenant, cookies httpOnly/secure, rate limiting por tenant y user, auditoría de acciones (quién/qué/cuándo/tenant).
- RGPD: consentimiento en formularios, export/erasure por tenant, retención configurable, auditoría de accesos a PII.
- Logs: nivel info/debug por entorno; sin PII en logs; correlar por trace_id.
- CSP/headers: aplicar security headers (CSP, HSTS, X-Frame-Options, etc.) ajustados por tenant si hay subdominios.
- Auditoría: escribir eventos en `audit_logs` para cambios de seguridad, roles, pagos, certificados, borrados.

## 10. Infra y Escalado (Hetzner)
- Nodo inicial: VPS 4-8 vCPU, 16-32 GB RAM; Postgres (vertical first), Redis; MinIO/R2 externo.
- LB (Hetzner LB o Nginx/HAProxy) para múltiples nodos app; JWT stateless preferible.
- Escalado: umbrales (CPU/RAM >70%, p95>250ms, lag colas, conexiones DB) → playbook para provisionar nodo y registrar en LB; colas pesadas separadas.
- Backups: Postgres (pg_dump) + Redis RDB; verificación; restore playbook probado.
- Storage: assets fuera de disco local; nombres con `tenant_id`.
- Playbook de escalado:
  - Medir umbrales → disparar IaC (Terraform/Ansible) para nuevo nodo.
  - Registrar nodo en LB; desplegar release estable; healthcheck.
  - Mover colas pesadas a worker dedicado si lag > umbral.
- DB:
  - Pgbouncer opcional; vacuum/analyze; alertas por conexiones y tamaño por tenant.

## 11. CI/CD (GitHub Actions)
- Pipelines:
  - `ci`: lint (eslint), typecheck (tsc), test (vitest), build (Next/Payload), check Tailwind v4.
  - `db`: plan/lint migrations Drizzle; aprobación antes de aplicar.
  - `deploy-staging`: build Docker, push, migrate staging, smoke tests.
  - `deploy-prod`: gated; blue/green/rolling; smoke tests; rollback script.
  - `security`: dependabot + audit (npm audit/trivy).
- Environments/secrets: POSTGRES_URL, REDIS_URL, PAYLOAD_SECRET, JWT_SECRET, R2/MINIO, SMTP, DOMAIN config, OAUTH (futuro).
- Artefactos: imágenes Docker multi-stage por app; etiquetas SHA.
- Gates:
  - No deploy si tests/migraciones fallan o sin aprobación.
  - Migraciones deben ser reversibles o con plan claro.
- Smoke tests post-deploy: health endpoints, DB connect, Redis, endpoints clave (courses, leads).

## 12. Estructura de Monorepo (propuesta)
```
/
├─ apps/
│  ├─ ops/             # Dashboard global
│  ├─ admin-client/    # Dashboard cliente
│  ├─ campus/          # Campus alumno
│  └─ payload/         # Next + Payload API
├─ packages/
│  ├─ db/              # Drizzle schema/migrations/seeds
│  ├─ types/           # TS + zod
│  ├─ ui/              # shadcn/ui + tokens
│  ├─ api-client/      # SDK multitenant
│  └─ jobs/            # Procesadores BullMQ
├─ infra/
│  ├─ docker/          # Dockerfiles, compose
│  ├─ terraform/ansible# Hetzner + LB
│  └─ scripts/         # backups, restore, scaling
├─ .github/workflows/  # CI/CD
└─ docs/
   ├─ specs/           # Dominio, API, UI, ops, seguridad
   ├─ adr/             # Decisiones
   └─ runbooks/        # Incidentes, DR, scaling
```

## 13. UI/UX Mejores Prácticas
- Tailwind v4: `theme.colors` + `@tailwindcss/postcss`; tokens de diseño en CSS vars por tenant.
- shadcn/ui + componentes propios; layouts fluidos; contraste AA; accesibilidad (aria, teclado, focus).
- Formularios: RHF + zod; mensajes de error claros; loading/empty states; toasts.
- Listados: tablas con filtros/búsqueda/paginación; acciones bulk; feedback optimista donde aplique.
- Navegación: breadcrumbs en admin/campus; menús claros; estados activos visibles.
- Performance: RSC/SSR; streaming donde aporte; lazy-load imágenes/video; `suspense` para datos.
- Contenido editable: secciones configurables en páginas; menús y footer editables; SEO por página.
- Patrones de feedback:
  - Skeletons para datos; estados vacíos útiles; toasts/alerts claros.
  - Confirmaciones en acciones destructivas; undo si es posible (soft-delete).
- Accesibilidad:
  - Focus ring visibles; labels y aria; contraste ≥ AA; navegación teclado completa.
- Internacionalización futura: separar textos en recursos; no hardcodear strings clave.
- Kit base:
  - Importar estructura de estilos, temas y componentes del repo `SOLARIA-AGENCY/Academate-ui`.
  - Ajustar tokens (spacing, radii, sombras) para Tailwind v4; mapear componentes shadcn al kit existente.
  - Reutilizar patrones de navegación, grids, cards, tablas y formularios del kit para consistencia.

## 14. Lógica y Código (prácticas)
- TS estricto; tipos en `packages/types`; zod para contratos y validación.
- Drizzle: schema centralizado; migraciones versionadas; seeds mínimas (superadmin, tenant demo).
- Payload: collections con access control + hooks para `tenant_id`; sin bypass; CORS per-tenant.
- SDK: fuente única para API; errores tipados; retries básicos; SSR/edge safe.
- Tests: vitest + testing-library; mocks de fetch; pruebas de access control (tenant scoping); smoke e2e en staging.
- Seguridad en código: no logs con secretos; sanitizar richtext; rate limit en rutas sensibles; headers de seguridad (CSP opcional).
- Estilo:
  - ESLint + Prettier; import sorting; sin `any`; narrow types.
  - Server components por defecto; client components solo cuando se necesite estado/efectos.
  - Evitar lógica de negocio en componentes UI; usar hooks/servicios.
- Datos:
  - React Query: claves incluyen `tenant_id`; invalidar tras mutaciones.
  - Error boundaries y retry donde tenga sentido.

## 15. Plan de Fases
- Fase 0: Repo base, pnpm workspaces, TS estricto, ESLint/Prettier/Husky, Tailwind v4 correcto, CI mínima.
- Fase 1: Drizzle schema multitenant + seeds; Payload collections + hooks RLS; API client base; mocks UI (Ops, Admin, Campus, Web pública).
- Fase 2: Conectar UI a Payload real; auth multitenant; media R2/MinIO; leads/inscripciones; contenido editable (páginas/blog/faq/SEO/menús), branding/dominios.
- Fase 3: Campus funcional (módulos, materiales, evaluaciones, certificados), pagos/integraciones, observabilidad completa, RGPD y auditoría.
- Fase 4: Escalado/HA (LB + nodos), backups/restore probados, auto-capacity playbook, seguridad avanzada, performance tuning.
- Fase 5: Pulido final, CI/CD completa con gates, runbooks y ADR cerrados.

## 16. Puntos Críticos a Blindar
- Tailwind v4: colores en `theme.colors` (no en `extend`), PostCSS `@tailwindcss/postcss`.
- Sin `DEV_AUTH_BYPASS` en prod; CORS por dominio; cookies httpOnly/secure.
- Siempre filtrar por `tenant_id`; denegar operaciones sin scope.
- Web pública/campus: resolver tenant por dominio y aplicarlo en SDK/API.
- Cache/ISR solo con invalidación por webhooks; default SSR/RSC.
- Backups y DR probados; observabilidad desde el día 1; CI/CD con gates y migraciones aprobadas.

# Mapping master. 2026-08-28

Fase 0 del spec `AKADEMATE-MASTER-ARCHITECTURE-2026-08-28.md` seccion 27.1 y 30. Inventario del monorepo real frente al modelo objetivo. Metodo. AUDITAR, mapear KEEP/EVOLVE/SPLIT/DEPRECATE/NEW, migrar por capability. Sin big-bang. Sin tablas paralelas cuando el existente puede evolucionar.

Leyenda

- KEEP. Se queda como esta. Compatible con el objetivo.
- EVOLVE. Misma entidad, columnas o semántica nuevas. Expand then contract.
- SPLIT. Una tabla o collection actual cubre dos conceptos del spec.
- DEPRECATE. Sale del core. No borrar en esta fase.
- NEW. No existe equivalente. Crear.

Owner canonico de dominio transaccional. `packages/db` (PostgreSQL + Drizzle). Payload es CMS/editorial. ADR-002 del spec.

---

## 1. Inventario del monorepo

### Apps

| App | Rol actual | Frente al spec |
| --- | --- | --- |
| `apps/web` | Marketing akademate.com | KEEP. Fuera de checkout/Stripe (orden). |
| `apps/tenant-admin` | Backoffice operativo + web publica del tenant. Payload 3 + Next. Schema integer serial. | EVOLVE callers hacia Application Services. No es el corazon del dominio. |
| `apps/campus` | Superficie alumno/docente. Course-centric, stub en partes. | EVOLVE en Fase 3. |
| `apps/ops` | Panel interno de plataforma. | EVOLVE a Control Plane (Accounts, registry, cells). |
| `apps/admin-client` | Ops SaaS (tenants, impersonation, metricas). | EVOLVE. |
| `apps/portal` | Launchpad login campus/admin. | KEEP. |
| `apps/payload` | Payload CMS mas cercano al schema UUID de `packages/db`. | EVOLVE como CMS. No como ledger. |

### Packages

| Package | Rol | Accion |
| --- | --- | --- |
| `packages/db` | Schema Drizzle UUID, RLS, tenants/users/memberships. | EVOLVE. Corazon P0. |
| `packages/types` | TenantId, UserClaim, AuditEvent, billing. | EVOLVE. |
| `packages/tenant` | Resolucion host/header/cookie. | EVOLVE (ActorContext, capabilities). |
| `packages/auth` | JWT, password, RBAC, session, MFA. | EVOLVE (ActorContext en claims mas adelante). |
| `packages/api` | Handlers, GDPR, rate limit, otel. | KEEP. GDPR EVOLVE a Consent/DSR en Fase 7. |
| `packages/catalog` | Course schema/publication. | EVOLVE a Offering en Fase 2. |
| `packages/leads` | Scoring/conversion. | KEEP (Fase 2+). |
| `packages/lms` | Progress, gamification. | EVOLVE (Fase 4). |
| `packages/operations` | Attendance, calendar, enrollment. | EVOLVE (Fase 3). |
| `packages/notifications` | Email templates. | EVOLVE a Communication Hub (Fase 6). |
| `packages/jobs` | Workers, webhooks, search, GDPR retention. | KEEP. Outbox en fase posterior. |
| `packages/realtime` | Socket.io. | KEEP. |
| `packages/reports` | PDF/Excel. | KEEP. |
| `packages/imports` | CSV. | KEEP. |
| `packages/ui` | Tokens/theming. | KEEP. |
| `packages/api-client` | HTTP client. | KEEP. |
| `packages/mcp-server` | MCP. Default URL CEP. | EVOLVE (Fase 6). Quitar default CEP. |

### Dual schema. Hecho observado, no deseo

Hay dos modelos de persistencia con los mismos nombres de tabla y PKs incompatibles.

| Capa | PKs | Tenancy | Locations | Personas | Aislamiento |
| --- | --- | --- | --- | --- | --- |
| Payload operativo (`apps/tenant-admin`) | serial integer | `tenants` + `users.tenant_id` (1 user = 1 tenant) | collection `campuses` (sedes) | users, staff, students, leads | Access control Payload. Sin RLS Postgres. |
| Drizzle (`packages/db`) | uuid | `tenants` + `memberships` N:N | `centers` | `users` globales + `instructors` | RLS `app.tenant_id`::uuid |

Produccion de tenant-admin (leads, sedes, convocatorias) usa las tablas serial. Billing en tenant-admin importa tablas Drizzle (`subscriptions`, `invoices`). No unificar PKs en P0. El core canonico evoluciona Drizzle. Payload se mapea, no se duplica un tercer modelo.

### Auth / RBAC / RLS

- Payload. `users.role` enum `superadmin|admin|gestor|marketing|asesor|lectura`. Un tenant por usuario. Superadmin sin tenant.
- `@akademate/auth`. Roles `superadmin|admin|gestor|instructor|student`. Permisos `resource:action`. Course-centric.
- Better Auth. Tablas `sessions`, `accounts` (OAuth), `verifications` en Drizzle.
- RLS. `packages/db/src/rls`. Policies SQL castean uuid. `withTenantContext` solo aceptaba enteros. Gap. EVOLVE a UUID + entero.
- Payload no tiene RLS. ADR-001 (2026-01-27) eligio access control de aplicacion. El spec exige RLS en pooled. P0 anade RLS en el schema Drizzle y tests de aislamiento. Payload serial queda como deuda documentada, no como fork.

### Finance

- Drizzle. `subscriptions`, `invoices`, `payment_methods`, `payment_transactions` atados a Stripe y al plan SaaS (`starter/pro/enterprise`). Mezcla Platform Billing con vocabulario de academia.
- Payload. `tenants.limits` (maxUsers, maxCourses, maxLeads, storage). `entidades-financiadoras` son grantors, no la razon social del tenant.
- Plan limits. `PLAN_LIMITS` cuenta sedes/cursos/ciclos. No hay capabilities de producto.

SPLIT en Fase 2/7. Academy Finance vs Platform Billing. P0 no toca Stripe ni `apps/web`.

### CMS / Payload

Collections (33). Tenants, Users, Cycles, Campuses, Classrooms, AreasFormativas, EntidadesFinanciadoras, Courses, CourseRuns, PlanningConflicts, Students, Enrollments, Staff, Campaigns, AdsTemplates, Leads, BlogPosts, FAQs, Media, Modules, Lessons, LessonProgress, Materials, Submissions, Attendance, Certificates, Badges, UserBadges, PointsTransactions, UserStreaks, ApiKeys, CourseTypes, AuditLogs.

Ownership. CMS/editorial KEEP en Payload (BlogPosts, FAQs, Media, AdsTemplates). Transaccional EVOLVE hacia Drizzle (Tenants, Users/People, Enrollments, Attendance, finance).

### Integrations

Meta CAPI/ads, Mailchimp, WhatsApp, GA4/GTM, Stripe, S3, webhooks, MCP. El core no debe importar proveedores. EVOLVE a Provider Adapters (Fase 6). P0 no los reescribe.

---

## 2. Mapa de entidades P0 (objetivo vs actual)

### Account / OrganizationGroup

| Actual | Accion | Notas |
| --- | --- | --- |
| No existe grupo contractual. | NEW `organization_groups` | `accounts` de Better Auth es OAuth. No reutilizar. |
| Payload `tenants` = academia + branding + limits + features. | EVOLVE el tenant Drizzle. Extraer el grupo. | Un grupo agrupa N tenants fiscales. |

### Tenant

| Actual | Accion | Notas |
| --- | --- | --- |
| Drizzle `tenants` (plan, status, mrr, domains, branding). | EVOLVE | Anadir organizationGroupId, blueprint, organizationModel, deploymentMode, regionId, cellId, deploymentId, timezone, locale, currency, config. |
| Payload `tenants` serial. | EVOLVE mas tarde | Mismo concepto, otro PK. No dual-write en P0. |
| `plan` enum `starter/pro/enterprise`. | KEEP valores, EVOLVE semantica | Mapping Launch=starter, Business=pro, Enterprise=enterprise. No recrear el enum. Plan != Deployment. |

### LegalEntity

| Actual | Accion | Notas |
| --- | --- | --- |
| No existe. Contacto del tenant Payload no es CIF. | NEW `legal_entities` | V1. 1 Tenant = 1 LegalEntity primaria. `entidades-financiadoras` es Funding, no LegalEntity. |

### Location / Campus

| Actual | Accion | Notas |
| --- | --- | --- |
| Drizzle `centers`. | EVOLVE como Location | Añadir locationKind, timezone, isPrimary. No renombrar la tabla. |
| Payload `campuses` (sedes fisicas). | SPLIT | Payload mezcla Location fisica y Campus de experiencia. UI dice "Sedes". |
| Drizzle no tiene campuses. | NEW `campuses` | kind physical/virtual/hybrid, locationId opcional. |
| Payload `classrooms`. | KEEP | Resource. Fase 5. |

### Person + memberships + ActorContext

| Actual | Accion | Notas |
| --- | --- | --- |
| Drizzle `users` (email unique global, password, MFA). | EVOLVE como Person + UserIdentity | Misma fila. givenName, familyName, locale, timezone, status. No tabla `persons` paralela. |
| Payload `users` (1 tenant, 1 role). | SPLIT | Login + rol tenant-scoped. Impide Person global. |
| Payload `staff` (sin tenant_id). | EVOLVE | InstructorEngagement/Staff. Gap de aislamiento. |
| Payload `students` + `leads` (enrollments.student → leads). | SPLIT | CRM vs alumno. Objetivo. Person + StudentRelationship. Fase 2. |
| Drizzle `memberships` (user, tenant, roles[]). | EVOLVE | Es TenantMembership. Unique (userId, tenantId). |
| AccountMembership. | NEW `organization_group_memberships` | Pertenecer al grupo no da acceso a todos los tenants. |
| ActorContext. | NEW (tipo + contexto RLS) | actorType, actorId, purpose, correlationId, channel. |

### Blueprint / OrganizationModel / Plan / Deployment

| Actual | Accion | Notas |
| --- | --- | --- |
| Blueprint. | NEW `blueprints` + `tenants.blueprint_key` | Catalogo. PROFESSIONAL_TRAINING por defecto. Custom CEP = version heredada, no `if tenant == CEP`. |
| OrganizationModel. | NEW columna `organization_model` | single_tenant / multi_location / multi_tenant_group / franchise. |
| Deployment. | NEW columna `deployment_mode` | managed_cloud / dedicated_cloud / on_premise. Independiente del plan. |
| `tenants.plan`. | KEEP | Dimension comercial. |

### Capability / Policy / FeatureFlag

| Actual | Accion | Notas |
| --- | --- | --- |
| No hay capabilities de producto. | NEW `capabilities` + `tenant_capabilities` | Catalogo del apendice B. |
| `feature_flags` (default, overrides, planRequirement). | EVOLVE | Solo rollout/experiment (`purpose=rollout`). No producto. |
| Payload `tenants.settings.features.*`. | DEPRECATE como entitlement | Checkboxes muertos (enableLeads...). Sustituir por capabilities. |
| `PLAN_LIMITS` sedes/cursos/ciclos. | EVOLVE | Limites de plan. No capabilities. |
| Classroom `usage_policy`. | KEEP | Policy de recurso, no Policy Engine. |
| Policy Engine. | NEW `policies` | attendance, cancellation, access, payment, ai, privacy, campus_adoption. |

### AuditEvent + correlation IDs

| Actual | Accion | Notas |
| --- | --- | --- |
| Drizzle `audit_logs`. | EVOLVE | correlationId, actorType, purpose, organizationGroupId, channel, policyDecision. |
| Payload `audit-logs` (sin tenant). | EVOLVE | Añadir tenant en fase posterior. P0 no dual-write. |
| correlation IDs. | NEW | `ActorContext.correlationId` + `app.correlation_id` en RLS. |

### regionId / cellId / deploymentId

| Actual | Accion | Notas |
| --- | --- | --- |
| No existe. | NEW columnas en `tenants` | Defaults `eu` / `eu-01` / `eu-01`. Control plane futuro. |

---

## 3. Resto del dominio (mapa, no implementar)

| Entidad objetivo | Actual | Accion | Fase |
| --- | --- | --- | --- |
| Offering | `courses` | EVOLVE nombre/semantica. No renombrar tabla ahora. | 2 |
| OfferingRun | `course_runs` | EVOLVE. Ya es la edicion. | 2 |
| Phase | no | NEW | 2 |
| Session | `calendar_events` / `live_sessions` / Payload schedule jsonb | SPLIT | 3 |
| Enrollment | `enrollments` | EVOLVE. Separar CommercialAgreement. | 2 |
| CommercialAgreement / PriceComponent / BillingPlan | price en course + course_run + enrollments | SPLIT | 2 |
| FundingAgreement | `entidades-financiadoras` + subsidy fields en courses | EVOLVE | 2 |
| Entitlement | no. Plan limits. | NEW | 2 |
| Product / Order / Cart | no (salvo invoices Stripe plataforma) | NEW | 2 |
| InstructorProfile / Engagement / Assignment | `instructors` + Payload `staff` | SPLIT | 3 |
| Venue / PartnerOrganization / PracticePlacement | no | NEW | 5 |
| Booking / Waitlist | no | NEW | 3 |
| AttendanceRecord / Evidence | `attendance` | EVOLVE | 3 |
| AccessGrant / AccessEvent | no | NEW | 3 |
| LearningPath / Lesson / ContentAsset | `modules`, `lessons`, `materials` | EVOLVE | 4 |
| Assessment / ExamAttempt / QuestionBank | `assignments` + `submissions` + `grades` | SPLIT | 4 |
| AcademicRecord / Credential | `certificates` | EVOLVE | 4 |
| GuardianRelationship | emergency_contact en students | EVOLVE | 3/5 |
| Communication Hub | `packages/notifications` | EVOLVE | 6 |
| Workflow / Automation | no | NEW | 6 |
| IntegrationConnection | tokens en tenants Payload | EVOLVE | 6 |
| AgentIdentity / Grant | no | NEW | 6 |
| PlatformSubscription / UsageMeter | `subscriptions.usageMeter` | EVOLVE | 7 |
| OutboxEvent | no | NEW (spec 27.2, fuera de esta orden) | 1b |
| Consent / DSR / Retention | `packages/api/gdpr` | EVOLVE | 7 |

---

## 4. Acoplamientos Course-centric

El atomo academico actual es Course, no Offering.

- Tablas. `courses` (catalogo + precio + SEO). `course_runs` (edicion). `modules.courseId` cuelga del curso, no del run. `assignments.courseId` obligatorio. Leads y campaigns apuntan a Course, no al run.
- Enrollments ya van a `courseRunId`. Ese camino se conserva.
- UI/API. `/cursos`, `CourseSchema`, plan limits cuentan cursos, campus `/course/[slug]`.
- Taxonomia CEP horneada en courses. `privado|ocupados|desempleados|teleformacion|ciclo_*`. Es un Vocabulary Pack de PROFESSIONAL_TRAINING, no un enum global eterno.

P0 no canonicaliza Offering. Lo registra para Fase 2.

---

## 5. Conditionals tenant-specific (CEP)

No hay `if (tenantId === 'CEP')` literal. El efecto es el mismo. CEP es el default implicito.

Patrones

- Host `cepformacion` / `cep-formacion` / slug que contiene `cep`.
- localhost tratado como CEP (`tenant-host-branding.ts`).
- Tenant id `1` como fallback (`dashboard/route.ts`, `notifications`).
- Website default = `CEP_DEFAULT_WEBSITE`. Home publica aplica `applyCepHomeOverrides()` a todos.
- Branding, WhatsApp, emails, JSON-LD, footer status, MCP default URL.

Congelar excepciones CEP nuevas. El equivalente de producto es Blueprint `PROFESSIONAL_TRAINING` + overrides versionados + capabilities (`academic.regulated_programmes`, `academic.phases`, `finance.funding`, `academic.external_practices`). No forks de vertical.

---

## 6. Ownership de tablas (Drizzle P0)

```
CONTROL PLANE (sin RLS)
  organization_groups
  organization_group_memberships
  blueprints
  capabilities
  feature_flags          (rollout global + overrides jsonb)
  users                  (Person global)
  accounts/sessions/verifications  (Better Auth. KEEP)

TENANT OPERATIONAL (RLS tenant_id)
  tenants                (row propia, no RLS de aislamiento cruzado)
  legal_entities
  memberships
  centers                (Location)
  campuses
  tenant_capabilities
  policies               (tenant_id NULL = default de plataforma, visible)
  audit_logs
  + tablas de dominio existentes (courses, enrollments, ...)
```

---

## 7. Plan de migracion P0 (reversible)

1. Expand. Nuevas tablas y columnas NULL/DEFAULT. Sin DROP. Sin rename.
2. Backfill idempotente. Un organization_group por tenant existente (slug del tenant). Una legal_entity primaria. Un campus default hybrid. region/cell/deployment por defecto.
3. Verify. Tests de schema, isolation, ActorContext, plan != deployment, capability != flag.
4. Contract. Fuera de P0. No borrar Payload serial ni `settings.features`.

Rollback. Revertir la migration 0005 (DROP de tablas nuevas y columnas). Datos de negocio previos no se tocan. Feature flags de producto no se usan para activar el modelo. Capabilities son el producto. Flags solo rollout.

Riesgo principal. Dual schema Payload integer vs Drizzle UUID. Correr esta migration contra la DB Payload serial fallaria o crearia tablas paralelas. Aplicar solo al Postgres del schema Drizzle / entorno que ya usa `packages/db`.

---

## 8. Lo que P0 no hace

- Fases 2 a 7.
- Dual-write Payload.
- Checkout/Stripe en `apps/web`.
- Deploy, merge a main, OVH, Hetzner.
- `if tenant == CEP` nuevos.
- Outbox, ObjectStorageProvider, health baseline (spec 27.2 extra, fuera de la orden).
- Renombrar `courses` a `offerings`.
- Inventar tenants o metricas.

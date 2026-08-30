> **Objetivo:** Especificación ejecutable del runtime **Akademate Cloud SaaS** (Cloudflare-native, serverless-first). El dominio académico vive en el [Master Spec](./AKADEMATE_MASTER_ARCHITECTURE_SPEC.md). Este documento no reescribe Person, Enrollment, Campus P1 ni Finance. Primera acción: AUDITAR, no implementar.

# AKADEMATE — Cloudflare-native Autonomous SaaS

Versión 1.1 — 29 de agosto de 2026  
Contrato de ejecución: [cloudflare-native/MASTER_EXECUTION_PROMPT_v2.0.md](./cloudflare-native/MASTER_EXECUTION_PROMPT_v2.0.md) (modos, B-000…B-110, first-response).  
Fuentes verificadas: [cloudflare-native/SOURCES.md](./cloudflare-native/SOURCES.md)

Changelog 1.1: ingest prompt v2.0; PHASE 0 control (`docs/bootstrap/`, `docs/architecture/current-state.md`); IDs B-*; clasificación `ADAPT`; mapa ADR Appendix E → `0016`–`0020` sin renumerar.

---

# 0. Cómo usar este documento

Hay **dos deployments**, un **solo Core**:

| Track | Runtime | Persistencia | Quién |
| --- | --- | --- | --- |
| Cloud SaaS | Cloudflare Workers + Queues + Workflows | Control D1 + tenant shards D1 + R2 | Launch / Business / Enterprise managed |
| Enterprise On-Prem | Docker + Next + Payload | PostgreSQL + object storage S3-compatible | Dedicated / on-premise (el Master Spec §28) |

Compartido: Domain, Application Services, Policies, Capabilities, Event schemas, Campus identity P1.  
Separado: Persistence Adapter, Deployment Adapter, Object Storage, Observability, IaC.

> **Regla:** `TenantDataContext` es el único camino a datos de tenant. Ningún módulo de negocio elige D1 o Postgres a mano.

```text
AUDITORÍA → MAPEO KEEP/EVOLVE → ADAPTERS → SHADOW → CUTOVER POR CAPABILITY
Nunca StudentV2 / TenantNew / CourseRun2 si la entidad actual puede evolucionar.
```

Human vs agente: [HUMAN_BOOTSTRAP.md](./cloudflare-native/HUMAN_BOOTSTRAP.md) y [AGENT_CHECKLIST.md](./cloudflare-native/AGENT_CHECKLIST.md).

---

# 1. Resumen ejecutivo

Akademate Cloud SaaS debe operar sin VPS en el path crítico: DNS, WAF, compute, colas, orquestación durable, SQL serverless, objetos y vídeo VOD en Cloudflare. El marketing `akademate.com` **ya** corre en Worker `akademate-web` (OpenNext). Tenant-admin, campus y ops siguen hoy en contenedores: esa es la brecha, no la landing.

BRIK64 Inc. (Delaware) es foundry. Akademate es producto aislable (IP, cloud, git, datos, secretos, P&L). Exit-ready desde el día 1.

Autonomía: Control API + MCP + políticas R0–R4. Los agentes no tocan D1, Secrets Store ni tokens root. Paperclip es referencia conceptual, no dependencia.

---

# 2. Principios

1. Un Core canónico. Dos adapters de persistencia.
2. Shared corporate layer + isolated product infrastructure + continuous exit readiness.
3. Identidades institucionales (`admin@akademate.com`), no cuentas personales como raíz.
4. Capability beta de Cloudflare no es dependencia crítica sin fallback GA.
5. Deny by default. Least privilege. Short-lived credentials.
6. PREVIEW → VALIDATE → APPROVE → COMMIT → VERIFY en R3/R4.
7. No tool sprawl. Cada SaaS externo debe perder contra un equivalente Cloudflare o contra “no hace falta aún”.
8. El dominio (Master Spec) no se simplifica porque el runtime sea serverless.

---

# 3. Estructura corporativa y Product Genesis

```text
BRIK64 Inc. (Delaware)
  corporate: legal, Stripe/Mercury iniciales, foundry
  |
  +-- BRIK64 (otros productos)
  +-- AKADEMATE  ← este perímetro
  +-- futuros SaaS (mismo estándar)
```

## 3.1 BRIK64 Product Genesis Standard

Por cada producto: identity, cloud account, git org o repo perimeter, data, secrets, CI/CD, observability, developer apps, customer data, billing analytics y **exit package** aislados. Legal/finance corporativo se comparte solo mientras convenga.

| Activo | Owner producto | Custodia corporativa | Transferible |
| --- | --- | --- | --- |
| Zona DNS akademate.com | Akademate CF account | — | sí |
| Workspace @akademate.com | Akademate | — | sí |
| GitHub org/repo | Akademate | BRIK64 hasta split | sí |
| Vaults 1Password AKADEMATE—* | Akademate | Org 1P BRIK64 hasta org propia | sí |
| Stripe product codes / P&L | Akademate | Stripe BRIK64 hasta entidad propia | sí |
| D1 / R2 / Stream | Akademate CF | — | export + recreate |
| Customer contracts | Akademate legal | BRIK64 paper inicial | assignment |

Procedimiento de transferencia (runbook, no código): inventario → rotar credenciales → mover zona CF / Workspace / GitHub / vaults → reemitir OAuth apps → export D1+R2+Stream inventory → novación de contratos. Evidencia en ledger, secretos nunca en git.

## 3.2 Identidad Akademate

Human: personas con passkeys/MFA, cuentas `@akademate.com`.  
Institutional: `admin@`, `security@`, `billing@`, `legal@`, `support@`, `infra@`.  
Service: API tokens Cloudflare scoped, GitHub Apps, OAuth clients.  
AI Agent: `AgentIdentity` + `AgentGrant` (Master Spec §18).  
Break-glass: vault ROOT & RECOVERY, dual control, uso auditado, rotación post-uso.

GCP: organización/proyectos **propios** de Akademate (`akademate-bootstrap`, `akademate-integrations-{dev,staging,prod}`). No reutilizar GCP BRIK64. GCP **no** es runtime SaaS; solo OAuth/Calendar/Meet/Drive/Workspace APIs. Verificar nomenclatura en docs Google al bootstrap.

## 3.3 1Password

Fuente de verdad de **credenciales root humanas**. Runtime: Cloudflare Secrets Store (BETA; fallback Worker secrets GA). GitHub: solo secretos mínimos de CI.

Vaults: `AKADEMATE — ROOT & RECOVERY`, `CLOUDFLARE`, `GITHUB`, `GOOGLE`, `MICROSOFT`, `ZOOM`, `AI PROVIDERS`, `PAYMENTS`, `PRODUCTION`, `DISASTER RECOVERY`.

Agentes **nunca** leen el vault root. Flujo: humano o tool aprobada → credencial de corta duración → operación.

---

# 4. Mapa de servicios Cloudflare

Consultado 2026-08-29. Beta no es path crítico.

| Producto | Clase | Uso Akademate |
| --- | --- | --- |
| DNS, CDN, WAF, DDoS, SSL | CORE | Zona akademate.com + SaaS hostnames |
| Workers Paid | CORE | BFF, Control API, campus cloud, ops |
| D1 | CORE | Control DB + tenant shards (V1). Per-tenant físico = target |
| R2 | CORE | documentos, backups, media no-Stream, exports |
| Queues | CORE | Domain events, outbox consumers |
| Workflows | CORE | provisioning, GDPR, imports, billing recon (GA) |
| Secrets (Worker) | CORE | runtime secrets GA |
| Custom Domains + Cloudflare for SaaS | CORE | `*.akademate.com` y `campus.cliente.com` |
| Turnstile | CORE | abuse en login/leads |
| Access / Zero Trust | CORE | ops, preview, admin internos |
| Stream | RECOMMENDED | VOD campus. Metering storage+delivery |
| Analytics Engine | RECOMMENDED | telemetría de plataforma, no OLTP |
| Workers Observability (logs/traces) | RECOMMENDED | default; OTEL-compatible |
| Cron Triggers | RECOMMENDED | schedules de dominio |
| AI Gateway | RECOMMENDED | cuando haya LLM; no bypass de Policy |
| Durable Objects | OPTIONAL V1 / CORE selectivo | locks, presence, live session, agent runtime. No sustituyen D1 |
| Secrets Store | OPTIONAL (BETA) | account-level; fallback Worker secrets |
| Email Sending | OPTIONAL (BETA) | transaccional; **EmailProvider** obligatorio (Resend/Postmark) |
| Email Routing | RECOMMENDED | inbound institucional → Workspace o Worker |
| Hyperdrive | OPTIONAL bridge | Postgres existente durante migración Cloud, no destino final Cloud |
| Workers for Platforms | FUTURE | automations custom del tenant, no Core |
| Containers | FUTURE | Payload u otros procesos no-Workers si el audit lo exige |
| Vectorize / Workers AI | FUTURE | search/RAG; no Core V1 |
| Browser Rendering | FUTURE | agents de docs; R2 |
| KV | DO NOT USE para dominio | config efímera ok; no source of truth académico |
| Pages | DO NOT USE nuevo | marketing ya en Workers; no abrir segundo runtime |
| VPC / Magic | DO NOT USE V1 | On-Prem no se “enchufa” al Cloud Core |
| Akademate SMTP propio | DO NOT USE | |

---

# 5. Arquitectura de datos Cloud SaaS

## 5.1 TenantDataContext

```text
Request
  → identity (campus_session | payload-token | ops | agent grant)
  → tenant resolution (host / claim, nunca tenantId del cliente como autoridad)
  → authorization (RBAC/ABAC + ResourcePolicy)
  → TenantDataContext.open(tenantId)
  → store: D1TenantDataStore | PostgresTenantDataStore
  → domain operation
  → outbox en la misma transacción/batch
```

Paquetes objetivo:

| Package | Responsabilidad |
| --- | --- |
| `@akademate/domain` | entidades y reglas (ya conceptuales en Master Spec) |
| `@akademate/application` | use cases, policies |
| `@akademate/persistence-d1` | D1TenantDataStore, ControlDb |
| `@akademate/persistence-postgres` | On-Prem / bridge |
| `@akademate/storage` | ObjectStorageProvider (R2 o S3) |
| `@akademate/runtime-workers` | bindings, queues, workflows |
| `@akademate/runtime-node` | Docker/Next |

## 5.2 Control DB (`AKADEMATE_CONTROL_D1`)

Organization/Account, Tenant, Subscription, Plan, GlobalIdentity index, TenantMembershipIndex, TenantDatabaseMapping (tenant → shard o db uuid), Lifecycle, PlatformAudit, AgentRegistry, PlatformConfiguration, Metering counters.

Sin PII académica masiva. Sin ledger del tenant.

## 5.3 Tenant data: V1 shards, target per-tenant

Docs D1 (2026-04-21): per-tenant es el diseño oficial; 50k DBs/account Paid; 10 GB/DB **no aumentable**; un DB es **single-threaded**; ~**5.000 bindings por Worker**. No hay API documentada `getD1(uuid)` en el binding del Worker.

Por eso V1 **no** promete 10.000 bindings estáticos:

```text
V1 (ejecutable ahora)
  CONTROL_D1
  + TENANT_SHARD_D1_00 … TENANT_SHARD_D1_N   (N << 5000, p.ej. 16–64)
  + mapping tenantId → shardId en Control
  + tenant_id DENTRO del shard (defense in depth)

Target (cuando attach dinámico esté GA y verificado)
  1 D1 por tenant, provisionado por Workflow
  Worker de tenant o loader dinámico con un solo binding
```

Si un tenant supera ~8 GB o saturación single-thread: split a D1 dedicado (EVOLVE, no rediseño).

SQL: SQLite. Auditar Postgres-specific (RLS nativo, tipos, JSONB, citext, exclusion constraints). Equivalente Cloud: **aislamiento por DB/shard + políticas server-side**. No fingir RLS de Postgres en D1.

Sessions API + bookmarks: usar en lecturas; read replication es **beta**. Writes siempre primary.

Time Travel: 30 días Paid. Complementar con export programado a R2 (portabilidad).

## 5.4 Qué no va a D1

Vídeo, PDFs pesados, dumps, certificados binarios, grabaciones → R2 o Stream. D1 guarda metadatos (`VideoAsset.streamUid`, object keys).

---

# 6. Object storage (R2)

Keys: `t/{tenantId}/{class}/{yyyy}/{uuid}`  
Clases: `media`, `private-documents`, `certificates`, `exports`, `backups`, `audit-archive`.

Signed URL upload/download. Validar content-type y tamaño en Worker. Versioning en buckets de backup. Lifecycle por RetentionPolicy (Master Spec §20). Cuota en Control DB. Malware: pipeline asíncrono (Queue); no bloquear el request path V1 más que MIME+size. Cifrado en reposo (R2 default) + TLS.

On-Prem adapter: mismo contrato, backend S3/MinIO.

---

# 7. Vídeo

## 7.1 VOD: Stream (RECOMMENDED)

`VideoAsset`: tenant, offering/run/lesson/session, streamUid, duration, status, accessPolicy, recordingSource. Playback con signed tokens. Creator/direct upload. Metering: storage minutes + delivered minutes (precios oficiales al facturar). Transcripts/subtitles si el producto Stream lo cubre; si no, job a R2. Deletion y retención tenant-scoped. No guardar blobs en D1.

## 7.2 Live: BYO provider (V1)

Akademate **no** paga Meet/Zoom/Teams del tenant. `VideoConferenceProvider`: GoogleMeet, Zoom, MicrosoftTeams. Futuro: `AkademateLiveProvider` vía [RealtimeKit](https://developers.cloudflare.com/realtime/realtimekit/) (FUTURE, docs 2026-08-25; virtual classrooms nativas). `ClassSession` no cambia.

OAuth: `TenantIntegration` + tokens cifrados (Secrets Store / Worker secret por conexión, no en D1 en claro).

## 7.3 Teleformación

La videollamada no es la fuente académica. Eventos join/leave/start/end → `AttendanceEvidence` → `AttendanceRecord` según AttendancePolicy (Master Spec §11, §14).

---

# 8. Eventos, Queues, Workflows, Durable Objects

```text
Domain command (transaction/batch en Tenant store)
  → OutboxEvent (mismo commit)
  → Queue publisher
  → Consumer idempotente (idempotency key)
  → proyección Analytics Engine / integraciones
  → DLQ + alerta
```

Queues: at-least-once (reintentos + DLQ). Diseñar consumidores idempotentes. No asumir exactly-once.

Workflows (GA): TenantProvision, TenantOffboard, GdprExport, GdprErase, BulkImport, RecordingIngest, IntegrationProvision, BillingReconcile, CredentialGenerate, DeployOrchestration. `waitForEvent` para aprobaciones humanas R3.

No mover reglas de precio, elegibilidad de examen o asientos contables a un Workflow “porque existe”. El Workflow orquesta; Application Service decide.

Durable Objects: EnrollmentLock, LiveSession presence, AgentRuntime, TenantRuntime mutex. Nunca como SQL general.

Analytics Engine: salud de plataforma, usage, errores, adopción. No BI sobre miles de Tenant DB. MRR/ARR desde Platform Billing, no desde ledgers de academias.

---

# 9. Superficies Cloud

| Host | App | Protección |
| --- | --- | --- |
| akademate.com | marketing Worker (ya existe) | WAF + Turnstile en forms |
| app / `{tenant}.akademate.com` | tenant-admin cloud | sesión Payload o equivalente |
| `campus.{tenant}.akademate.com` o custom | campus | `campus_session` host-only (Master §5.5 / §22.6) |
| ops.akademate.com | control plane | **Cloudflare Access** + IAM app, no solo login de producto |
| api.akademate.com | Control API | mTLS/Access o signed service tokens |

Ops muestra tenants, usage, billing, health, agents, incidents. Drill-down vía Control API. **Prohibido** consola D1 arbitraria desde el browser de ops.

Custom domains: Cloudflare for SaaS (hasta 50k hostnames PAYG, docs mayo 2025). Fallback origin originless + Worker. Validación DCV. No custom hostname = apex de la zona SaaS.

Campus identity P1 (badges, invite, no User Payload para docente) aplica igual en Cloud: el adapter no cambia el contrato.

---

# 10. AutonomousOps

No desplegar Paperclip. Adoptar: Agent, Role, Goal, Task, Budget, Approval, Heartbeat, AgentRun, Audit, cost tracking.

Runtime: Agents SDK + Workflows + Queues + DO para estado. Tools = Control API / MCP. Sin SQL, sin vault root, sin Docker socket.

Roles: Support, Customer Success, SRE, Security, Developer, Finance Monitor, Billing, Product, Docs.

Risk:

| Clase | Ejemplos | Autonomía |
| --- | --- | --- |
| R0 | lectura pública / análisis | automatic |
| R1 | reversible (draft email, flag off en preview) | automatic with policy |
| R2 | cambio prod operacional | approval or dual según policy |
| R3 | billing, auth, schema, notas, security | approval required |
| R4 | delete tenant, legal, root, fiscal | dual approval o never |

Los agentes no auto-elevan grants.

Graph loops: OBSERVE → INTERPRET → PLAN → EXECUTE → VERIFY → RECORD → LEARN. Incident, customer success, security, billing, capacity. GitHub Issues como tracker (no Linear V1).

---

# 11. CI/CD y self-healing

```text
Issue → branch → PR → CI (lint/type/unit/contract)
  → Preview Worker
  → Staging (isolated D1+R2)
  → E2E + security + migration dry-run
  → risk class
  → prod gradual (Workers versions)
  → health
  → rollback version
```

Branch protection, CODEOWNERS, secret scanning, dependency scanning, SAST. Signed commits: RECOMMENDED, no bloqueo V1. SBOM en releases.

Self-healing: telemetría → incident → SRE agent (R0/R1) → issue → coding agent → PR → CI → staging → approval si R2+ → prod → verify → close. Sin acceso root.

---

# 12. Observabilidad y uptime

Preferir Workers Logs/Metrics/Traces, D1/Queue/Workflow/R2/Stream analytics, Security Analytics, AI Gateway.

Sentry / Prometheus / Grafana / Loki / Uptime Kuma: **OPTIONAL**. Introducir solo si un SLO no se cubre. Instrumentar `traceId`, `requestId`, `correlationId`, `tenantId`, `releaseId`, `actorId`, `agentId` sin PII innecesaria.

Uptime externo (fuera de Cloudflare, p.ej. sondeo desde otro proveedor): akademate.com, app, api, ops, `/health`. Independiente del plano CF.

---

# 13. Email, billing, metering

Human mail: Google Workspace.  
Transactional: `EmailProvider` (Cloudflare Email Sending **beta** + Resend o Postmark GA).  
Agent mail: Communication API, no buzón personal del profesor (Master §15).

Platform Billing ≠ Academy Finance (Master §24). Stripe/Mercury pueden ser BRIK64 al inicio; product codes, subscriptions, cost center y P&L de Akademate separados.

Metering V1 en Control DB + Analytics Engine: students, seats, storage, API, AI, Stream, email, automations. **OpenMeter: no V1.** Interfaz `MeteringProvider` por si acaso.

---

# 14. Dominio (no se toca aquí)

Sigue el Master Spec: blueprints, Person, Enrollment, Entitlements, Instructor*, Session, practices, exams, credentials, commerce, finance split, campus P1 (§5.5, §7.5, §8.7, §16.4, Apéndice F). Cloudflare solo aporta adapters y escala.

---

# 15. Estado actual (audit snapshot 2026-08-29)

| Superficie | Hoy | Target Cloud SaaS |
| --- | --- | --- |
| akademate.com | Worker OpenNext `akademate-web` | KEEP |
| tenant-admin / campus | Next+Payload+Postgres en contenedor | EVOLVE a Workers + TenantDataContext |
| ops | contenedor admin-client | EVOLVE Worker + Access |
| Auth campus | students only; P1 teacher pendiente | KEEP contrato P1, adapter store |
| Payload | CMS + mucho dominio | SPLIT: CMS KEEP; dominio a Application |
| Postgres+RLS | source of truth On-Prem y hoy SaaS de facto | KEEP On-Prem; Cloud → D1 shards |
| BullMQ/Redis | spec legado, no siempre prod | REPLACE Queues+Workflows en Cloud |
| Neon (ADR-0007) | “SaaS may later use Neon” | SUPERSEDED para Cloud: D1, no Neon |

Matriz completa: [MIGRATION_MATRIX.md](./cloudflare-native/MIGRATION_MATRIX.md).

Payload: no borrar. Audit collections. CMS/editorial puede quedarse en Container o Worker compatible si el audit lo permite. Core académico/finance **no** en hooks.

Next: no asumir. Verificar OpenNext/Workers adapter en la versión pinneada (hoy `apps/web` ya usa OpenNext). Tenant-admin es más pesado: Fase 0 debe medir Node APIs incompatibles.

---

# 16. Migración Postgres → D1

No big-bang.

1. Inventario SQL (tipos, RLS, FKs, triggers, JSONB, citext, exclusions).
2. Schema SQLite-compatible + tests de paridad de reglas.
3. Control D1 + un shard de staging.
4. Extractor por tenant (job idempotente).
5. Validación row counts + checksums de invariantes (enrollments, hashes no se copian en claro).
6. Dual-read **solo** si hay plan de retirada medido.
7. Switch por tenant (feature flag deployment=cloud_d1).
8. Reconciliation + Time Travel drill + export R2.
9. Retiro del Postgres cloud (On-Prem intacto).

Herramientas oficiales: `wrangler d1`, Time Travel, import hasta 5 GB vía R2, REST Admin. Batches de 1k filas (límite duración 30 s / statement 100 KB).

---

# 17. Backup, DR, portabilidad, compliance

| Dato | RPO/RTO V1 (objetivo a validar con restore drill) |
| --- | --- |
| D1 | Time Travel 30 d + dump diario R2. RPO horas, RTO horas tras drill |
| R2 | versioning + replica opcional. RPO=object version |
| Stream | inventory + re-import policy |
| Secrets | 1Password + rotate. No backup de secretos en git |

Cold backup cifrado **fuera** de Cloudflare: RECOMMENDED para exit. Provider-exit: manifests de schema, tenant mapping, object inventory, OAuth inventory.

GDPR/AI Act: Master Spec §20. Cloudflare = subprocessor; registrar en Subprocessor Registry. Residencia: D1 location hints (WEUR para EU). Puntos **LEGAL REVIEW**: DPA Cloudflare, transferencia US, Stream en menores, RealtimeKit futuro. Este spec no es asesoramiento legal.

---

# 18. Security (resumen; detalle en THREAT_MODEL)

Tenant isolation: shard+tenant_id+server policy; tests de leakage obligatorios. OAuth token theft, webhook forgery, D1 injection (siempre `bind()`), R2 signed URL replay, Stream token leak, prompt injection, MCP confused deputy, billing manipulation, account takeover, SSRF desde agents, malware upload.

Access delante de ops/preview. WAF+rate limit+Turnstile. Tokens Cloudflare scoped. Break-glass dual.

---

# 19. Tool sprawl

| Tool | Decisión V1 | Por qué |
| --- | --- | --- |
| n8n | NO Core | Workflows+Queues cubren orquestación |
| Linear | NO | GitHub Issues |
| Appsmith | NO | ops es Worker propio |
| GrowthBook | NO | flags en Control DB |
| PostHog/Metabase | OPTIONAL later | Analytics Engine primero |
| OpenMeter | NO V1 | MeteringProvider propio |
| Loki/Prom/Grafana | OPTIONAL | CF observability primero |
| Sentry | OPTIONAL | si stack traces Workers no bastan |
| Uptime Kuma | OPTIONAL | un probe externo sí; no hace falta self-host si hay proveedor |
| Stalwart/Postal | NO | EmailProvider |
| Chatwoot | OPTIONAL | si soporte UI hace falta; Akademate sigue SoT de identidad |
| AgentMail | NO V1 | Communication API |

---

# 20. IaC, secrets, DX, tests, performance, scale

IaC: Wrangler + Terraform/Pulumi Cloudflare provider para zona, Access, WAF, R2, queues. Git refleja Workers, D1 schema migrations, bindings, routes. No clickops repetible post-bootstrap.

Secret lifecycle: CREATE→STORE (1P + CF)→DISTRIBUTE (bindings)→USE→ROTATE→REVOKE→AUDIT.

DX: `wrangler dev`, D1 local, R2 mock, Queues local, fixtures de synthetic tenants. Cero prod en laptop.

Tests: unit domain, integration D1, RLS/isolation equivalente, contract adapters, queue/workflow, OAuth, Stream signed URL, billing, agent grant, MCP, E2E, DR restore. Cross-tenant leakage = P0.

Budgets (a calibrar en staging): API p95, D1 SQL duration, queue age, workflow delay, video startup, tenant provision time.

Escala 10 / 100 / 1k / 10k tenants: Workers y R2/Stream escalan. D1 escala **horizontal** (más DBs), no vertical (10 GB, un hilo). 10k tenants: shards o per-tenant dinámico, no un Postgres monolítico cloud. WfP para extensiones, no para el Core V1.

---

# 21. Roadmap (Cloud SaaS)

Cada fase: objetivo, dependencias, humano vs agente, tests, security gate, rollback, evidencia. Detalle humano en HUMAN_BOOTSTRAP.

| Fase | Objetivo | Gate |
| --- | --- | --- |
| 0 | Architecture audit (este repo + schema real) | mapping KEEP/EVOLVE aprobado |
| 1 | Perímetro producto: Workspace, 1P vaults, GitHub, CF account Akademate | evidence ledger, cero secretos en git |
| 2 | CF security: Access, WAF, Turnstile, tokens scoped | ops no público |
| 3 | DEV/STAGING/PROD Workers + R2 + Queues + Workflows vacíos | deploy reproducibles |
| 4 | Control D1 + 1 shard + TenantDataContext stub | isolation tests |
| 5 | Postgres adapter + Hyperdrive bridge opcional | dual store en staging |
| 6 | Tenant provision Workflow | create/offboard dry-run |
| 7 | Migrar un tenant sintético (catálogo+campus alumno) | checksums |
| 8 | Platform Ops Worker | Access + Control API |
| 9 | BYO Meet/Zoom/Teams OAuth | tokens cifrados |
| 10 | Stream VOD + VideoAsset | signed playback |
| 11 | AutonomousOps R0/R1 | sin R3 automático |
| 12 | CI autónomo preview→staging | CODEOWNERS |
| 13 | Self-healing R1 | no prod write sin approval |
| 14 | Load 100 synthetic tenants | D1 overloaded no silencioso |
| 15 | Cutover tenants Launch reales | rollback Postgres/Hetzner path intacto para On-Prem |

Campus P1 (identidad docente) puede ejecutarse **en el Core actual (Postgres)** en paralelo: no espera a D1.

---

# 22. ADRs de este pack

| ADR | Decisión |
| --- | --- |
| [0016](../adr/0016-cloud-saas-vs-onprem-adapters.md) | Dual runtime: CF Cloud vs Postgres On-Prem |
| [0017](../adr/0017-d1-control-and-tenant-shards.md) | Control D1 + shards V1; per-tenant target |
| [0018](../adr/0018-brik64-product-genesis.md) | Product isolation + exit readiness |
| [0019](../adr/0019-autonomous-ops-native.md) | AutonomousOps nativo, no Paperclip |
| [0020](../adr/0020-byo-video-and-stream.md) | BYO live + Stream VOD; RealtimeKit future |

Más: no n8n; EmailProvider por beta; no agent DB access; human approval R3/R4; IaC; Hyperdrive solo bridge.

---

# 23. Criterio de aceptación Cloud SaaS (mínimo)

- Un tenant sintético vive 100% en Workers+D1+R2 sin VPS en el path.
- Isolation test: token de tenant A no lee shard/filas de B.
- Provision/offboard es Workflow idempotente.
- Ops detrás de Access; sin SQL arbitrario.
- Agente R1 no puede R3.
- Restore D1 desde Time Travel o dump R2 evidenciado.
- Marketing akademate.com sigue en Worker; On-Prem no se rompe.
- Email transaccional funciona con fallback no-beta.
- Custom hostname de prueba con certificado active.

---

# 24. Lo que este documento no autoriza

Implementar D1 en producción, cortar Hetzner/On-Prem, mezclar Stripe de producto sin cost center, dar a un agente el vault ROOT, usar Email Sending como único mail sin fallback, ni tratar Launchpad como créditos CONFIRMED hasta aceptación oficial.

**Siguiente ejecución:** B-000 (confirmar inventario). No crear Workspace/CF/D1 hasta que B-000 esté `VERIFIED`. Matriz: [MIGRATION_MATRIX.md](./cloudflare-native/MIGRATION_MATRIX.md).

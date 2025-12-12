# AKADEMATE.COM — Especificación de Negocio, Arquitectura y Backlog Ejecutable (SaaS Multitenant)

> Documento de especificación técnica y funcional con precisión conceptual orientada a arquitectura de plataformas SaaS multitenant.

---

## Índice

1. Descripción del negocio
2. Alcance del producto y experiencias
3. Arquitectura de alto nivel
4. Modelo multitenant (DB-first con RLS)
5. Ownership y partición de datos (Core vs CMS)
6. Blueprint de entrega para un agente
7. Plan de entrega por fases
8. Backlog ingestable (Epics/Stories) + Matriz de artefactos
9. Especificación DB inicial (DDL conceptual) + invariantes
10. Plantilla RLS (SQL conceptual)
11. Definition of Done (DoD)
12. Próximos pasos (arranque)

---

# 1. Descripción del negocio

## 1.1 Síntesis ejecutiva

AKADEMATE.COM es una plataforma **SaaS multitenant** para academias —incluyendo academias **multisede**— diseñada para consolidar, en un sistema operativo digital coherente, la cadena completa de valor:

- **Captación** (web comercial + leads)
- **Operación académica** (backoffice por academia)
- **Entrega formativa** (campus virtual)
- **Publicación comercial** (SEO + oferta publicada)

La solución se organiza en cinco superficies:

1. **Operaciones internas AKADEMATE (Ops):** soporte, control, auditoría y mecanismos de impersonación gobernados.
2. **Administración del cliente (Academia Admin):** operación integral por tenant (alumnos, profesores, sedes, cursos, convocatorias, matrículas, calendario, asistencia, comunicaciones y facturación operativa).
3. **Campus virtual (Alumno/Profesor):** LMS-lite con contenidos, sesiones en directo y grabadas, progreso, evaluación y certificación.
4. **Web comercial por academia:** canal público (SEO) para publicar cursos/convocatorias y contenido editorial (blog/noticias), más acceso autenticado al campus.
5. **CMS interno (Payload):** editorial y configuración “soft” (plantillas, páginas, bloques, media) operado por personal AKADEMATE.

## 1.2 No-objetivos (v1)

Para reducir ambigüedad y evitar sobrealcance, la versión inicial **no** pretende:

- Sustituir un ERP/contabilidad completa (se cubre facturación operativa y registros formativos; la contabilidad general queda fuera).
- Implementar un marketplace multi-academia (cada academia opera su web/campus bajo su tenant).
- Ofrecer BI/analítica avanzada o modelos predictivos (más allá de métricas operativas básicas).

## 1.3 Métricas de éxito (KPIs v1)

KPIs directamente trazables a los flujos prioritarios:

- **Time-to-publish de oferta:** tiempo medio desde “convocatoria creada” hasta “publicada y visible” en la web comercial.
- **Conversión lead → matrícula:** ratio de leads captados que se convierten en enrollments dentro de una ventana definida (p. ej., 30 días).
- **Retención/engagement del alumno:** porcentaje de alumnos activos semanalmente en campus y/o tasa de finalización por convocatoria.

## 1.4 Problema estructural que se resuelve

El segmento objetivo suele operar con herramientas disociadas (hojas de cálculo, mensajería, calendarios, videoconferencia, LMS externos). Esto induce:

- **Duplicación e inconsistencia de datos** (múltiples fuentes de verdad).
- **Baja trazabilidad/auditabilidad** en procesos críticos.
- **Experiencia fragmentada** (alumno/profesor/staff).
- **Dificultad de escalado** a multisede y a operación híbrida (presencial + online).

AKADEMATE.COM aborda el problema con un enfoque **DB-first** y garantías fuertes de aislamiento multitenant (RLS), consolidando operación, publicación y campus bajo una arquitectura extensible.

## 1.5 Cliente objetivo

- Academias pequeñas y medianas.
- Academias multisede con necesidad de gobernanza por centro.
- Centros híbridos con componente online (sincronización operativa y de entrega).

## 1.6 Propuesta de valor

- Plataforma integrada **Backoffice + Campus + Web** por academia.
- Publicación controlada por **estado de publicación** (draft/publish/archive) desde dashboard a web comercial.
- Control de acceso por rol y **auditabilidad** de acciones por tenant y, cuando aplique, por sede.
- Base técnica escalable y segura: **PostgreSQL Core + Row Level Security (RLS) + Drizzle**, autogestionado.

## 1.7 Modelo de ingresos (orientativo)

- Suscripción SaaS por academia (planes por módulos/volumen).
- Add-ons: multisede avanzada, automatizaciones, integraciones, certificación, streaming/vídeo, soporte premium.
- Servicios profesionales: onboarding, migraciones, parametrización e integraciones.

---

# 2. Alcance del producto y experiencias

## 2.1 Actores (personas y roles)

- **AKADEMATE Ops:** personal interno (soporte, operaciones, administración).
- **Academia Owner/Admin:** administración integral del tenant (gobernanza).
- **Staff:** ejecución operativa (alumnos, horarios, comunicaciones).
- **Profesor:** docencia, materiales, sesiones, seguimiento.
- **Alumno:** consumo de contenidos, sesiones, entregas, certificación.
- **Visitante (público):** navegación web comercial y captación (lead/preinscripción).

## 2.2 Flujos canónicos (end-to-end)

> Formato estable por flujo: **Entrada → Pasos → Salida → Eventos → Artefactos (use case + endpoint + pantalla)**.

### 2.2.1 Diseño y publicación de la oferta

**Entrada**

- Actor: Academia Admin / Staff.
- Datos: alta/edición de `course` y `course_offering` (incluye `site_id`, fechas, capacidad, precio, `slug`).

**Pasos**

- Crear/editar curso.
- Crear/editar convocatoria (offering) en estado `DRAFT`.
- Transición controlada `DRAFT → PUBLISHED` (o `→ ARCHIVED`).
- Al publicar, la web comercial se revalida y expone únicamente el subconjunto `PUBLISHED`.

**Salida**

- Offering publicado con `published_at` y visibilidad pública por host del tenant.

**Eventos**

- `OfferingPublished` (outbox) → `apps/web` `revalidateTag()`/`revalidatePath()`.
- `OfferingArchived` (opcional) → invalidación de rutas.

**Artefactos (implementación)**

- Use cases: `CreateCourse`, `CreateOffering`, `PublishOffering`, `ArchiveOffering`.
- Endpoints/Handlers:
  - `apps/tenant-admin`: `POST /api/tenant/courses`, `POST /api/tenant/offerings`, `POST /api/tenant/offerings/:id/publish`.
  - `apps/web`: `GET /api/public/offerings` (filtrado `PUBLISHED`).
- Pantallas:
  - `apps/tenant-admin`: **Oferta → Cursos**, **Oferta → Convocatorias**, **Acciones → Publicar/Archivar**.
  - `apps/web`: **Listado de ofertas**, **Detalle de convocatoria**.

---

### 2.2.2 Captación y conversión

**Entrada**

- Actor: Visitante (público) → Staff.
- Datos: formulario lead (nombre, email, teléfono, interés, fuente).

**Pasos**

- El visitante envía un lead desde la web comercial.
- El staff revisa leads en el dashboard.
- Conversión: crear alumno (si no existe) y crear matrícula (enrollment) asociada a una convocatoria.

**Salida**

- `lead` registrado y trazable; `student` + `enrollment` activos.

**Eventos**

- `LeadCreated` (opcional) → notificación interna/automatización.
- `EnrollmentCreated` → habilita acceso al campus.

**Artefactos (implementación)**

- Use cases: `CreateLead`, `ConvertLeadToStudent`, `EnrollStudent`.
- Endpoints/Handlers:
  - `apps/web`: `POST /api/public/leads` (rate-limit + anti-spam).
  - `apps/tenant-admin`: `POST /api/tenant/leads/:id/convert`, `POST /api/tenant/enrollments`.
- Pantallas:
  - `apps/web`: **Formulario lead/preinscripción**.
  - `apps/tenant-admin`: **CRM → Leads**, **Leads → Convertir**, **Matrículas → Crear**.

---

### 2.2.3 Entrega formativa (campus)

**Entrada**

- Actor: Alumno (y Profesor para gestión de contenidos).
- Datos: `enrollment` activo + estructura LMS publicada (módulos/lecciones/recursos).

**Pasos**

- Autenticación y acceso al campus.
- Listado de cursos matriculados (`enrollments`).
- Consumo de lecciones/recursos; registro de progreso.
- (P1) Entregas y evaluación, si aplica.

**Salida**

- Progreso persistido por alumno/lección; entregas registradas (si aplica).

**Eventos**

- `LessonProgressUpdated` (métricas/analítica y elegibilidad).
- `SubmissionCreated` / `SubmissionGraded` (P1).

**Artefactos (implementación)**

- Use cases: `ListMyEnrollments`, `GetLessonContent`, `TrackProgress`, `SubmitAssignment` (P1).
- Endpoints/Handlers:
  - `apps/campus`: `GET /api/campus/me/enrollments`, `GET /api/campus/lessons/:id`, `POST /api/campus/progress`.
- Pantallas:
  - `apps/campus`: **Mis cursos**, **Curso → Módulos/Lecciones**, **Lección → Recursos**.

---

### 2.2.4 Sesiones live y VOD

**Entrada**

- Actor: Staff/Profesor.
- Datos: `class_session` vinculada a `offering` (fecha/horario, provider, join URL).

**Pasos**

- Programar sesión live desde dashboard.
- Distribuir acceso (campus muestra sesión y join link).
- Ingesta de grabación vía webhook del proveedor.
- Publicar VOD como recurso asociado (visible en campus).

**Salida**

- Sesión creada y visible en campus; grabación disponible como recurso.

**Eventos**

- `SessionScheduled` → notificaciones (opcional) + visibilidad en campus.
- `RecordingReady` → pipeline `workers/jobs` → asociar asset a lección/sesión.

**Artefactos (implementación)**

- Use cases: `ScheduleSession`, `AttachJoinLink`, `HandleRecordingReady`.
- Endpoints/Handlers:
  - `apps/tenant-admin`: `POST /api/tenant/sessions`.
  - `apps/campus`: `GET /api/campus/sessions`.
  - `apps/api` o `apps/tenant-admin`: `POST /api/webhooks/video/recording-ready`.
- Pantallas:
  - `apps/tenant-admin`: **Calendario → Sesiones**, **Sesión → Configurar provider**.
  - `apps/campus`: **Curso → Calendario**, **Sesión → Unirse/Ver grabación**.

---

### 2.2.5 Certificación

**Entrada**

- Actor: Staff/Profesor (emisión) + Alumno (descarga) + Público (verificación).
- Datos: políticas de elegibilidad por curso/offering (completitud, evaluación, asistencia, etc.).

**Pasos**

- Evaluar elegibilidad.
- Emitir certificado (PDF + hash verificable).
- Alumno descarga desde campus.
- Verificación pública por hash.

**Salida**

- `certificate` emitido con `verification_hash` único y URL del artefacto.

**Eventos**

- `CertificateIssued` → auditoría + notificación al alumno.

**Artefactos (implementación)**

- Use cases: `EvaluateEligibility`, `IssueCertificate`, `VerifyCertificate`.
- Endpoints/Handlers:
  - `apps/tenant-admin`: `POST /api/tenant/certificates/issue`.
  - `apps/campus`: `GET /api/campus/certificates`.
  - `apps/web`: `GET /verify/:hash` (público).
- Pantallas:
  - `apps/tenant-admin`: **Certificados → Emitir**.
  - `apps/campus`: **Mi perfil → Certificados**.
  - `apps/web`: **Verificación de certificado**.

---

# 3. Arquitectura de alto nivel

## 3.1 Principios de diseño (invariantes)

1. **Fuente de verdad única** para datos operativos: **PostgreSQL Core**.
2. **Aislamiento multitenant garantizado por DB**: **RLS** como enforcement.
3. **Separación estricta** UI ↔ negocio: adaptadores (handlers) + casos de uso + dominio.
4. **CMS separado**: Payload limitado a editorial/configuración no crítica.
5. **Composición en web comercial**: Core publicado + editorial; prohibida la duplicación de entidades operativas.

## 3.2 Aplicaciones (apps)

- **apps/platform-ops:** Ops interno AKADEMATE (auditoría, control global, impersonación gobernada).
- **apps/tenant-admin:** dashboard de academia (operación completa + publicación).
- **apps/campus:** campus virtual (alumno/profesor).
- **apps/web:** web comercial por academia (pública, SEO, captación, acceso al campus).
- **apps/cms:** Payload Admin (uso interno AKADEMATE).

## 3.3 Servicios transversales

- **Postgres Core** (autogestionado) + RLS.
- **Redis + Workers** (jobs/eventos; scheduling y asincronía).
- **Storage S3 compatible** (material, grabaciones, certificados).
- **Proveedor de vídeo/live** (Zoom/Meet/Mux/Vimeo/Stream) mediante interfaz abstracta.

## 3.4 Fronteras de ejecución e integración (anti-acoplamiento)

### 3.4.1 Opciones válidas de frontera

**Opción A — Next.js como BFF por superficie (recomendada al inicio)**

- Cada app (tenant-admin, campus, platform-ops, web) actúa como **Backend For Frontend**.
- Las apps consumen el Core mediante **use cases** compartidos (misma base de código), no mediante llamadas entre apps.

```
[Browser]
   |
   v
[Next App (UI + Route Handlers/Server Actions)]  <-- frontera
   |
   v
[packages/application: Use Cases]                <-- “API de dominio”
   |
   +--> [packages/domain: Entidades/Reglas]
   |
   +--> [packages/infra: Repos/Servicios]
               |
               +--> [Postgres Core + RLS]
               +--> [Redis/Workers]
               +--> [S3/Video/Email/...]
```

**Opción B — API separada (cuando la escala/operación lo exige)**

- Se introduce `apps/api` (HTTP/GraphQL) como superficie de API.
- Las apps Next pasan a ser clientes de esa API manteniendo SSR/ISR donde aplique.

```
[Browser]
   |
   v
[Next Apps (UI)]
   |
   v
[apps/api (HTTP)]                                 <-- frontera
   |
   v
[packages/application: Use Cases]                 <-- “API de dominio”
   |
   +--> [packages/domain]
   |
   +--> [packages/infra] -> [Postgres Core + RLS]
```

Criterio base:

- **A (BFF):** maximiza velocidad de delivery y reduce componentes operativos.
- **B (API):** mejora gobernanza, observabilidad central y escalado independiente.

#### Decision Record (ADR-001): migración de BFF (A) a API separada (B)

**Decisión vigente:** iniciar con **Opción A** y reevaluar ante señales observables.

**Triggers (umbrales observables):** migrar a **Opción B** si se cumplen **≥ 2** durante **≥ 2 sprints**:

- **Latencia p95** sostenida en endpoints críticos que no se corrige con optimización/caching (p. ej., p95 > 800–1200 ms bajo carga representativa).
- **Duplicación de adaptadores**: ≥ 20–30% de handlers/server actions replican validaciones, mapping y reglas transversales en ≥ 2 apps.
- **Necesidad de rate limits centralizados / WAF lógico** por abuso o riesgo operativo.
- **Gobernanza de integraciones**: inconsistencias repetidas en retries/circuit breakers/políticas de seguridad entre apps.
- **Observabilidad/cumplimiento**: necesidad de trazas distribuidas y auditoría central end-to-end difícil de sostener por BFF.

**Estrategia de migración (mínimo riesgo):**

1. Crear `apps/api` como façade para 1–2 dominios (p. ej., publicados + leads).
2. Mantener use cases en `packages/application` (no duplicar dominio).
3. Migrar progresivamente handlers: `apps/*` → `apps/api` preservando contratos y telemetría.

### 3.4.2 Dónde vive la “API de dominio”

La “API de dominio” **no es HTTP**: es el conjunto de **use cases** en `packages/application`.

- Route Handlers / Server Actions en Next = **adaptadores** (validación, contexto tenant/actor, ejecución del use case, serialización de respuesta).
- `packages/domain` permanece puro.
- `packages/infra` implementa repositorios y adaptadores a servicios externos.

### 3.4.3 Evitar acoplamiento entre apps

1. **No hay imports cruzados entre **``. Las apps solo dependen de `packages/*`; `packages/application` expone interfaces/contratos, `packages/infra` los implementa y `apps/*` se limita a orquestar (UI + handlers).
2. Comunicación entre funcionalidades vía:
   - **use cases** (código compartido) y/o
   - **eventos** (outbox/worker) para efectos asíncronos.
3. Integraciones externas (Payload, vídeo, mail, pagos) pasan por interfaces en `packages/application` y adaptadores en `packages/infra` (Anti-Corruption Layer).
4. Multitenancy y permisos se concentran en:
   - resolución de contexto en adaptador (handler) y
   - enforcement en DB (RLS).

---

# 4. Modelo multitenant (DB-first, enforcement por RLS)

## 4.1 Estrategia

- Una única base de datos compartida.
- Todas las tablas operativas incluyen `tenant_id` como clave de partición lógica.
- Multisede mediante `site_id` donde aplique.
- RLS aplicado de forma uniforme (sin excepciones ad-hoc).

## 4.2 Tenant resolution por host (subdominio y custom domain)

El `tenant_id` se resuelve **determinísticamente** a partir del `Host`, priorizando dominios verificados.

### 4.2.1 Fuentes de resolución (orden)

1. **Custom domain (dominio propio de la academia):** lookup exacto en `tenant_domains.host` con `verified_at IS NOT NULL`.

   - Normalización: lowercase, sin puerto, punycode.
   - Registrar variantes `apex` y `www` si ambas deben resolverse (p. ej., `academia.com` y `www.academia.com`).

2. **Subdominio gestionado (por superficie):**

   - **Web comercial:** `{tenant}.akademate.com`
   - **Dashboard (Admin):** `admin.{tenant}.akademate.com`
   - **Campus:** `campus.{tenant}.akademate.com`

La extracción de `{tenant}` (o `tenant_key`) se mapea a `tenants` (por `key` o equivalente).

**Nota (conflictos custom domain vs subdominio):**

- **Precedencia:** si existe custom domain verificado, ese mapping gana.
- **Verificación:** un custom domain no participa hasta registrar `verified_at`.
- ``** vs apex:** definir host canónico por tenant (y emitir 301 desde el alterno) o mapear ambos al mismo tenant en `tenant_domains`.

### 4.2.2 Reglas operativas

- Si no existe mapping válido/activo: responder **404/410** (no inferir).
- En superficies autenticadas (tenant-admin/campus): además del host, validar `tenant_membership` (salvo impersonación Ops).

## 4.3 Contexto por request en Postgres (RLS + pooling seguro)

RLS requiere un **contexto transaccional** por request.

### 4.3.1 Protocolo (obligatorio)

En cada request autenticado:

1. Resolver `tenant_id` y `actor_user_id`.
2. Abrir transacción.
3. Establecer variables **LOCAL** (scope transaccional): `app.tenant_id`, `app.user_id`, opcional `app.site_id`, opcional `app.role`.
4. Ejecutar queries/repositorios (Drizzle) dentro de la transacción.
5. Commit/Rollback.

### 4.3.2 Implementación recomendada (SQL)

```sql
BEGIN;
SELECT set_config('app.tenant_id', '<tenant_uuid>', true);
SELECT set_config('app.user_id',   '<user_uuid>',   true);
-- opcional
SELECT set_config('app.site_id',   '<site_uuid>',   true);
SELECT set_config('app.role',      '<role_key>',    true);

-- ... queries aquí (RLS aplica) ...
COMMIT;
```

Notas:

- `true` equivale a `SET LOCAL`: se revierte automáticamente al final de la transacción.
- Evitar settings de sesión (`SET app.tenant_id = ...`) salvo mecanismo explícito de `RESET/DISCARD` y control estricto.

### 4.3.3 Pooling: riesgos y mitigaciones

- Riesgo: “filtrar” contexto multitenant entre requests si se usan settings de sesión.
- Mitigación: **contexto siempre transaccional** con `set_config(..., true)`.

Poolers:

- Node pg Pool: seguro si el contexto es transaccional.
- pgBouncer (transaction pooling): compatible (no asumir persistencia).
- pgBouncer (statement pooling): no recomendado.

Regla operativa: la unidad segura es **BEGIN → set\_config(LOCAL) → queries → COMMIT/ROLLBACK**. Acceder a DB fuera de esa unidad es un bug de seguridad.

## 4.4 Impersonación (solo Ops)

- Token de impersonación con TTL acotado y scopes limitados.
- Registro obligatorio en `audit_log` (actor, objetivo, motivo, timestamps).
- UI con señalización explícita de estado de impersonación.

---

# 5. Ownership y partición de datos (Core vs CMS)

## 5.1 Postgres Core (sistema de registro)

Postgres Core es la **única fuente de verdad** para entidades operativas y transaccionales:

- Tenants, dominios, sedes.
- Usuarios, memberships, roles.
- Alumnos, profesores.
- Cursos, convocatorias, estados de publicación.
- Matrículas, calendario, asistencia.
- LMS: progreso, entregas, evaluación.
- Certificados.
- Leads y conversión.

**Invariante:** ninguna entidad operativa depende de Payload para consistencia, permisos o integridad referencial.

## 5.2 CMS (Payload): alcance y segmentación

Payload se limita a editorial/configuración “soft”:

- Blog/noticias/páginas.
- Bloques de marketing.
- Plantillas de comunicaciones.
- Media editorial.
- Configuración no crítica (copy/FAQs/banners).

### 5.2.1 Estrategias de segmentación (elegir una)

**Estrategia A — Instancia única con segmentación por **``** (recomendada)**

- Colecciones editoriales incluyen `tenant_id` (o `tenant_key`).
- Permisos en Payload restringen lectura/escritura por tenant para roles internos o aseguran separación lógica.

**Estrategia B — Segmentación por “espacio”/proyecto (si el tooling lo permite)**

- Separación editorial por contenedor lógico (workspace/proyecto).

**Estrategia C — Instancia por tenant (no recomendada salvo casos extremos)**

- Una instancia Payload por tenant (alto coste operativo).

**Contrato de composición (Core ↔ Payload):**

- **Core (obligatorio):** identidad y semántica operativa (ids/slugs, `status`, `published_at`, fechas, sede, capacidad, precio, reglas de visibilidad).
- **Payload (permitido):** bloques editoriales (copy largo, secciones, FAQs, media, plantillas) y nunca reglas operativas.

### 5.2.2 Regla “never source of truth”

Payload **nunca** es source of truth de: cursos/convocatorias, matrículas, plazas, precios, accesos o reglas de disponibilidad.

Si se requiere contenido marketing asociado a una entidad operativa, Payload puede almacenar contenido editorial referenciado por `course_id`/`offering_id` o `slug`, pero el core operativo (fechas, plazas, precio, disponibilidad, estado real) se deriva exclusivamente de Postgres.

## 5.3 Composición en `apps/web` (Core publicado + editorial)

### 5.3.1 Precedencia

- **Core manda** en disponibilidad y semántica operativa.
- **Payload manda** en narrativa editorial.

En detalle de curso/convocatoria:

- Ficha operativa desde Postgres (publicado, fechas, precio, plazas, sede).
- Bloques editoriales desde Payload (narrativa, FAQs, secciones, assets).

### 5.3.2 Caching e invalidación

- Core publicado: ISR/SSG (listados y detalles por `slug`).
- Editorial: cache app/CDN con TTL razonable y/o ISR.

Invalidación:

- Cambios Core (publish/update/archive): outbox → worker → `revalidatePath()`/`revalidateTag()` en `apps/web`.
- Cambios Payload: webhook Payload → endpoint interno en `apps/web` → invalidación selectiva por rutas/tags del tenant.

Resultado: publicación consistente, sin duplicación y con invalidación determinista.

---

# 6. Blueprint de entrega para un agente

## 6.1 Estructura de repositorio (monorepo)

```text
apps/
  platform-ops/
  tenant-admin/
  campus/
  web/
  cms/
packages/
  domain/
  application/
  db-core/
  infra/
  auth/
  ui/
  observability/
workers/
  jobs/
```

## 6.2 Convenciones de acoplamiento

- `packages/domain`: entidades e invariantes (sin DB, sin HTTP).
- `packages/application`: casos de uso + contratos (interfaces) de repos/servicios.
- `packages/db-core`: schema Drizzle + migraciones + SQL (RLS/utilidades).
- `packages/infra`: implementaciones (repos Drizzle, storage, mail, video, queue).
- `apps/*`: UI + handlers; prohibida la lógica de negocio.

---

# 7. Plan de entrega por fases (secuenciación)

## Fase 1 — Fundaciones multitenant

- Postgres Core + migraciones Drizzle.
- RLS + suite de tests de aislamiento.
- Auth + tenant resolution por host.
- IAM mínimo (tenants, domains, sites, memberships, roles).
- Audit log.

## Fase 2 — Publicación + web comercial

- Cursos + Convocatorias.
- Ciclo `DRAFT/PUBLISHED/ARCHIVED`.
- ISR + revalidación al publicar.
- Leads/preinscripción.

## Fase 3 — Operación académica

- Matrículas.
- Calendario de sesiones.
- Asistencia.

## Fase 4 — Campus virtual

- Módulos/lecciones/recursos.
- Progreso.
- Entregas.

## Fase 5 — Live + grabaciones + certificados

- Integración live.
- Pipeline de ingestión de grabaciones.
- Certificados verificables.

## Fase 6 — CMS Payload

- CMS separado (editorial + plantillas).
- Composición web: editorial + publicados.

---

# 8. Backlog ingestable (Epics/Stories) + artefactos

## 8.1 MVP slice (thin vertical slice)

**Objetivo:** validar negocio con una cadena completa **publicación → captación → conversión → acceso alumno**.

### Alcance MVP (P0)

- Multitenancy DB-first: Postgres + RLS + contexto transaccional (`set_config` LOCAL) + tests de aislamiento.
- Tenant resolution por host (subdominio) + routing mínimo en `apps/web` y `apps/tenant-admin`.
- IAM básico (login, sesiones, memberships; RBAC mínimo).
- Oferta académica: `courses` + `course_offerings` con `DRAFT/PUBLISHED` y slugs por tenant.
- Web comercial: listado/detalle de publicados + ISR + revalidación por evento.
- Leads: captura desde web comercial + listado en dashboard.
- Conversión mínima: crear alumno + matrícula desde dashboard.
- Campus mínimo (lectura): alumno ve cursos matriculados y consume contenidos publicados (sin entregas/evaluación en MVP).

### Criterios de aceptación (MVP)

1. Un tenant crea y publica una convocatoria; aparece en su web.
2. Un visitante envía un lead; el tenant lo ve en su dashboard.
3. El staff convierte lead a alumno y matricula en una convocatoria.
4. El alumno inicia sesión y consume contenido en campus (lectura).
5. RLS impide acceso cruzado entre tenants (suite de tests).

---

## 8.2 Dependencias globales (secuenciación)

- **EPIC A (DB+RLS)** bloquea todo.
- **EPIC B (IAM)** depende de A y bloquea cualquier superficie autenticada.
- **EPIC C (Oferta + publicación)** depende de A+B y desbloquea `apps/web` (publicados).
- **EPIC D (Leads)** depende de A (tabla) y de C (captura end-to-end).
- **EPIC E (Operación)** depende de A+B+C.
- **EPIC F (Campus)** depende de E.
- **EPIC G/H (Live/Certificados)** dependen de F.
- **EPIC I (CMS)** puede ir en paralelo tras A, pero la composición final depende de C.

Orden recomendado:

- **P0 (MVP):** A → B → C → D → E → F(lectura) → (I opcional mínimo)
- **P1:** F(entregas/evaluación) → H(certificados) → I(composición completa)
- **P2:** G(live/grabaciones) + integraciones profundas

---

## EPIC A — Plataforma Core Multitenant (DB + RLS) [P0 | Bloqueante]

**Desbloquea:** B, C, D, E, F, G, H, I

- **A1:** Esquema Core + migraciones.
- **A2:** RLS base + contexto + tests de aislamiento.
- **A3:** Auditoría (audit\_log).

## EPIC B — IAM (auth, roles, impersonación) [P0/P1]

- **B1:** Autenticación y sesión.
- **B2:** Autorización (RBAC mínimo).
- **B3 (P1):** Impersonación Ops.

## EPIC C — Oferta académica + Publicación [P0]

- **C1:** Modelo académico base.
- **C2:** Casos de uso (create/update/publish/archive).
- **C3:** Web comercial (lectura de publicados) + ISR + revalidación.

## EPIC D — Leads/Preinscripción [P0]

- **D1:** Captura pública + rate-limit/anti-spam.
- **D2:** Conversión.

## EPIC E — Operación académica (matrículas, sesiones, asistencia) [P0/P1]

- **E1 (P0):** Matrículas.
- **E2 (P1):** Calendario/sesiones.
- **E3 (P1):** Asistencia.

## 8.3 Matriz Epic → Artefactos (resumen operativo)

| EPIC                     | DB (migraciones)                                          | RLS (policies)                  | Endpoints/Handlers              | UI screens             | Eventos/Jobs                     |
| ------------------------ | --------------------------------------------------------- | ------------------------------- | ------------------------------- | ---------------------- | -------------------------------- |
| A — Core multitenant     | tenants, domains, sites, users, memberships, roles, audit | tablas core                     | bootstrap/migrations            | ops bootstrap          | audit + outbox base              |
| B — IAM                  | sesiones/tokens (si aplica)                               | users/memberships               | auth callbacks, session refresh | login/selector         | security events (opcional)       |
| C — Oferta + publicación | courses, offerings                                        | courses/offerings               | CRUD + publish/archive          | oferta/list/edit       | `OfferingPublished` → revalidate |
| D — Leads                | leads                                                     | leads                           | lead capture, convert           | leads list/convert     | anti-spam/notify (opcional)      |
| E — Operación            | enrollments, sessions, attendance                         | enrollments/sessions/attendance | enroll/schedule/attendance      | enrollments/calendario | capacity/reminders               |
| F — Campus               | modules, lessons, resources, progress, submissions        | lms\_\*                         | campus read/progress/submit     | alumno/curso           | progress aggregation             |
| G — Live/Grabaciones     | sessions (ext), assets                                    | sessions/assets                 | webhooks/attach                 | player/sesión          | `RecordingReady` pipeline        |
| H — Certificados         | certificates                                              | certificates                    | issue/verify                    | emisión/descarga       | `CertificateIssued`              |
| I — CMS Payload          | (externo)                                                 | (payload perms)                 | payload webhooks                | CMS admin              | `PayloadUpdated` → revalidate    |

## 8.4 Definition of Ready (DoR) por story

Antes de iniciar una story, debe existir:

- **Objetivo** (valor y actor).
- **Inputs** (payloads, tablas, dependencias).
- **Outputs** (entidades, respuesta API, side effects).
- **Reglas/Invariantes** (validaciones, estados, ownership `tenant_id`/`site_id`, permisos).
- **Riesgos** (RLS, consistencia, idempotencia, concurrencia, performance).
- **Observabilidad** (logs/métricas/tracing mínimos + eventos auditables).
- **Criterios de aceptación** (Given/When/Then o checklist verificable) + tests requeridos.

---

## EPIC F — Campus virtual (LMS-lite) [P0→P1]

- **F1 (P0):** Contenidos (módulos/lecciones/recursos) + publicación.
- **F2 (P1):** Progreso.
- **F3 (P1):** Entregas/evaluación.

## EPIC G — Live + grabaciones [P2]

- **G1:** Integración live.
- **G2:** Grabaciones + pipeline.

## EPIC H — Certificaciones [P1]

- **H1:** Elegibilidad.
- **H2:** Emisión + verificación pública.

## EPIC I — CMS Payload (separado) [P0 opcional / P1]

- **I1:** Modelos editoriales + segmentación.
- **I2:** Composición web + caching + invalidación.

---

# 9. Especificación DB inicial (DDL conceptual)

> Este apartado define el mínimo viable del modelo core. Debe materializarse como migraciones Drizzle y SQL de RLS.

## 9.0 Invariantes de esquema (v1)

- **Extensiones requeridas:** habilitar `citext` (emails case-insensitive) y estandarizar su uso en `users.email`, `students.email`, `teachers.email`, `leads.email`.
- **CHECKs para “enums” (sin enums nativos en v1):** restringir `status` por tabla (p. ej., `course_offerings.status IN ('DRAFT','PUBLISHED','ARCHIVED')`).
- **FKs y **``**:** `RESTRICT` por defecto en entidades operativas; `CASCADE` solo para relaciones hijas puras sin valor independiente (p. ej., `lms_resources → lms_lessons`).
- **Índice crítico de publicación:** en `course_offerings`, índice `(tenant_id, status, published_at DESC)`.
- **Índices por slug:** `(tenant_id, slug)` en `courses` y `course_offerings` (además de unicidad) para acelerar resolución por ruta.
- **Soft-delete (si aplica):** si se introduce `deleted_at`, añadir `CHECK (deleted_at IS NULL OR deleted_at >= created_at)` y excluir soft-deleted por defecto en queries/RLS.

## 9.1 IAM

- `tenants(id uuid pk, name text, status text, created_at timestamptz)`
- `tenant_domains(id uuid pk, tenant_id uuid, host text unique, kind text, verified_at timestamptz null)`
- `sites(id uuid pk, tenant_id uuid, name text, timezone text, created_at timestamptz)`
- `users(id uuid pk, email citext unique, name text, created_at timestamptz)`
- `tenant_memberships(id uuid pk, tenant_id uuid, user_id uuid, role text, status text, created_at timestamptz, unique(tenant_id,user_id))`
- `roles(id uuid pk, tenant_id uuid, key text, name text, unique(tenant_id,key))`
- `role_permissions(id uuid pk, tenant_id uuid, role_id uuid, perm text, unique(role_id,perm))`
- `audit_log(id uuid pk, tenant_id uuid, actor_user_id uuid, action text, entity text, entity_id uuid null, payload jsonb, created_at timestamptz)`

## 9.2 Académico

- `courses(id uuid pk, tenant_id uuid, title text, slug text, description text null, created_at timestamptz, unique(tenant_id,slug))`
- `course_offerings(id uuid pk, tenant_id uuid, site_id uuid, course_id uuid, start_at timestamptz, end_at timestamptz, capacity int, price_cents int, currency text, status text, published_at timestamptz null, slug text, unique(tenant_id,slug))`
- `students(id uuid pk, tenant_id uuid, site_id uuid, email citext null, name text, created_at timestamptz)`
- `teachers(id uuid pk, tenant_id uuid, site_id uuid, email citext null, name text, created_at timestamptz)`
- `enrollments(id uuid pk, tenant_id uuid, offering_id uuid, student_id uuid, status text, created_at timestamptz, unique(offering_id,student_id))`
- `class_sessions(id uuid pk, tenant_id uuid, site_id uuid, offering_id uuid, starts_at timestamptz, ends_at timestamptz, live_provider text null, join_url text null, recording_asset_id uuid null)`
- `attendance(id uuid pk, tenant_id uuid, session_id uuid, student_id uuid, status text, marked_by_user_id uuid, marked_at timestamptz, unique(session_id,student_id))`

## 9.3 LMS

- `lms_modules(id uuid pk, tenant_id uuid, offering_id uuid, title text, order_index int)`
- `lms_lessons(id uuid pk, tenant_id uuid, module_id uuid, title text, status text, published_at timestamptz null, order_index int)`
- `lms_resources(id uuid pk, tenant_id uuid, lesson_id uuid, type text, url text, meta jsonb)`
- `lms_progress(id uuid pk, tenant_id uuid, lesson_id uuid, student_id uuid, status text, updated_at timestamptz, unique(lesson_id,student_id))`
- `lms_submissions(id uuid pk, tenant_id uuid, lesson_id uuid, student_id uuid, payload jsonb, created_at timestamptz)`
- `certificates(id uuid pk, tenant_id uuid, offering_id uuid, student_id uuid, issued_at timestamptz, certificate_url text, verification_hash text unique)`

## 9.4 Captación

- `leads(id uuid pk, tenant_id uuid, site_id uuid null, name text, email citext, phone text null, source text null, payload jsonb, created_at timestamptz)`

---

# 10. Plantilla RLS (SQL conceptual)

## 10.1 Activación

- `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`

## 10.2 Política estándar por tenant

- SELECT/UPDATE/DELETE: permitir si `tenant_id = current_setting('app.tenant_id')::uuid`.
- INSERT: permitir si `NEW.tenant_id = current_setting('app.tenant_id')::uuid`.

## 10.3 Superficies públicas (web comercial)

La web comercial es pública, pero no global: el tenant se deriva del host. No exponer “tablas públicas” globales. Permitir lectura únicamente de registros `PUBLISHED` dentro del tenant resuelto.

---

# 11. Definition of Done (DoD)

- Migraciones Drizzle reproducibles en dev/staging/prod.
- RLS aplicado y validado con tests de aislamiento.
- Casos de uso cubiertos por tests unitarios.
- Endpoints con pruebas de integración mínimas.
- Auditoría de acciones críticas implementada.
- Prohibición efectiva de duplicación de entidades operativas en CMS (validada en revisión).

---

# 12. Próximos pasos (arranque)

1. Scaffold del monorepo con estructura definida.
2. Implementación de `packages/db-core` (schema + primera migración).
3. SQL RLS para IAM + courses + offerings.
4. Helper `withTenantContext` + suite de tests de aislamiento.
5. Use cases: `CreateCourse`, `CreateOffering`, `PublishOffering`.
6. `apps/web`: listado y detalle de publicados + ISR + revalidación.


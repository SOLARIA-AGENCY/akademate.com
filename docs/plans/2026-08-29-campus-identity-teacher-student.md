# Campus Virtual: identidad alumno y docente, badges en ficha, CTA pública

**Fecha:** 2026-08-29
**Estado:** Slice de implementación P1 del Master Spec v1.1 (§5.5, §7.5, §8.7, §16.4, Apéndice F). Pendiente de GO.
**Ámbito:** Plataforma Akademate, todos los tenants.
**Spec padre:** [docs/specs/AKADEMATE_MASTER_ARCHITECTURE_SPEC.md](../specs/AKADEMATE_MASTER_ARCHITECTURE_SPEC.md).
**Superficie de código:** `apps/tenant-admin` (campus servido en `/campus` + `/api/campus/auth/*`).
**Idioma UI:** español. Copy sin em dash.

Este documento no sustituye el Master Spec ni el MVP alumno de julio 2026. Es el mapeo KEEP/EVOLVE sobre `students` / `staff`.

## Relación con lo ya documentado

| Documento | Qué cubre | Hueco respecto a este P1 |
|-----------|-----------|--------|
| **Master Spec v1.0 (28 ago)** | Person, InstructorEngagement, Campus capability, Instructor Workspace, CTA de template, proceso campus student/instructor, Fase 3 | No fijaba sesión campus vs Payload, tokens XOR, tres badges, auto-invite, host split ni destino `/campus/login`. Cerrado en v1.1. |
| Blueprint DIC 2025 | `apps/campus` como alumno/profesor. Host `campus.{tenant}.akademate.com`. | Sin modelo de sesión ni badges. |
| `docs/ARCHITECTURE.md` | Snapshot operativo. | Delega en el Master Spec. |
| ADR-002 / 0002-auth | Staff = Payload. Campus = alumno (histórico). | Actualizado: `kind` student/teacher. |
| Plan 2026-07-13 campus interno | Identidad **solo alumno**. Web pública fuera de alcance. | Este P1 lo extiende. |
| Código HEAD | `findStudentByEmail`, `campus_auth_tokens.student_id NOT NULL`. Staff sin hash campus. | Auth no resuelve profesores. |

Conclusión: el Master Spec v1.0 ya tenía docente y Campus como capability. El contrato de **sesión** (no User Payload, XOR, badges, auto-invite, host split, CTA a `/campus/login`) faltaba y está en v1.1. El plan de julio cubría solo alumnos y excluía la web pública.

## Objetivo de producto

1. Al crear una ficha de docente (`staff_type=profesor`) con email válido y `is_active`, provisionar acceso al Campus Virtual (identidad + email de alta). **No** abrir el dashboard de administración.
2. En ficha de docente y ficha de alumno: badge de estado de campus + botón para habilitar o reenviar.
3. El login de campus vive solo en el **host de campus** del tenant, ruta `/campus/login`, título “Campus Virtual”. El staff operativo sigue en el host de administración, `/auth/login`.
4. En la web pública del tenant, “Campus Virtual” apunta a ese host de campus, no a `/acceso` ni al AuthShell de staff.

P1 de este plan: identidad + badges + CTA + home docente con calendario de convocatorias asignadas (course runs donde el staff es teacher).

P2 (otro GO): chat alumno-docente, chat entre docentes, notificaciones de administración ricas. En P1 solo TODOs en código, no pantallas fake.

## Hechos del código (no reinventar)

Auth campus **hoy** es solo alumnos:

- `apps/tenant-admin/src/lib/campus/auth.ts` — `findStudentByEmail`, `CampusStudent`, cookie `campus_session`
- `apps/tenant-admin/app/api/campus/auth/login/route.ts`
- `apps/tenant-admin/app/api/campus/auth/invite/route.ts` — POST `{ studentId }`, token 7 días, email de activación, URL `CAMPUS_PUBLIC_URL || origin` + `/campus/activar`
- `apps/tenant-admin/app/api/campus/auth/activate/route.ts` — escribe `students.password_hash`
- `apps/tenant-admin/migrations/20260713_campus_virtual_internal.ts` — `campus_auth_tokens.student_id INTEGER NOT NULL`
- Gate: `src/lib/campus/environment.ts` — `CAMPUS_INTERNAL_ENABLED=true` y `CAMPUS_ENVIRONMENT` no production, o el API responde 404
- Cookie: `setCampusSessionCookie` no pone `Domain`. **Invariante:** nunca `Domain=.akademate.com` para `campus_session`. No mezclar `payload-token` en el host campus.

Fichas:

- Docente: `app/(app)/(dashboard)/profesores/[id]/page.tsx` (GET `/api/staff/:id`). Alta: `profesores/nuevo` → POST `/api/staff`
- Alumno: `app/(app)/(dashboard)/alumnos/[id]/page.tsx` (debe leer GET `/api/students/:id` o equivalente; no listar 200 y buscar por id)
- Staff: `src/collections/Staff/Staff.ts` — email unique opcional, `staff_type` profesor, **sin** credencial de campus
- Students: `password_hash` hidden, `last_login_at` ya existen

Web pública:

- El destino “Campus Virtual” / `/acceso` no puede ser el AuthShell de staff. El login de campus es `/campus/login` en el host campus.

Host split (contrato de plataforma; si falta en HEAD, hacerlo primero):

- Middleware `isCampusHost`: `/` y rutas no-campus → `/campus/login`
- `/auth/login` y `/dashboard` en host campus → 302 al host de administración del mismo tenant
- Login campus: `app/(app)/campus/login/page.tsx` dice “Campus Virtual”, POST `/api/campus/auth/login`. No reusar AuthShell de staff.

## Tres planos de autenticación

No hay un único “usuario Akademate”. Hay tres planos:

| Plano | Sujeto | Cookie | Host | Puede entrar a `/dashboard` |
|-------|--------|--------|------|------------------------------|
| Ops | usuario plataforma | sesión ops | `admin.akademate.com` | panel SaaS, no campus |
| Staff operativo | User Payload del tenant | `payload-token` | host de administración del tenant | sí |
| Campus | alumno **o** docente | `campus_session` | host de campus del tenant | **no** |

Crear un User Payload para un profesor **está prohibido** como mecanismo de campus: le daría el admin.

## Diseño de identidad (obligatorio)

Modelo mínimo. Migración additive. No dumps. No reescribir enrollments.

Ampliar credenciales de staff y `campus_auth_tokens`:

- `staff`: `campus_password_hash` (hidden, never en API), `campus_last_login_at`, `campus_invite_sent_at`
- `campus_auth_tokens`: `student_id` NULLABLE, `staff_id` NULLABLE, CHECK exactamente uno de los dos NOT NULL
- Login unificado: buscar alumno por email; si no, staff profesor activo por email; emitir JWT `campus_session` con claim `{ kind: 'student' | 'teacher', id, tenantId }`
- Activate/reset: el token sabe si es student o staff y escribe el hash correcto

Estados de badge (tres, no dos):

| Estado | Color | Copy |
|--------|-------|------|
| `no_habilitado` | gris | Campus virtual no habilitado |
| `invitacion_enviada` | ámbar | Invitación enviada (token setup no consumido) |
| `habilitado` | verde | Campus virtual habilitado (hash presente o last_login) |

Habilitar = POST invite (crear o rotar token setup 7d + email). Nunca setear password en claro. El usuario la crea en `/campus/activar`.

Alta de docente: after create en POST `/api/staff` si `staff_type=profesor`, email válido, `is_active`. Sin email: ficha ok, badge gris, sin mail. Idempotente: no duplicar invite si ya hay token vivo.

Alumno: mismo badge + botón. Reutilizar invite `studentId`. Auto-invite al crear alumno solo si el alta ya tiene email y `status=active` (mismo patrón que docente).

`CAMPUS_PUBLIC_URL` por tenant es el **origin** del host campus (sin path). Los mails usan `${CAMPUS_PUBLIC_URL}/campus/activar?token=`.

## Host de campus (todos los tenants)

Patrón canónico (Blueprint 4.2.1):

```text
Web pública:     {tenant}.akademate.com  | dominio custom verificado
Administración:  host tenant-admin del tenant (p. ej. app.{tenant} o alias)
Campus:          campus.{tenant}.akademate.com  | alias en tenant_domains
```

Reglas:

- El login de campus no se sirve en el host de administración ni en la web comercial como AuthShell de staff.
- Cookie `campus_session` host-only. No `Domain=.akademate.com`.
- No invites de staff Payload para este flujo.
- Navbar campus: el docente no ve progreso LMS de alumno ni navegación de admin.

## UI fichas (catálogo, no pintar en blanco)

```
Superficie: ficha dashboard (docente y alumno)
Catálogo:   shadcn (primitivos del repo)
Slug:       badge, button
Source:     apps/tenant-admin/@payload-config/components/ui/badge.tsx
            apps/tenant-admin/@payload-config/components/ui/button.tsx
Tokens:     verde habilitado / gris no habilitado / ámbar invitación
Salto:      —
```

Bloque “Campus Virtual” en la identity card / sidebar de:

- `profesores/[id]/page.tsx`
- `alumnos/[id]/page.tsx`

Botón: “Habilitar campus” o “Reenviar invitación”. Confirmación corta. Toast de email enviado o error. No navegar al login de staff.

Listados (`profesores/page.tsx`, `alumnos/page.tsx`): columna o chip opcional del mismo estado. No bloqueante si la ficha lo muestra.

No AuthShell. No tres cards idénticas.

## Login y home docente (P1 acotado)

- `/campus/login` ya existe; ampliar SessionProvider + JWT para `kind=teacher`.
- Tras login teacher: `/campus` o `/campus/docente` con lista de course runs asignados. Calendario simple: fechas inicio/fin/turno. Vacío: “Aún no tienes clases asignadas”.
- No mostrar progreso LMS de alumno al docente.

## Web pública

- Header (y footer/CTA si existe la etiqueta “Campus Virtual”): href absoluto al origin campus + `/campus/login` (`target=_self`).
- Preferible el enlace directo. Landing intermedia `/p/campus-virtual` solo si el header necesita copy; un solo botón “Entrar al Campus Virtual”. No clonar login de staff.
- Actualizar tests del header / contrato público que hoy esperen `/acceso` para este CTA.

## Tests (TDD en el contrato de identidad)

Vitest focal. No e2e masivo. No datos reales.

1. Unit: `resolveCampusLogin(email)` student vs teacher vs miss; JWT `kind`.
2. Invite teacher: staff sin email → 422; staff no profesor → 422; staff ok → token + `sendMail` con host campus.
3. Activate teacher token escribe `staff.campus_password_hash`, no `students`.
4. Badge reducer: hash / token vivo / nada.
5. Middleware: campus host `/` → `/campus/login`; `/auth/login` en campus → host admin. No romper tests existentes.
6. Public header href absoluto al host campus.
7. Ficha profesor: badge gris + botón; tras mock habilitado, badge verde.
8. No exponer `password_hash` ni `campus_password_hash` en GET `/api/staff/:id` ni `/api/students`.

## DoD

- [ ] Docente nuevo con email recibe mail de activación (o queda trazado invite) y **no** puede entrar a `/dashboard` con esa cuenta
- [ ] Ficha docente y alumno muestran uno de los tres badges
- [ ] Botón habilitar/reenviar llama invite y no usa `/auth/login`
- [ ] Login en host campus distingue alumno/docente
- [ ] Header web “Campus Virtual” → host campus `/campus/login`
- [ ] AuthShell de administración del tenant intacto (nombre de academia, no login de campus)
- [ ] Migración additive; gate `CAMPUS_INTERNAL_ENABLED` respetado
- [ ] Tests de identidad + header + badges
- [ ] Sin pin ni deploy salvo GO

## Fuera de alcance (P1)

Chat, notificaciones admin ricas, espacio social, certificados automáticos, gamificación persistente, marketplace, app móvil, merge a main, ads.

Cualquier procedimiento de un servidor, imagen Docker, Traefik o DNS concreto queda fuera de este documento: es operación, no arquitectura de producto.

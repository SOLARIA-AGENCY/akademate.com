---
phase: quick-2
plan: 03
wave: 2b
type: summary
completed_at: 2026-03-11T11:43:00Z
duration_minutes: 25
tasks_completed: 3
files_created: 2
files_modified: 1
commit: 6e37a02
---

# Wave 2b — Plan 03: UI de gestión de API Keys

## One-liner

Endpoints internos REST (cookie auth) + UI funcional con tabla, dialogs de creación/revocación, y modal de clave única para gestión de API Keys desde el dashboard.

## Archivos creados / modificados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `apps/tenant-admin/app/api/internal/api-keys/route.ts` | Creado | GET (listar) y POST (crear) de API keys via cookie auth |
| `apps/tenant-admin/app/api/internal/api-keys/[id]/route.ts` | Creado | PATCH (update parcial) y DELETE (revocar soft) por ID |
| `apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx` | Reemplazado | UI funcional con tabla, dialogs, y modal de clave unica |

## Implementacion

### Endpoints internos (`/api/internal/api-keys`)

- **Auth**: Cookie `payload-token` — se autentica via `payload.auth()` para extraer `tenantId`
- **GET**: Lista keys del tenant, filtra `key_hash` de la respuesta, retorna `[{ id, name, scopes, is_active, rate_limit_per_day, last_used_at, created_at }]`
- **POST**: Genera `plain_key` via `generateApiKey()`, almacena `key_hash` via `hashApiKey()`, retorna `plain_key` UNA sola vez en la respuesta 201
- **PATCH**: Actualiza campos individuales (name, scopes, is_active, rate_limit_per_day), verifica ownership por tenantId
- **DELETE**: Soft revoke (`is_active: false`); acepta `?hard=true` para eliminacion permanente

### UI (`/configuracion/apis`)

- **Tabla**: Nombre, Scopes (Badges con color por tipo: write=destructive, analytics=secondary, read=outline), Ultimo uso, Estado activa/revocada, Boton revocar
- **NewKeyDialog**: Campo nombre + checkboxes de scopes agrupados (Cursos, Alumnos, Matriculas, Analiticas, Gestion de claves) + input rate limit
- **PlainKeyModal**: Muestra `plain_key` con advertencia de seguridad, boton copiar, se cierra manualmente — nunca auto-cierra
- **RevokeDialog**: Confirmacion antes de revocar, soft delete via DELETE endpoint
- Iconos: `Key, Plus, Copy, Trash2, Check, AlertTriangle, Loader2, ShieldCheck, ShieldOff` — cero emojis

## Decisiones

1. **Soft revoke por defecto**: DELETE pone `is_active: false` en lugar de eliminar. Las keys revocadas quedan visibles en la tabla (opacidad reducida) para auditoria. Eliminacion permanente disponible via `?hard=true`.

2. **Cookie auth via `payload.auth()`**: Los endpoints internos usan `payload.auth()` pasando el cookie header, siguiendo el patron de Payload CMS para autenticacion server-side sin depender de la sesion custom `cep_session`.

3. **Separacion UI/API**: El endpoint GET nunca expone `key_hash`. El `plain_key` solo se retorna en el POST 201. La UI no almacena ni cachea el plain_key — lo muestra en el modal y lo descarta.

## Deviaciones

Ninguna — plan ejecutado exactamente como especificado.

## Self-Check

- [x] `apps/tenant-admin/app/api/internal/api-keys/route.ts` — existe
- [x] `apps/tenant-admin/app/api/internal/api-keys/[id]/route.ts` — existe
- [x] `apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx` — reemplazado
- [x] Commit `6e37a02` — existe
- [x] tsc --noEmit — sin errores en archivos nuevos
- [x] Cero emojis en la UI
- [x] Auth por cookie, no por Bearer
- [x] plain_key solo en respuesta POST 201

## Self-Check: PASSED

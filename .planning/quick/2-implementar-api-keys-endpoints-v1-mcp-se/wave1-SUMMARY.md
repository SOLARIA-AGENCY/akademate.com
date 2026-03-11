---
phase: quick-2
plan: 01
wave: 1
subsystem: api-keys
status: complete
commit: bddded8
completed_at: "2026-03-11"
duration_minutes: ~8
tasks_completed: 4
files_created:
  - apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts
  - apps/tenant-admin/lib/apiKeyAuth.ts
files_modified:
  - apps/tenant-admin/src/payload.config.ts
  - apps/tenant-admin/middleware.ts
---

# Phase quick-2 Plan 01 Wave 1 Summary

**One-liner:** Colección ApiKeys Payload CMS + utilidades SHA-256 + middleware Bearer pass-through edge-safe.

## Tasks Completed

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | Crear colección ApiKeys | DONE | `src/collections/ApiKeys/ApiKeys.ts` |
| 2 | Registrar ApiKeys en payload.config.ts | DONE | `src/payload.config.ts` |
| 3 | Crear lib/apiKeyAuth.ts | DONE | `lib/apiKeyAuth.ts` |
| 4 | Actualizar middleware.ts (Bearer pass-through) | DONE | `middleware.ts` |

## Artifacts Produced

### `src/collections/ApiKeys/ApiKeys.ts`
Colección Payload CMS con:
- `name` (text, required)
- `key_hash` (text, unique, indexed, readOnly en admin)
- `scopes` (array de select, 8 valores: courses:read/write, students:read/write, enrollments:read/write, analytics:read, keys:manage)
- `tenant` (relationship → tenants, required)
- `is_active` (checkbox, default true)
- `rate_limit_per_day` (number, default 1000, min 1, max 1000000)
- `last_used_at` (date, readOnly)
- Access control: superadmin ve todas; admin solo su tenant

### `lib/apiKeyAuth.ts`
Tres exports:
- `hashApiKey(plaintext: string) → string` — SHA-256 hex via `crypto.createHash`
- `generateApiKey() → string` — `ak_` + 64 hex chars via `crypto.randomBytes(32)`
- `validateBearerToken(token, getPayload) → ValidatedApiKey | null` — busca en DB por hash, verifica is_active, actualiza last_used_at (fire-and-forget), retorna `{ valid, tenantId, scopes, keyId }`

### `middleware.ts`
Añadido bloque antes del check de cookie:
- Detecta `Authorization: Bearer <token>` en headers
- Si presente: hace pass-through añadiendo header `x-api-bearer-token` para que los route handlers hagan la validación real
- Añade CORS, security y rate limit headers correctamente
- NO consulta DB — 100% edge-safe

### `src/payload.config.ts`
- Import añadido: `import { ApiKeys } from './collections/ApiKeys/ApiKeys'`
- Registrado en array `collections` bajo sección "API ACCESS"

## Deviations from Plan

None — plan ejecutado exactamente como especificado.

## Verification

```
FOUND: apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts
FOUND: apps/tenant-admin/lib/apiKeyAuth.ts
grep ApiKeys → payload.config.ts lines 32, 112
grep x-api-bearer-token → middleware.ts line 290
TypeScript: 0 errores propios (errores pre-existentes de @types/node y vitest ignorados)
```

## Next Wave

Wave 2 debe implementar los route handlers `/api/v1/` que usen `validateBearerToken` importando desde `lib/apiKeyAuth.ts`.

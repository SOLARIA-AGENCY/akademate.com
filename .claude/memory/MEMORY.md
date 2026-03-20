# Akademate.com — Memoria del Proyecto

## Infraestructura de Servidores

### Red NEMESIS (Tailscale)

| Servidor | IP Tailscale | Usuario | SSH Key | Rol |
|----------|-------------|---------|---------|-----|
| **NEMESIS** | `100.99.60.106` | `cmdr` | `~/.ssh/nemesis_cmdr_key` | Producción akademate |
| **ECO** | `100.83.250.65` | `cmdr` | `~/.ssh/nemesis_cmdr_key` | Otro servidor red |
| **Mac Mini DRAKE** | `100.79.246.5` | `carlosjperez` | password `5561` | Dev/staging local |
| **Hetzner C-BIAS** | `100.69.163.44` | `root` | `~/.ssh/id_cbias` | Infraestructura SOLARIA |

**Conexión a NEMESIS:**
```bash
ssh -i ~/.ssh/nemesis_cmdr_key cmdr@100.99.60.106
# o con alias SSH:
ssh ECO-tailscale
```

### NEMESIS — Stack Akademate

- **Repo en servidor:** `/home/cmdr/akademate/` (NO es git repo, se deploya con rsync/tar+scp)
- **Docker-compose:** `/home/cmdr/akademate/infrastructure/docker/docker-compose.yml`
- **Env producción:** `/home/cmdr/akademate/infrastructure/docker/.env`
- **Docker user:** `akademate` (no `postgres`)

**Contenedores corriendo:**
- `akademate-web` — port 3006 (Next.js)
- `akademate-tenant` — port 3009 (Payload CMS tenant-admin)
- `akademate-payload` — port 3003 (Payload CMS)
- `akademate-admin` — port 3004
- `akademate-portal` — port 3008
- `akademate-campus` — port 3005
- `akademate-nginx` — port 8088/8443
- `akademate-postgres` — port 5432
- `akademate-redis` — port 6379
- Coolify, Grafana, Loki, Uptime Kuma también corriendo

**URL producción:** `http://100.99.60.106:8088` (nginx proxy)

**Deploy workflow:**
```bash
# Sincronizar archivos
rsync -avz --relative -e "ssh -i ~/.ssh/nemesis_cmdr_key" <archivos> cmdr@100.99.60.106:~/akademate/

# Rebuild contenedor específico
ssh -i ~/.ssh/nemesis_cmdr_key cmdr@100.99.60.106 \
  'cd ~/akademate/infrastructure/docker && docker compose build --no-cache web && docker compose up -d --no-deps web'

# DB queries
ssh -i ~/.ssh/nemesis_cmdr_key cmdr@100.99.60.106 \
  'docker exec -i akademate-postgres psql -U akademate -d akademate -c "SELECT 1"'
```

**NEMESIS .env (producción):**
- `POSTGRES_PASSWORD=3dadbaa49a060b33dd5fdfa00e8a2a46`
- `PAYLOAD_SECRET=1804a98b51f7a0ff2e2e41e0c59dd79af65e315be6c94cf8c07c267d267169a9`
- `BETTER_AUTH_SECRET=bc76984d77c0ee97aa7e9a1fcafdce9d8797d4a014f66a2b84d5c1cada0498ef` (añadido 2026-03-03)
- `NEXT_PUBLIC_WEB_URL=http://100.99.60.106:3006`
- `NEXT_PUBLIC_TENANT_URL=http://100.99.60.106:3009`
- `GOOGLE_CLIENT_ID=919536166032-4o13asj1p6q21poe25v55od9e6eh95uq.apps.googleusercontent.com` (añadido 2026-03-04)
- `GOOGLE_CLIENT_SECRET=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` (añadido 2026-03-04, solo funciona con localhost)

**Nota conflicto DB:** La tabla `users` en NEMESIS tiene PK `INTEGER` (Payload CMS). Better Auth espera FK `UUID`. Las tablas `sessions`/`accounts`/`verifications` se crean SIN FK constraint a `users`.

**Bug pnpm symlinks en Docker standalone (RESUELTO 2026-03-03):**
- El problema: `COPY apps/web/node_modules ./node_modules` copia symlinks con rutas relativas `../../../node_modules/.pnpm/...` que son correctas en `apps/web/` pero se rompen en `/app/node_modules/` (apuntan a `/node_modules/...` que no existe)
- La solución: NO copiar `apps/web/node_modules` en el runner stage. El standalone Next.js ya incluye las dependencias trazadas con archivos reales (nft resuelve symlinks → copia archivos reales)
- `outputFileTracingIncludes` fuerza a nft a incluir paquetes adicionales (pg, better-auth) en el standalone con archivos reales
- `outputFileTracingRoot` NO usar — cambia la estructura del standalone y complica la resolución

---

## Stack Tecnológico

- **Monorepo:** pnpm workspaces, turbopack
- **`apps/web`:** Next.js 15, port 3006 — portal público + auth
- **`apps/tenant-admin`:** Payload CMS + Next.js, port 3009 — panel de academias
- **`packages/db`:** Drizzle ORM, PostgreSQL (`@akademate/db`)
- **`packages/auth`:** JWT/RBAC legacy — NO tocar

**pnpm PATH en Mac (local):**
```bash
export PATH="/usr/local/lib/node_modules/corepack/shims:$PATH"
```

---

## Better Auth Integration (2026-03-03)

**Branch:** `feat/better-auth-integration` (pusheado a origin)

**Archivos creados/modificados:**
- `apps/web/lib/auth.ts` — betterAuth config con drizzleAdapter
- `apps/web/lib/auth-client.ts` — createAuthClient para React
- `apps/web/lib/db.ts` — Drizzle connection (Pool de pg)
- `apps/web/app/api/auth/[...all]/route.ts` — toNextJsHandler
- `apps/web/middleware.ts` — protege /dashboard, /perfil, /mi-academia
- `apps/web/app/portal/login/page.tsx` — login page (Google + email/password)
- `apps/web/app/registro/completar/page.tsx` — post-OAuth completion
- `apps/web/app/registro/page.tsx` — añadido botón Google
- `apps/web/components/layout/header.tsx` — "Iniciar sesión" → /portal/login
- `packages/db/src/schema.ts` — tablas sessions, accounts, verifications
- `infrastructure/docker/docker-compose.yml` — env vars Better Auth en web service
- `infrastructure/docker/Dockerfile.web` — añadido packages/db/package.json

**Imports clave:**
```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'  // paquete separado v1.5.2
import { createAuthClient } from 'better-auth/react'
import { toNextJsHandler } from 'better-auth/next-js'
// usePlural: true — nuestras tablas son plurales
// getSessionFromRequest NO existe en better-auth/next-js
// Cookie: better-auth.session_token
```

**Google OAuth — CONFIGURADO (2026-03-04):**
- Ver sección "Google OAuth GCP Setup" más abajo para credentials y proceso completo

## Tenant-Admin Auth Pages (2026-03-03)

**Páginas auth creadas/modificadas:**
- `apps/tenant-admin/app/auth/login/page.tsx` — Google button + "Regístrate aquí" → /auth/signup
- `apps/tenant-admin/app/auth/signup/page.tsx` — Formulario nombre+email+pass+confirm + Google OAuth
- `apps/tenant-admin/app/api/auth/register/route.ts` — POST registro usando `payload.create({ overrideAccess: true })` + auto-login

**Flujo signup:**
1. `POST /api/auth/register` → `payload.create({ overrideAccess: true })` (evita `canCreateUsers` que bloquea anon)
2. Auto-login con `payload.login()` → obtiene token
3. `POST /api/auth/session` → persiste en cookie `cep_session`
4. Redirect a `/dashboard`

**Link signup:** Apunta a `/auth/signup` (local, no a web externa)

---

---

## Google OAuth GCP Setup (2026-03-04)

### Proyecto GCP

- **Cuenta:** `nazcamedianet@gmail.com`
- **Proyecto:** `akademate-prod` (project number: `919536166032`)
- **Proyectos eliminados:** `eco-omega-nemesis`, `eigent-1768657158230`
- **Proyecto SIN permiso:** `inspiring-voyager-63n8d` (otro propietario, NO eliminar)

### Credentials OAuth 2.0

```
GOOGLE_CLIENT_ID=919536166032-4o13asj1p6q21poe25v55od9e6eh95uq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**Authorized JS Origins:** `http://localhost:3006`
**Authorized Redirect URIs:** `http://localhost:3006/api/auth/callback/google`

> ⚠️ Solo funciona con localhost. Para producción NEMESIS se necesita dominio real (ver abajo).

### Método 1: gcloud CLI (autenticación)

```bash
# Autenticar
gcloud auth login   # abre browser para auth manual

# Listar proyectos
gcloud projects list

# Crear proyecto
gcloud projects create akademate-prod --name="Akademate"

# Habilitar APIs
gcloud services enable iamcredentials.googleapis.com --project=akademate-prod
gcloud services enable identitytoolkit.googleapis.com --project=akademate-prod
```

**Limitaciones CLI para cuentas personales Gmail:**
- `iap.googleapis.com` brands API → requiere Google Workspace Organization → **FALLA** con Gmail personal con error `"Project must belong to an organization."`
- No se puede crear OAuth consent screen ni OAuth clients programáticamente sin org
- `oauth2.googleapis.com` → servicio interno de Google, no se puede habilitar manualmente

### Método 2: Playwright Browser Automation (consola GCP)

Cuando el CLI falla para cuentas personales, usar Playwright para automatizar GCP Console:

```typescript
// Navegar a GCP Console — ya autenticado via gcloud auth login
mcp__plugin_playwright_playwright__browser_navigate({ url: 'https://console.cloud.google.com/...' })

// Para elementos que interceptan clicks usar dispatchEvent
await element.dispatchEvent('click')

// Para borrar URIs duplicados usar aria-label
page.locator('button[aria-label*="Borrar elemento"]')
```

**Pasos para OAuth consent screen via Playwright:**
1. `https://console.cloud.google.com/apis/credentials/consent?project=akademate-prod`
2. Seleccionar "Usuarios externos" (External)
3. Nombre: "Akademate", support email: nazcamedianet@gmail.com
4. Contact email: nazcamedianet@gmail.com
5. Aceptar términos → Crear

**Pasos para OAuth Client via Playwright:**
1. `https://console.cloud.google.com/apis/credentials/oauthclient?project=akademate-prod`
2. Tipo: "Aplicación web"
3. Nombre: "Akademate Web"
4. JS Origins: `http://localhost:3006`
5. Redirect URIs: `http://localhost:3006/api/auth/callback/google`
6. Crear → **COPIAR CLIENT SECRET INMEDIATAMENTE**

### Limitación CRÍTICA: IPs no válidas como redirect URI

Google OAuth **rechaza IPs** como redirect URIs (ej: `http://100.99.60.106:3006/...`). Error: _"Origen no válido: debe terminar con un dominio de nivel superior público"_

Para activar Google OAuth en NEMESIS producción:
1. Registrar un dominio (ej: `akademate.com`)
2. Apuntar DNS a `100.99.60.106`
3. Añadir en GCP Console:
   - JS Origin: `https://akademate.com`
   - Redirect URI: `https://akademate.com/api/auth/callback/google`
4. Actualizar `NEXT_PUBLIC_WEB_URL=https://akademate.com` en `.env`

### Limitación CRÍTICA: Secrets no visibles en nueva GCP Auth Platform

El nuevo GCP Auth Platform (2026) ya **NO muestra ni permite descargar** el client secret después de crearlo. Panel dice: _"Ya no se pueden ver ni descargar los secretos del cliente"_.

Si necesitas el secret:
1. "Add secret" button → genera un nuevo secret adicional
2. O capturarlo en el momento de creación del cliente

### Estado App GCP

La app está en modo **"Testing"**. Solo usuarios añadidos como "Test users" pueden autenticarse con Google OAuth. Para abrir al público hay que publicar la app (requiere verificación de Google si accede a scopes sensibles).

---

## Plan Limits + Upgrade Gate — Implementado 2026-03-04

### Archivos creados
- `apps/tenant-admin/@payload-config/lib/planLimits.ts` — PLAN_LIMITS const + getLimit()
- `apps/tenant-admin/@payload-config/hooks/usePlanLimits.ts` — hook SWR que lee subscription.plan via useTenantBranding().branding.tenantId
- `apps/tenant-admin/@payload-config/components/ui/PlanLimitModal.tsx` — Dialog shadcn con CTA a /facturacion

### Límites
| Plan | Sedes | Cursos | Ciclos |
|------|-------|--------|--------|
| starter | 1 | 20 | 0 |
| pro | 5 | 100 | 10 |
| enterprise | ∞ | ∞ | ∞ |

### Integración
- `cursos/page.tsx`, `sedes/page.tsx`, `ciclos/page.tsx` — handleAdd/handleNuevoCiclo guarda con checkLimit()
- `AppSidebar.tsx` — badge Lock en "Ciclos" cuando plan=starter

---

## Classrooms (Aulas) — Implementado 2026-03-04

### DB
- Tabla `classrooms` creada en PostgreSQL: `code (unique), name, capacity, floor, resources (jsonb), campus_id (FK), is_active, notes, tenant_id`
- FK `classroom_id` añadida a `course_runs`

### Payload CMS
- Colección `Classrooms` registrada en `src/payload.config.ts`
- Archivos: `src/collections/Classrooms/` (Classrooms.ts, Classrooms.validation.ts, access/canManageClassrooms.ts, index.ts)
- Slug Payload: `classrooms` → API Payload nativa en `/api/classrooms`

### API Custom
- `GET/POST /api/aulas` — lista/crea aulas con join a campus
  - Parámetros GET: `?campus_id=X`, `?active=false`
  - Respuesta: `{ id, code, nombre, capacidad, planta, recursos, sedeId, sedeNombre, activa }`
- `POST /api/convocatorias` actualizado: usa `classroom_id` FK real (no texto en notes)

### UI Actualizada
- `ConvocationGeneratorModal`: aula field → Select dinámico (carga desde `/api/aulas?campus_id=X` al cambiar sede)
- `sedes/page.tsx`: carga `/api/aulas` en paralelo con campuses, muestra conteo real de aulas y capacidad total

---

## Mac Mini DRAKE — Notas

- Docker Desktop corre en DRAKE (NO en NEMESIS producción)
- Docker credential issue en SSH: quitar `credsStore` de `~/.docker/config.json`
- El akademate en DRAKE es una instancia de desarrollo/test separada

## Entorno de Desarrollo

**IMPORTANTE:** El proyecto akademate.com SOLO corre en dev/test en NEMESIS (servidor remoto). NO hay entorno de desarrollo local en el Mac. Todo deploy y prueba se hace contra NEMESIS vía SSH + rsync + docker compose.

- **No lanzar builds locales** — solo rsync archivos + docker compose build en NEMESIS
- **Deploy workflow estándar:** `rsync → docker compose build --no-cache [service] → docker compose up -d --no-deps [service]`
- **Build con caché (~3 min):** `docker compose build tenant` — solo reconstruye código, pnpm install cacheado si no cambia pnpm-lock.yaml
- **Build sin caché (~18 min):** `docker compose build --no-cache tenant` — SOLO usar cuando cambian dependencias (pnpm-lock.yaml). NUNCA para cambios de código.
- **Problema con múltiples builds simultáneos** — siempre verificar con `ps aux | grep "docker compose build"` antes de lanzar un nuevo build

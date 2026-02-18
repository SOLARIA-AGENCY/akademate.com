# Ops Auth Real (Payload) - February 18, 2026

## Objetivo
Migrar `apps/admin-client` de login demo a autenticacion real contra usuarios de Payload CMS.

## Cambios aplicados

### 1) Payload API routing fix
- Archivo: `apps/payload/app/api/payload/[[...payload]]/route.ts`
- Fix: el handler estaba leyendo `params.slug`, pero la ruta usa `[[...payload]]`.
- Resultado: ahora construye correctamente el `path` interno para `handleEndpoints`, habilitando rutas reales de Payload como:
  - `POST /api/payload/users/login`
  - `GET /api/payload/users/me`

### 2) Login real en Ops admin
- Archivo: `apps/admin-client/app/api/auth/login/route.ts`
- Cambio:
  - Valida `email` y `password`.
  - Hace proxy server-to-server a Payload:
    - `POST ${PAYLOAD_CMS_URL}/api/payload/users/login`
  - Solo permite acceso a usuarios con rol `superadmin`.
  - Crea cookie `akademate_admin_session` con datos de sesion reales.

### 3) Cookie `Secure` compatible con staging HTTP
- Archivos:
  - `apps/admin-client/app/api/auth/login/route.ts`
  - `apps/admin-client/app/api/auth/logout/route.ts`
- Cambio:
  - `secure` ahora se activa solo en peticiones HTTPS reales (`https://` o `x-forwarded-proto=https`).
  - Evita perdida de cookie en staging con acceso por `http://IP:3004`.

### 4) Formulario de login de Ops
- Archivo: `apps/admin-client/app/login/page.tsx`
- Cambio:
  - El formulario envia `email + password` al endpoint real `/api/auth/login`.
  - Eliminado el uso demo local (`localStorage`) y su dependencia defectuosa.
  - Mensajeria de UI actualizada para auth real.

### 5) Middleware Ops para acceso por IP/staging
- Archivo: `apps/admin-client/middleware.ts`
- Cambios:
  - Excluye `'/api/auth'` y `'/api/upload'` del middleware de tenant.
  - Fallback de tenant para host de Ops/IP.
  - Inyeccion de `x-tenant-id` para acceso por IPv4 directo.

### 6) Compose
- Archivo: `infrastructure/docker/docker-compose.yml`
- Cambio:
  - `DEFAULT_TENANT_ID` en servicio `admin` con valor por defecto `1`.

## Credenciales de referencia (seed Payload)
- `admin@akademate.io` / `Akademate2024!` (superadmin)
- `admin@demo-academy.com` / `DemoAdmin2024!` (admin tenant, no superadmin)

## Verificacion esperada
1. Abrir `http://<host>:3004/login`
2. Login con `admin@akademate.io`.
3. Debe navegar a `/dashboard`.
4. `GET /api/auth/session` debe devolver `authenticated: true`.

## Notas
- `admin@demo-academy.com` debe recibir `403` en Ops por no ser `superadmin`.
- Si staging esta detras de HTTPS, la cookie se emite `Secure`.

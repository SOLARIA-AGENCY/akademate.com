# Status Report — Akademate

**Fecha:** 2026-01-17
**Estado general:** VERIFICADO (dev local). Preparado para dev/staging con requisitos de entorno.

## Verificaciones ejecutadas
- Unit tests: `pnpm test` ✅ (36 files, 895 passed, 14 skipped)
- E2E smoke: web/admin/tenant-admin/payload/campus/portal/ops ✅ (ver LOGS.md)
- Security scan: trufflehog filesystem ✅ (0 findings, excluyendo caches)
- Audit de dependencias: `pnpm audit --audit-level=moderate` ✅ (0 high/critical)
- RLS verification: `packages/db/src/rls/verification.sql` ✅ (0 missing RLS)
- Rate limiting login: ✅ 5x 401 y 6º intento 429

## Infra local utilizada
- PostgreSQL 16 (Homebrew) + DBs: `akademate_dev`, `tenant_admin_dev`
- Redis (Homebrew) en `redis://localhost:6379`

## Requisitos para DEV
- `DATABASE_URL=postgresql://localhost:5432/akademate_dev`
- `REDIS_URL=redis://localhost:6379`
- `PAYLOAD_SECRET=dev_secret_change_in_production_32chars`

## Requisitos para STAGING
- `DATABASE_URL` (Postgres administrado)
- `REDIS_URL` (Redis administrado)
- `PAYLOAD_SECRET` fuerte (32+ chars)
- `SMTP_*` y `MINIO/R2` según entorno

## Cambios relevantes recientes
- RLS policies alineadas a UUID + verificación OK.
- Login API devuelve 401 en AuthenticationError (rate limit validado).
- Secret scan limpio tras remover credenciales hardcodeadas en auto-deploy.

## Observaciones
- Advertencias por email adapter/sharp en tenant-admin (no bloqueantes en dev).

# Runbook: Backup & Restore

## Objetivo
Asegurar backups confiables y restauraciones verificables para datos y assets.

## Alcance
- Postgres (datos principales)
- Storage S3/MinIO/R2 (assets)
- Configuracion (env vars/secretos)

## Backup diario (Postgres)
1. Verificar credenciales y conectividad.
2. Ejecutar backup:
   - `pg_dump --format=custom --file=backup.dump $DATABASE_URL`
3. Subir a almacenamiento seguro (S3/MinIO/R2).
4. Verificar checksum y retencion.

## Restore (Postgres)
1. Provisionar base destino vacia.
2. Ejecutar restore:
   - `pg_restore --clean --if-exists --dbname=$DATABASE_URL backup.dump`
3. Correr migraciones si aplica.
4. Verificar integridad basica (counts, health checks).

## Backup de assets
1. Sincronizar bucket:
   - `rclone sync s3:akademate-assets s3:akademate-backups/assets`
2. Validar objetos criticos (logos, certificados, media).

## Restore de assets
1. Sincronizar bucket desde backup:
   - `rclone sync s3:akademate-backups/assets s3:akademate-assets`
2. Verificar URLs publicas y permisos.

## Checklist
- [ ] Backup completado y almacenado
- [ ] Checksum verificado
- [ ] Restore probado en entorno staging
- [ ] Retencion aplicada (30/90/365 dias)

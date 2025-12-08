# 0003 - Storage de assets

- Status: Proposed
- Context: Web pública, admin y campus necesitan subir/servir assets por tenant con aislamiento y performance.
- Decision: Usar R2/MinIO con buckets compartidos y paths `tenant_id/...`; uploads presignados; metadatos de branding/versionado; CDN opcional; referencias guardadas en Payload/DB con checksum.
- Consequences: Jobs deben limpiar assets huérfanos por tenant; políticas de acceso deben validar `tenant_id`; imágenes en Next usan URLs firmadas.

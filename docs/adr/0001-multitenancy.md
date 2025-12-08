# 0001 - Multitenancy estricto

- Status: Proposed
- Context: Akademate sirve múltiples academias en `akademate.com` y dominios custom; cada superficie (ops, admin, campus, payload) debe aislar datos.
- Decision: Todas las entidades incluyen `tenant_id`; resolución por dominio/claim; RLS aplicada en Payload hooks y en el SDK (`where tenant_id = ?` obligatorio); assets en R2/MinIO namespaced por tenant; CSS vars para theming.
- Consequences: Aislamiento fuerte y auditoría por tenant; dependencia de mapeo dominio→tenant en edge/middleware; tests deben cubrir filtros de `tenant_id` en cada consulta y job.

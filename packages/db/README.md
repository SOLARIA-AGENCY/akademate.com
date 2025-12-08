# @akademate/db

Base de datos con Drizzle ORM para Postgres 16. Define helpers multitenant y versionado del esquema para las apps Next y Payload.

## Objetivos
- Centralizar tablas y migraciones con `tenant_id` obligatorio.
- Compartir seeds utilitarios y RLS-friendly para Payload hooks.
- Facilitar integración con jobs y SDK.

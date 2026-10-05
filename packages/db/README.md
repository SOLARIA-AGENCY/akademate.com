# @akademate/db

Base de datos con Drizzle ORM para Postgres 16. Define helpers multitenant y versionado del esquema para las apps Next y Payload.

## Objetivos
- Centralizar tablas y migraciones con `tenant_id` obligatorio.
- Compartir seeds utilitarios y RLS-friendly para Payload hooks.
- Facilitar integración con jobs y SDK.

## Nota de diseño frontend compartido
- La base de diseño shadcn completa del proyecto está en `vendor/academate-ui`.
- Documento de referencia: `docs/runbooks/frontend-design-integration.md`.

## REM-033: preparación de defensa tenant

La fuente de clasificación está en `tenant-defense/inventory.json`. El auditor compara esa
clasificación con `src/schema.ts` y con todas las migraciones SQL existentes:

```bash
pnpm --filter @akademate/db tenant:audit
pnpm --filter @akademate/db tenant:audit:markdown
```

El proceso sale con código distinto de cero si aparece una tabla sin clasificar, si cambia la
presencia/nullabilidad de `tenant_id`, o si una tabla tenant-owned no es `NOT NULL`. Puede escribir
un artefacto sin incorporarlo al repositorio con `--output /ruta/reporte.json`.

### Estado inventariado

- 37 tablas Drizzle: 31 tenant-owned y 6 globales.
- 2 tablas migration-only globales: `password_reset_tokens` y `login_attempts`.
- Gap activo: `badge_definitions.tenant_id` es nullable. Por ello el audit debe devolver `FAIL`.
- Gap legacy: `0002_add_sessions.sql` define otra forma tenant-scoped de `sessions`, incompatible
  con la tabla global de Better Auth que hoy es autoridad en Drizzle. REM-033 no corrige auth ni
  reescribe esa migración histórica.

### Checklist de activación

1. Generar y archivar los reportes JSON y Markdown contra el SHA candidato.
2. Confirmar con cada owner que las 31 clasificaciones tenant-owned siguen siendo correctas.
3. Resolver el conflicto legacy de `sessions` en una remediación de auth separada.
4. Para una tabla sin columna, materializar y revisar `templates/01-expand-tenant-id.sql`; desplegar
   solo la expansión nullable.
5. Desplegar primero la escritura dual o derivación de ownership de la aplicación correspondiente.
6. Materializar `templates/02-backfill-and-verify.sql` con un join de ownership explícito; ejecutarlo
   de forma idempotente y exigir cero NULL y cero huérfanos.
7. Ejecutar las consultas de `staging/02-comparison-queries.sql` por tabla y por tenants de prueba.
8. Crear el rol staging `rem033_observer`, aplicar `staging/01-observation-policies.sql` y comparar
   conteos privilegiados vs. conteos del observer. No aplicar este SQL en producción.
9. Ante anomalías, ejecutar `staging/99-disable-observation-policies.sql`; este rollback elimina
   únicamente políticas `rem033_observe_*` y no desactiva RLS existente.
10. Solo tras backfill estable, materializar `templates/03-enforce-not-null.sql` en una migración
    separada. Re-ejecutar auditor, tests DB y typecheck.
11. Diseñar cualquier activación RLS productiva tabla por tabla en un cambio posterior, con pruebas
    de roles reales, pool/transacciones y bypass administrativo. No hay activación global en REM-033.

### Límites actuales

Las políticas de observación no demuestran aislamiento productivo: no se han aplicado a staging,
no se han comparado datos reales y no prueban que todas las rutas establezcan `app.tenant_id`. Las
plantillas contienen placeholders y no forman parte del journal de migraciones; deben materializarse
y revisarse antes de ejecución. Las migraciones históricas con RLS se conservan sin modificación.

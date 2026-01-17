# Runbook: Deploy

## Objetivo
Estandarizar el despliegue a staging y production.

## Pre-Deploy
1. CI en verde (lint/typecheck/tests/e2e si aplica).
2. Validar migraciones pendientes.
3. Verificar variables/secretos.

## Deploy Staging
1. Desplegar apps y packages.
2. Ejecutar migraciones.
3. Smoke tests.

## Deploy Production
1. Desplegar apps y packages.
2. Ejecutar migraciones.
3. Verificar health checks.
4. Monitorizar errores y rendimiento.

## Rollback
1. Revertir al release anterior.
2. Revertir migraciones si aplica.
3. Validar servicios.

## Checklist
- [ ] CI verde
- [ ] Migraciones ejecutadas
- [ ] Smoke tests ok
- [ ] Health checks ok

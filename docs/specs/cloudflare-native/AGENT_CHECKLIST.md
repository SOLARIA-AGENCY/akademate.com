# Agent action checklist

Modos (prompt v2.0): `GUIDED_BOOTSTRAP` · `ARCHITECTURE_AUDIT` · `SUPERVISED_TRANSFORMATION` · `AUTONOMOUS_OPERATIONS`.  
Ahora: **ARCHITECTURE_AUDIT**, PHASE 0, sin escrituras de producción.

## El agente PUEDE (sin GO extra de infra)

- Auditar monorepo, schema, wrangler existente, tests. No pedir secretos. Un paso humano B-* a la vez.
- Escribir/actualizar specs, ADRs, matrices.
- Implementar `TenantDataContext` interfaces y tests sintéticos locales.
- PRs de campus P1 sobre Postgres (contrato Master Spec; no espera D1).
- CI de lint/type/unit.

## El agente PUEDE PREPARAR (confirmación humana)

- `wrangler d1 create` staging.
- R2 buckets staging.
- Queues/Workflows staging.
- Access policy JSON.
- GitHub Environments.

## El agente NO TOCA

- Producción D1/R2/Stream.
- Vault ROOT 1Password.
- Tokens Global API.
- DNS de akademate.com sin GO (hoy sirve marketing).
- Cutover de tenants reales.
- Acciones R3/R4.
- Mezclar cuenta CF de otros productos BRIK64.
- Deploy Hetzner/On-Prem “porque el spec Cloud lo dice”.

## Tras bootstrap (automatizable)

Provision tenant, deploys versionados, backups programados, metering, loops R0/R1, preview apps.

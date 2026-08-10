# Akademate Next — estado de integraciones financieras

Fecha de corte: 2026-08-10
Rama: `codex/akademate-next-offers-integrated`
Superficie pública relacionada: `codex/akademate-public-es-verticals` en el worktree aislado `akademate-public-expansion`.

## Resultado de esta iteración

- Runtime `disabled | scaffold | connected` con fail-closed estricto.
- Contrato provider-neutral y catálogo inicial Holded, Xero y QuickBooks Online.
- Custodia de secretos AES-256-GCM con AAD tenant/conexión/proveedor/propósito.
- Migración Next con tablas financieras, RLS forzado y relaciones tenant-composite.
- Proyección append-only de `paid_offer_payment_events`; discrepancias pasan a `requires_review`.
- Cola/drainer interno firmado por HMAC; el drainer no recibe secretos ni está en la red de salida.
- APIs autenticadas y redacted para conexiones, resumen e integración a medida.
- Workspace financiero sin métricas inventadas y subpáginas que describen límites reales.
- Formulario autenticado para solicitudes de proveedores no nativos.
- Registro público centralizado; proveedores nativos siguen `coming-soon` y el proveedor genérico usa `custom-request`.

## Evidencia local

| Área | Comando | Resultado |
| --- | --- | --- |
| Runtime, proveedores, secretos, conexiones, proyección, drainer y solicitudes | `CI=true pnpm --filter @akademate/tenant-admin exec vitest run ...` (8 archivos) | 25 tests passed |
| Alcance Next afectado | `CI=true pnpm --filter @akademate/tenant-admin run typecheck:next-offers` | PASS |
| Compose | `docker compose --env-file infrastructure/akademate-next/.env.example -f infrastructure/akademate-next/compose.yaml config --format json` | PASS; drainer sólo `akademate_next_internal` |
| Registro público | `node_modules/.bin/vitest run lib/integration-availability.test.ts` | 3 tests passed |
| Tests públicos de marketing/pricing/i18n | `node_modules/.bin/vitest run lib/integration-availability.test.ts lib/marketing-content.test.ts lib/pricing-content.test.ts lib/i18n/marketing-copy.test.ts` | 50 tests passed |
| TypeScript web público | `node_modules/.bin/tsc --noEmit` desde `apps/web` | PASS |

## Tres intentos adversariales realizados

1. Runtime: `scaffold` con I/O habilitado se reduce a `disabled`; un runtime legacy nunca activa finanzas.
2. Secretos: tenant/AAD cambiado, ciphertext manipulado y versión de clave desconocida fallan sin devolver material sensible.
3. Transporte interno: replay de nonce, body alterado, timestamp vencido y modo scaffold son rechazados antes de reclamar una ejecución.

Además se probaron replay idempotente de proyección, mismatch de importe a `requires_review`, URL privada/no HTTPS en solicitudes y prueba pública `available` sin `proofSha`.

## Qué sigue bloqueado o no verificado

- No se ha ejecutado la migración contra un PostgreSQL 16 desechable en esta sesión; `verify:next-finance-db` queda preparado para ejecutarse cuando existan las URLs owner/app de una base de prueba.
- Holded, Xero y QuickBooks no tienen adaptadores de transporte, OAuth/API-key exchange, webhooks ni sandbox ejecutados. `createFinanceProviderAdapter` rechaza el modo conectado por diseño.
- No hay writeback; no se han emitido facturas ni se ha alterado ningún dato financiero externo.
- No se ha desplegado ni publicado ningún commit. CEP Formación no se ha tocado.
- El `pnpm` público completo está bloqueado por drift basal del lockfile (`packages/jobs/package.json` añade `postgres`); se validó con binarios locales sin mutar el lockfile.

## Porcentajes del programa financiero

| Dimensión | Estado |
| --- | ---: |
| Auditado | 100% |
| Planificado | 100% |
| Implementado localmente | 65% |
| Probado localmente | 55% |
| Migración aplicada en PostgreSQL 16 | 0% |
| Adaptadores nativos con sandbox | 0% |
| Commit | pendiente de revisión final |
| Push | 0% |
| Desplegado | 0% |
| Live verified | 0% |

Los porcentajes son del programa de integraciones financieras, no del producto Akademate completo.

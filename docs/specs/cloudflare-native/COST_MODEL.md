# Cost model (Cloudflare)

Fuentes: [SOURCES.md](./SOURCES.md). Recalcular con la página de pricing el día de presupuesto. No usar tenant count como único driver.

## Drivers reales

MAU, requests, D1 rows read/written, D1 GB, R2 GB+ops, Stream storage+delivery minutes, Queue ops, Workflow CPU/instances, DO, Worker CPU, AI tokens, email.

## D1 (Paid, 2026-04-21)

Included: 25B rows read/mo, 50M writes/mo, 5 GB.  
Extra: $0.001 / M reads, $1.00 / M writes, $0.75 / GB-mo.  
50k databases/account included as count; se paga storage+queries, no “por DB”.  
10 GB/DB cap. Single-thread: un tenant heavy puede necesitar DB dedicada antes que 10k tiny tenants.

## Queues (Paid)

1M operations/mo included + $0.40 / M. ~3 ops por mensaje (write+read+delete). Retries y DLQ suman ops.

## Sensibilidad (orden de magnitud, no factura)

| Escenario | Hipótesis | Sensible a |
| --- | --- | --- |
| 10 tenants BASE | pocos MAU, D1 dentro de included | Worker requests, R2 |
| 100 AVERAGE | campus + VOD ligero | Stream delivery, D1 reads (listados sin índice) |
| 1_000 HEAVY mix | 1–2 tenants video-heavy | Stream $ y un shard saturado (CPU D1), no el número de tenants |
| 10_000 | muchos DBs/shards | bindings/routing, metering, support ops, no 10 GB vertical |

Un `SELECT *` mensual en tablas grandes mueve `rows_read` más que “tener 10k filas”. Índices son control de coste.

Workers, R2 egress to CF, D1 egress: verificar siempre la tabla oficial (D1: no egress charge documentado 2026-04-21).

Startup Plan / Launchpad $250k: **REQUIRES APPLICATION REVIEW**, no está en este modelo como ingreso.

On-Prem: este modelo no aplica; capex/opex del cliente.

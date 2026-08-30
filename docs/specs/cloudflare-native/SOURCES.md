# Cloudflare-native spec: fuentes oficiales consultadas

Fecha de consulta: 2026-08-29. Si un número de límite o precio cambia, gana la página oficial.

| Recurso | URL | Fecha doc | Status citado |
| --- | --- | --- | --- |
| D1 limits | https://developers.cloudflare.com/d1/platform/limits/ | 2026-04-21 | GA. 50k DBs/account Paid (aumentable). 10 GB/DB no aumentable. Time Travel 30 d Paid. ~5k bindings/Worker. D1 es single-threaded por DB. Diseñado para per-tenant. |
| D1 pricing | https://developers.cloudflare.com/d1/platform/pricing/ | 2026-04-21 | GA. Paid: 25B rows read + 50M writes + 5 GB included. $0.001/M reads, $1/M writes, $0.75/GB-mo. |
| D1 read replication | https://developers.cloudflare.com/d1/best-practices/read-replication/ | 2026-08-10 | PUBLIC BETA. Sessions API + bookmarks. Sin coste extra de replica. |
| Queues pricing | https://developers.cloudflare.com/workers/platform/pricing/ | consultado 2026-08-29 | GA. Paid: 1M ops/mo + $0.40/M. Retención 4–14 d. DLQ documentado. |
| Workflows | changelog 2025-04-07 + 2025-10-28 | GA desde 2025-04-07 | Paid: hasta 10k instancias concurrentes (oct 2025). waitForEvent para human-in-the-loop. |
| Email Sending | https://developers.cloudflare.com/email-service/ changelog 2026-04-16 | PUBLIC BETA | Workers Paid. Binding `EMAIL.send()`. SMTP beta 2026-06-08. **No dependencia crítica sin EmailProvider fallback.** |
| Email Routing | mismo Email Service | GA (incoming) | Free+Paid. |
| Secrets Store | changelog 2025-04-09 + /secrets-store/ | BETA | Account-level. Fallback GA: Worker secrets (`wrangler secret put`). |
| Cloudflare for SaaS | /cloudflare-for-platforms/cloudflare-for-saas/ | 2026-06-19 | GA. PAYG: hasta 50k custom hostnames (mayo 2025). Fallback origin + DCV. |
| Workers Custom Domains | /workers/configuration/routing/custom-domains/ | 2026-08-14 | GA. DNS+certs automáticos en zona propia. |
| RealtimeKit | https://developers.cloudflare.com/realtime/realtimekit/ | 2026-08-25 | GA (producto). Classrooms/webinars. **Akademate Live = FUTURE.** V1 = BYO Meet/Zoom/Teams. |
| Workers Launchpad | https://www.cloudflare.com/startups/workers-launchpad/ | 2026 | CONFIRMED programa. $250k créditos **si** entras en Launchpad / Startup Plan. Elegibilidad: REQUIRES APPLICATION REVIEW. |
| OpenNext on Workers | docs + git history `apps/web/wrangler.jsonc` (`7f0cd9fe`…`d4d54cc7`); **ausente en branch `cep/platform-optimize`** | 2026-08-29 | CONFIRMED en producción para marketing según reglas de repo y worker `akademate-web.nazcamedia.workers.dev`. Wrangler no está en el working tree actual. |

No se encontró en docs oficiales (2026-08-29) un `env.getD1(databaseUuid)` en el Worker Binding API. El attach es por binding estático en wrangler. Eso condiciona el diseño V1 de shards (ADR-0017).

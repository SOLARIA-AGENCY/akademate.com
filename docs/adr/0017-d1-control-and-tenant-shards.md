# 0017 - Control D1 + tenant shards (V1)

- Status: Accepted
- Date: 2026-08-29
- Sources: https://developers.cloudflare.com/d1/platform/limits/ (2026-04-21)
- Context: D1 está diseñado para muchas bases pequeñas (per-tenant), 50k DBs/account Paid, 10 GB/DB no aumentable, un DB single-threaded. El Worker Binding API documentado es estático (~5k bindings/script). No hay `getD1(uuid)` GA verificado el 2026-08-29.
- Decision:
  - `AKADEMATE_CONTROL_D1` para plataforma (tenants, mapping, billing, agents).
  - V1: N shards D1 (N << 5000) con `tenant_id` interno + mapping en Control.
  - Target: 1 D1 por tenant cuando el attach dinámico esté documentado GA y testeado.
  - Sessions API + bookmarks para lecturas. Read replication = beta, no crítica.
  - Time Travel 30 d Paid + export R2. Writes en primary.
- Consequences: No prometer 10k bindings en un wrangler.json. Un tenant heavy se mueve a shard dedicado. Tests de isolation son P0. SQL debe ser SQLite-compatible; RLS de Postgres no se copia tal cual.

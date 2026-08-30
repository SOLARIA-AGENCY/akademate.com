# 0016 - Cloud SaaS vs Enterprise On-Prem adapters

- Status: Accepted
- Date: 2026-08-29
- Context: El Master Spec y ADR-0007 fijan PostgreSQL + Payload + Docker para el producto. El marketing ya corre en Cloudflare Workers. Un SaaS global no debe exigir VPS en el path crítico, y On-Prem no debe exigir D1.
- Decision:
  - Un Canonical Core (domain, application, policies, events, capabilities).
  - Persistence Adapter: `D1TenantDataStore` (Cloud SaaS) y `PostgresTenantDataStore` (Enterprise On-Prem).
  - Cloud SaaS: Cloudflare-native, serverless-first, sin VPS en el path de producto.
  - On-Prem/Dedicated: Docker + Postgres (Master Spec §28). No mezclar estrategias de datos.
  - Neon deja de ser el default “SaaS managed Postgres” (suprime esa vía de ADR-0007 para Cloud). Hyperdrive+Postgres es **puente** de migración, no destino.
- Consequences: Hay que invertir en `TenantDataContext`. Prohibido `if deployment === cloud` en reglas académicas. Campus P1 y el dominio no esperan a D1.

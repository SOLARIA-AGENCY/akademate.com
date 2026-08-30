# 0007 - Payload is the CMS; Postgres + domain are the platform

- Status: Accepted
- Date: 2026-08-26
- Context: Akademate already runs Payload + Postgres + Drizzle. CEP OVH added a session-first engine as Payload collections. Marketing sells Launch/Business/Enterprise and dedicated or on-premise as independent axes. Replacing Payload with Supabase would duplicate Auth/RBAC/API and break Enterprise On-Premise. Neon is a managed Postgres option for SaaS only.
- Decision:
  - PostgreSQL is the source of truth. One instance per deployment. SaaS may later use Neon; Enterprise On-Premise uses standard Postgres.
  - Payload owns CMS, media, SEO, website templates, editable catalogue (`courses`, `course-runs`, `course-run-sessions`) and tenant configuration (plan, deployment, blueprint).
  - Domain operations (overlap, occupancy, ledger, placements, capability resolution) live in `@akademate/academic`. New academic tables are Drizzle, keyed by live Payload integer ids. Do not write them against the unused UUID `packages/db` catalog.
- Do not add Payload collections for phases, partners, ledger or placements on akademate.com.
- Do not introduce Supabase. Cloud SaaS destino = D1 shards (ADR-0016/0017), no Neon. Hyperdrive+Postgres solo como puente de migración. Enterprise On-Premise = Postgres estándar.
- Feature flags remain rollout switches. Product modules are capabilities derived from `plan ∩ blueprint ∪ enterprise overrides`.
  - CEP is `enterprise` + `on_premise` + `cep-professional-training-enterprise-v1`, not `if tenantId === 1`.
- Consequences: Yoga/Languages tenants never inherit FP scheduling. CEP On-Premise stays portable (Akademate + Payload + Postgres). Occupancy writers go through the domain adapter over existing `course_run_sessions`.

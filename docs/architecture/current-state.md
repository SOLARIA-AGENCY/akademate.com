# Current-state architecture audit (PHASE 0 snapshot)

**Mode:** `ARCHITECTURE_AUDIT`  
**Write authority:** read-only  
**Branch inspected:** `cep/platform-optimize`  
**Date:** 2026-08-29  
**Prompt:** [MASTER_EXECUTION_PROMPT_v2.0.md](../specs/cloudflare-native/MASTER_EXECUTION_PROMPT_v2.0.md)

This is an inventory of the live repo, not a rewrite. Mapping lives in [MIGRATION_MATRIX.md](../specs/cloudflare-native/MIGRATION_MATRIX.md). Domain truth: [AKADEMATE_MASTER_ARCHITECTURE_SPEC.md](../specs/AKADEMATE_MASTER_ARCHITECTURE_SPEC.md) v1.2.

## 1. What exists

Monorepo `pnpm` workspaces: `apps/*`, `packages/*`, `infra/*`.

| App | Role today | Cloud SaaS target |
| --- | --- | --- |
| `apps/web` | Marketing site. Documented as Worker `akademate-web` OpenNext. **This branch has no `wrangler.jsonc`.** History has it (`7f0cd9fe` … `d4d54cc7`). | KEEP Worker path from the branch that actually deploys www |
| `apps/tenant-admin` | Payload 3 + Next: admin, public tenant site, Campus host, finance, scheduling, compliance, Meta ads | EVOLVE / ADAPT persistence |
| `apps/campus` | Legacy scaffold | DEPRECATE path; Campus lives under tenant-admin `/campus` |
| `apps/admin-client` | SaaS ops UI | EVOLVE → `ops.akademate.com` |
| `apps/ops` | Ops app stub | EVOLVE / SPLIT vs admin-client |
| `apps/payload` | Extra Payload app | Audit before KEEP |
| `apps/portal` | Portal stub | Audit |

Packages already split bounded contexts: `academic`, `auth`, `db` (Drizzle + RLS), `finance`, `jobs` (BullMQ), `tenant`, `lms`, `operations`, `mcp-server`, `realtime`, `catalog`, `leads`, `notifications`, `imports`, `reports`, `ui`, `types`, `api`.

Persistence: PostgreSQL 16, Drizzle, `tenant_id` on core tables, RLS tests in `packages/db`. Payload collections own a large share of writes (hooks on enrollments, course runs, leads).

Jobs: Redis + BullMQ (`packages/jobs`).

Auth: Payload session for staff; Campus P1 contract (`campus_session`, teacher ≠ Payload User) specified, not fully the only live path.

CI: `.github/workflows/ci.yml` + `db-plan.yml`. No Cloudflare preview pipeline on this branch. No GitHub Environments `development` / `staging` / `production` verified.

Deploy:

| Host | Origin |
| --- | --- |
| `akademate.com`, `www` | Cloudflare Worker `akademate-web` (account NAZCAMEDIA `522997f4f57193b06db3286d8d6f2778`) |
| `cepformacion.akademate.com`, `app.akademate.com` | Hetzner `akademate-tenant` |
| `admin.akademate.com` | Hetzner `akademate-ops` |

Git remote: `SOLARIA-AGENCY/akademate.com` — foundry org, not an Akademate-only GitHub organization.

## 2. What the target requires that is missing here

- `TenantDataContext` / `D1TenantDataStore` / `PostgresTenantDataStore` ports
- Control D1 + tenant shard mapping
- Isolated Cloudflare **product** account (today: NAZCAMEDIA)
- Dedicated GitHub org
- Independent Workspace / GCP (unknown)
- AKADEMATE-* 1Password vaults (unknown)
- Queues / Workflows / Stream / Access on product account
- Platform Ops behind Access (no SQL console)
- AutonomousOps entities and R0–R4 grants
- Dual-adapter contract tests

## 3. PostgreSQL-specific (migration blockers to inventory next)

Not yet enumerated table-by-table. Known classes from repo:

- RLS (`packages/db`, Payload hooks)
- UUID primary keys
- JSON / JSONB usage in collections
- Triggers in Payload/SQL migrations under `apps/tenant-admin/migrations/`
- Cross-tenant platform queries in ops/admin-client

Full schema inventory is the next **agent** action after B-000 is confirmed. No D1 create.

## 4. Payload

Editorial collections (blog, media, website) are candidates to KEEP. Transactional hooks (enrollment counts, price snapshots, lead jobs) must SPLIT into Application Services. Runtime of Payload on Workers is unverified; Containers remain CONDITIONAL.

## 5. Decisions already frozen (do not re-litigate in PHASE 0)

See prompt §3 and ADRs `0016`–`0020` plus map `docs/adr/cf-native-adr-map.md`.

## 6. Human decisions still required (not this step)

1. Workspace @akademate.com exists?  
2. NAZCAMEDIA Cloudflare account vs dedicated Akademate account (zone move is R3).  
3. GitHub org split vs keep SOLARIA-AGENCY with product perimeter.  
4. Launchpad application (eligibility REQUIRES_REVIEW).

## 7. Explicitly not done

No production writes. No D1. No DNS change. No Workspace create. No secrets requested.

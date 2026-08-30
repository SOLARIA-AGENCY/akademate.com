# Cloudflare-native ADR map

Prompt v2.0 Appendix E uses ADR-001…020. This repo already has `0001`–`0008` (product) and `0016`–`0020` (Cloud SaaS, 2026-08-29). **Do not renumber.** Map the prompt catalogue onto existing files; add `0021+` only for gaps.

| Prompt Appendix E | Repo ADR | Status |
| --- | --- | --- |
| ADR-001 Product Genesis | [0018-brik64-product-genesis.md](./0018-brik64-product-genesis.md) | Accepted |
| ADR-002 Independent Workspace/GCP/CF/GitHub | 0018 (perimeter) | Accepted; bootstrap B-020…B-070 still unverified |
| ADR-003 Cloudflare-native SaaS | [0016-cloud-saas-vs-onprem-adapters.md](./0016-cloud-saas-vs-onprem-adapters.md) | Accepted |
| ADR-004 Canonical domain + adapters | 0016 | Accepted |
| ADR-005 Control D1 + D1-per-tenant | [0017-d1-control-and-tenant-shards.md](./0017-d1-control-and-tenant-shards.md) | Accepted. V1 = shards until dynamic attach is GA |
| ADR-006 TenantDataContext | 0016 + 0017 | Accepted as rule; **not implemented in code** |
| ADR-007 R2 object storage | [0003-storage.md](./0003-storage.md) EVOLVE + Cloud spec | Partial. Cloud R2 vs On-Prem S3 |
| ADR-008 Durable Objects coordination-only | Cloud spec §; no numbered ADR yet | Gap → candidate **0021** when DO work starts |
| ADR-009 Queues + Workflows | Cloud spec | Gap → candidate **0022** when async plane is coded |
| ADR-010 No n8n core | Cloud spec + migration matrix | Accepted in spec; no separate ADR |
| ADR-011 AutonomousOps vs Paperclip | [0019-autonomous-ops-native.md](./0019-autonomous-ops-native.md) | Accepted |
| ADR-012 Agent tools, no direct DB | 0019 | Accepted |
| ADR-013 R0–R4 | 0019 | Accepted |
| ADR-014 GitHub Issues/PRs as SoR | [0005-ci-cd.md](./0005-ci-cd.md) EVOLVE | Partial |
| ADR-015 BYO Meet/Zoom/Teams | [0020-byo-video-and-stream.md](./0020-byo-video-and-stream.md) | Accepted |
| ADR-016 Stream for VOD | 0020 | Accepted |
| ADR-017 Tenant finance ≠ SaaS billing | Master Spec + 0018 | Accepted in domain spec |
| ADR-018 Continuous exit readiness | 0018 | Accepted |
| ADR-019 CF-native observability first | Cloud spec §26 | Gap → candidate **0023** if Sentry/Grafana is proposed |
| ADR-020 Incremental migration + dual-adapter tests | 0016 | Accepted as policy; tests **NEW** |

Existing product ADRs `0001` multitenancy, `0002` auth, `0007` Payload/Postgres remain valid for **On-Prem**. Cloud default is not Neon (0016 supersedes that slice of 0007).

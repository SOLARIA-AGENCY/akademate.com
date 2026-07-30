# Akademate Program Status

Last updated: 2026-07-30

## Baselines

| Area | Current evidence | Verdict |
| --- | --- | --- |
| CEP production | SHA `0ca1b43`, container healthy | MVP live |
| Tenant/multi-entity shadow | 631/632 tests | one local regression |
| Finance shadow | 459/459 tests | local green, no integration |
| Release A | source/runbook inspected | fresh execution blocked by dependency policy |
| Shadow staging | zero registered execution bindings | not executed |
| Akademate public web | SHA `5815eb35` live separately | corporate surface deployed |

## Progress

- [x] Goal optimized and created.
- [x] CEP production and shadow boundaries reconstructed.
- [x] Governance worktree created from CEP live SHA.
- [x] Codex Loop contract added.
- [x] Master plan and checklists created.
- [x] Screen inventory generated and verified: 231 tracked screens.
- [x] Governance checks green.
- [x] Documentation committed: `f947d2f3`.
- [x] Documentation pushed: `origin/codex/akademate-program-governance`.
- [x] Shadow custody manifests generated and verified: 598 entries across four sources.
- [x] Divergent `b455374e` rejected as a direct CEP candidate.
- [x] Candidate 1A reconstructed from live, tested, committed and pushed: `721eb57d`.
- [x] Candidate 1A handed off to CEP task `019f8964-2942-7642-89e7-f09495627e65`.
- [x] Akademate Next worktree created: `codex/akademate-next`.
- [x] Next runtime isolation committed and pushed: `65e9beef`.
- [x] Academic membership access committed and pushed: `b03226ff`.
- [x] Conversation participant access committed and pushed: `7f6d7801`.
- [x] Durable in-memory learning repository contract committed and pushed: `2de0813f`.
- [x] Fail-closed Next collection runtime boundary committed and pushed: `4970449b`.
- [x] Database owner/migrator and non-bypass app roles separated in Compose: `d208a6c1`.
- [ ] Learning/chat persistence and role-specific shells implemented.

## Active blocker

The academic persistence target is the isolated `tenant-admin` Payload database
with integer IDs. The UUID Drizzle lineage in `packages/db` is not the runtime
authority for Next learning. Before creating the seven canonical learning tables,
Next must add explicit user-account links for student/staff profiles and execute
the migration through the owner job while the app remains a non-bypass role.

CEP release work continues only in task
`019f8964-2942-7642-89e7-f09495627e65`, never from this Next lane.

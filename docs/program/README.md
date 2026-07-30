# Akademate Product Program

Last updated: 2026-07-30

This directory is the execution authority for evolving Akademate without
placing the live CEP Formación tenant at risk.

- [x] Governance index created from the exact CEP production baseline.

## Immutable baseline

- CEP production host: `cepformacion.akademate.com`.
- Live application revision: `0ca1b43ea229fc531dab79388925fc73e8077eab`.
- Live container: `akademate-tenant-final`.
- CEP remains an isolated Enterprise MVP until a separately rehearsed migration.
- Local shadow files, tests and evidence are not production capability.
- No Next migration, database command or deployment may target CEP implicitly.

## Program lanes

1. **CEP Production Safety** — maintenance and compatible releases only.
2. **Shadow Custody** — preserve, classify and test undeployed work.
3. **Akademate Next** — isolated platform, database, storage and pipelines.
4. **Design System & SaaS UX** — screen-by-screen audit and Shadcn consolidation.
5. **CEP Migration Factory** — future export, rehearsal, reconciliation and rollback.

## Authorities

- [Master execution plan](./AKADEMATE_MASTER_EXECUTION_PLAN.md)
- [CEP shadow release checklist](./CEP_SHADOW_RELEASE_CHECKLIST.md)
- [Akademate Next checklist](./AKADEMATE_NEXT_BUILD_CHECKLIST.md)
- [Design system audit program](./DESIGN_SYSTEM_SCREEN_AUDIT.md)
- [Screen inventory](./SCREEN_INVENTORY.md)
- [Decision log](./DECISION_LOG.md)
- [Current status](./STATUS.md)

## Status legend

- `[x]` completed with evidence linked or recorded.
- `[ ]` pending.
- `[!]` blocked; the blocking condition must be written next to the item.
- `[~]` implemented locally but not integrated or deployed.

Checklist completion never implies production deployment. Local code, commit,
push, candidate deployment, traffic switch and live verification are tracked as
separate events.

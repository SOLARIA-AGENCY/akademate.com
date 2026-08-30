# Human bootstrap guide (execution prompt v2.0)

Canonical step IDs: **B-000 … B-110**. One human action at a time. Human replies `DONE` / `BLOCKED` / `CORRECTION`.

Never paste into chat: passwords, MFA recovery codes, TOTP seeds, API tokens, OAuth client secrets, private keys, Stripe secret keys, bank data, service-account JSON.

The agent may record: account IDs, project IDs, resource names, vault **names**, verification status, 1Password item **references**.

Full contract: [MASTER_EXECUTION_PROMPT_v2.0.md](../specs/cloudflare-native/MASTER_EXECUTION_PROMPT_v2.0.md) §5 and §0.2.

State file: [bootstrap-state.yaml](./bootstrap-state.yaml). Ledger: [../specs/cloudflare-native/EVIDENCE_LEDGER.md](../specs/cloudflare-native/EVIDENCE_LEDGER.md).

Spanish copy of the same sequence also lives in [../specs/cloudflare-native/HUMAN_BOOTSTRAP.md](../specs/cloudflare-native/HUMAN_BOOTSTRAP.md).

---

## Active step

Use the block in the agent’s latest message. After `DONE`, the agent verifies, writes evidence, and advances **one** ID.

| ID | Objective | Status |
| --- | --- | --- |
| B-000 | Inventory existing assets; create nothing | IN_PROGRESS |
| B-010 | Domain/registrar custody | NOT_STARTED |
| B-020 | Independent Google Workspace | NOT_STARTED |
| B-030 | AKADEMATE 1Password vaults | NOT_STARTED |
| B-040 | Dedicated Cloudflare product account | NOT_STARTED |
| B-050 | Startups / Launchpad application | NOT_STARTED |
| B-060 | Akademate GitHub organization | NOT_STARTED |
| B-070 | Akademate GCP (OAuth/APIs only) | NOT_STARTED |
| B-080 | Google / Zoom / Microsoft / payments apps | NOT_STARTED |
| B-090 | Stripe/P&L product segmentation | NOT_STARTED |
| B-100 | DEV / STAGING / PROD bindings | NOT_STARTED |
| B-110 | Recovery + asset register complete | NOT_STARTED |

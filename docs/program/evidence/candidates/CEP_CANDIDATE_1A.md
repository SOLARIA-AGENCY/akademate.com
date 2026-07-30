# CEP Candidate 1A — Instructor Availability

Last updated: 2026-07-30

## Identity

- Live base: `0ca1b43ea229fc531dab79388925fc73e8077eab`.
- Candidate commit: `721eb57d`.
- Branch: `codex/cep-candidate-1a-planning`.
- Worktree: isolated from all user-owned dirty worktrees.
- Production state: not deployed.

## Included behavior

- Keep all active teachers visible in planning selectors.
- Explain area qualification and time-overlap blockers.
- Return the conflicting run code, days and time range from the read-only
  planning evaluator.
- Preserve the legacy `unavailableInstructorIds` response for compatibility.
- Deduplicate repeated provider conflicts before rendering.

## Explicit exclusions

- No database migration or collection registration change.
- No `payload.config.ts`, `staff/route.ts`, public/legal or infrastructure change.
- No account, role, permission, finance, tenant or customer-data change.
- No smoke user and no authentication/session change.

## Fresh checks

| Check | Result | Evidence level |
| --- | --- | --- |
| Candidate scope verifier | 8/8 allowlisted paths | Level 3 guardrail |
| Focused Vitest | 35/35 pass | Level 3 |
| ESLint affected files | 0 errors, 0 warnings | Level 2 |
| `git diff --check` | pass | Level 1 |
| Tenant-admin typecheck | fail | Baseline failures outside changed files |
| Unrelated programming-list test | fail | Baseline React-object rendering failure in an unchanged screen |
| Image build | blocked locally | 9.2 GiB free; no user cache deletion authorized |
| Visual desktop/mobile | pending | — |
| Candidate staging | pending | — |
| Authenticated smoke | pending | — |
| CEP production | not changed | — |

## Adversarial attempts

1. A teacher with no required course area remains selectable when conflict-free.
2. Numeric/string instructor IDs match, including incomplete time ranges.
3. Duplicate provider conflicts do not duplicate UI reasons; this test initially
   failed and caused a deduplication patch before commit.

## Release decision

Candidate source is accepted for release engineering. Deployment remains denied
until image build, backup restore, isolated candidate runtime, authenticated
smoke, visual/network QA and rollback proof are recorded.

The repository's generic Compose/deploy scripts are not authority for the live
CEP runtime: their container names, database target and migration behavior do
not match the observed `akademate-tenant-final` deployment. They must not be run
against production as a shortcut.

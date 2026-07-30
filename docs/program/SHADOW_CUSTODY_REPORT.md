# Shadow Custody Report

Last updated: 2026-07-30

## Verdict

The undeployed work is now content-addressed without copying its contents into
the governance lane. This is local custody evidence only. It is not proof that
the code has run in staging or production.

| Source | HEAD | Dirty entries | Redacted | Decision |
| --- | --- | ---: | ---: | --- |
| Product shadow | `89de407a` | 420 | 104 | split by domain and port causally |
| CEP-local public legal work | `0ca1b43` | 12 | 0 | preserve as user-owned; do not mix with CEP candidate |
| Release A | `569f44e` | 166 | 2 | reconstruct security changes independently |
| Clean release commits | `b455374e` | 0 | 0 | reject as a direct release candidate |

Machine-readable evidence: [shadow custody index](./evidence/shadow-custody/INDEX.md).

## Why `b455374e` is rejected as a direct candidate

The branch diverges from the CEP live line at `703ee84`. Its aggregate diff
against live changes 108 files and includes collection registration, a database
migration, public/legal removals and deleted CEP assets. A healthy worktree does
not make a divergent branch release-compatible.

The three unique commits must be treated separately:

1. `662a2a8e` planning availability: port only the UX/domain behavior after
   reconciling conflicts in `staff/route.ts` and `payload.config.ts`.
2. `15d0de4b` least-privilege smoke user: keep out until account lifecycle,
   secret injection, rotation and revocation are specified.
3. `b455374e` in-container authenticated smoke: keep out until the CEP deploy
   orchestrator actually binds `SMOKE_AUTH_CONTAINER` and the test runs against
   an isolated candidate.

## Candidate extraction order

- [ ] **Candidate 1A — planning availability only.** Rebuild from live
  `0ca1b43`; no schema toggle, migration, legal/public deletion or smoke account.
- [ ] **Candidate 1B — staff error sanitization.** Separate security patch with
  route-level adversarial tests.
- [ ] **Candidate 2 — authenticated release smoke.** Implement only after a
  non-production account lifecycle and candidate container contract exist.
- [ ] **Candidate 3 — Release A session/security.** Split into signed-session,
  invalidation, impersonation, rate-limit, health and release-engineering patches.
- [ ] **Next-only product ports.** Multi-entity and finance domain packages move
  to isolated Akademate Next before any possible CEP activation.

## Capture guarantees and limits

- The capture reads Git status before and after hashing and fails if HEAD or the
  porcelain state changes.
- Regular files are opened with `O_NOFOLLOW` and checked before/after reading.
- Sensitive paths are redacted and omit content, index and HEAD hashes.
- Output files are atomically replaced and an output-directory symlink is rejected.
- Non-UTF-8 Git paths fail closed.
- SHA-256 values establish identity of the observed local state; they are not a
  signature, provenance attestation or deployment proof.

# CEP Shadow Release Checklist
Last updated: 2026-07-30

## Scope

This checklist governs any attempt to integrate undeployed shadow work into the
live CEP Enterprise MVP. It does not authorize a release by itself.

## Forbidden operations

- [x] No direct development in the live deployment directory.
- [x] No merging dirty worktrees.
- [x] No production migration from a generic Drizzle deploy command.
- [x] No permission, role, membership or finance activation as part of shadow rollout.
- [x] No Meta pause/reactivation from shadow code.
- [x] No shared financial overview across legal entities.
- [x] No unreviewed secrets or provider connections.
- [x] No deploy based only on a passing health endpoint.

## Shadow custody

- [ ] Manifest `codex/campus-internal` modified and untracked files.
- [ ] Manifest `codex/akademate-remediation-release-a` files.
- [ ] Manifest committed-but-undeployed planning/release branch.
- [ ] Record current tests: tenant 631/632; finance 459/459.
- [ ] Fix tenant empty-manifest expectation causally.
- [ ] Run Release A focal tests after approved dependency setup.
- [ ] Classify every file as general, CEP-specific, generated, evidence or obsolete.
- [ ] Reject generated outputs as source authority.

## Candidate sequencing

### Candidate 1 — Harness and no-behavior fixes

- [ ] Workspace Vitest isolation.
- [ ] Stale test expectation fixes backed by implementation contract.
- [ ] Programación normalization regressions.
- [ ] No database or public behavior change.

### Candidate 2 — Release A security

- [ ] Signed session v2.
- [ ] Legacy session exchange.
- [ ] Dev-login and auto-login fail-closed.
- [ ] Handler-local principal resolution.
- [ ] Session invalidation.
- [ ] Impersonation flag, reason, short TTL and audit fail-closed.
- [ ] Shared rate limiting.
- [ ] Health live/ready/technical endpoints.

### Candidate 3 — Release engineering

- [ ] Least-privilege smoke principal.
- [ ] Candidate image pinned by digest.
- [ ] Migration preflight.
- [ ] Verified backup manifest.
- [ ] Candidate container without traffic.
- [ ] Bounded switch budget.
- [ ] Automatic cleanup and exact rollback command.

### Candidate 4 — Read-only shadow observation

- [ ] Restored staging copy exists.
- [ ] Payload is approved as CEP operational authority.
- [ ] Legal entity bindings are independently reviewed.
- [ ] Baseline access digest captured from deployed staging.
- [ ] Runtime scope runner executes with authenticated Payload request.
- [ ] Finance readers use injected read-only provider clients.
- [ ] Output contains metrics only and no identifiers/PII.
- [ ] `canApply`, `canWrite`, `canPauseAds` and `changePermissions` remain false.
- [ ] Production environment rejects every shadow flag combination.

## Pre-deploy gate

- [ ] Clean candidate worktree.
- [ ] Atomic commits reviewed.
- [ ] Branch pushed.
- [ ] Image built from exact commit SHA.
- [ ] Image architecture and digest recorded.
- [ ] Database compatibility classified.
- [ ] Backup restore tested, not merely created.
- [ ] Existing tenant image/digest recorded.
- [ ] Current public, admin and campus smoke baseline recorded.
- [ ] Current CEP containers and health recorded.

## Adversarial tests

- [ ] Forged/malformed session cannot access admin.
- [ ] Tenant mismatch fails closed.
- [ ] Missing signing secret prevents startup.
- [ ] Duplicate Stripe/Meta webhook is idempotent.
- [ ] Cross-entity finance reader returns no partial data.
- [ ] Shadow flags in production cannot load data.
- [ ] Candidate DB unavailable leaves active CEP untouched.
- [ ] Candidate health false-positive is caught by authenticated smoke.
- [ ] Rollback works with v2-only user sessions, with re-auth documented.

## Traffic switch

- [ ] Candidate healthy.
- [ ] Anonymous public smoke passes.
- [ ] Authenticated admin smoke passes.
- [ ] Campus login and enrolled-course smoke passes.
- [ ] Lead creation smoke uses a designated test identity and is cleaned safely.
- [ ] Console/network checks pass desktop and mobile.
- [ ] No new error-rate or latency regression.
- [ ] Explicit go decision recorded.
- [ ] Traffic switched only for `akademate-tenant-final` service.

## Post-deploy

- [ ] Live `/api/health` returns candidate SHA.
- [ ] Container image digest equals candidate digest.
- [ ] Core public routes render.
- [ ] Dashboard authenticates.
- [ ] Campus authenticates.
- [ ] No role/membership count change.
- [ ] No migration outside approved scope.
- [ ] Error logs and queue lag remain within baseline.
- [ ] Previous image and secrets remain available through observation window.

## Rollback triggers

- Authentication regression.
- Tenant or entity scope divergence.
- Data mutation outside approved scope.
- Public, dashboard or campus core-flow failure.
- Increased 5xx/error rate.
- Queue or database saturation.
- Served SHA or digest mismatch.

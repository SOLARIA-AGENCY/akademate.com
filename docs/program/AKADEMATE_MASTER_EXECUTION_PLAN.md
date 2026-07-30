# Akademate Master Execution Plan
Last updated: 2026-07-30

## Objective

Preserve CEP Formación as the live Enterprise MVP while building an isolated,
general Akademate operating system for in-person, virtual and hybrid academies.
No change from this Akademate Next lane may be built, staged, routed or deployed to CEP.
Akademate Next must inherit proven product behavior without inheriting CEP
identity, data, contracts or deployment responsibility.

AI is an optional add-on. It is not the product category, primary sales message
or a dependency of admissions, planning, teaching, billing or reporting.

## Non-negotiable invariants

- [x] CEP and Akademate Next are separate release lanes.
- [x] CEP live SHA is recorded.
- [x] CEP deployment is delegated to task `019f8964-2942-7642-89e7-f09495627e65`.
- [x] This lane performs no CEP image, restart, traffic, data or deployment action.
- [ ] Next has a different database, Redis namespace, storage namespace and secrets.
- [ ] Next images and Compose project names cannot resolve to CEP services.
- [ ] CI contains a guard that rejects CEP domains and production identifiers in Next deploy inputs.
- [ ] No production role, membership, permission or finance configuration changes during shadow observation.
- [ ] Every release records source SHA, image digest, previous digest and rollback command.
- [ ] Every significant change receives three adversarial break attempts.

## Solution Registry

| Approach | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Port the live MVP and selected shadow into isolated Next | 9 | 9 | 9 | 7 | 9 | Selected |
| Merge all dirty worktrees into CEP and evolve in place | 3 | 3 | 5 | 5 | 2 | Rejected |
| Rewrite the platform from an empty repository | 6 | 9 | 9 | 3 | 3 | Rejected |

The selected approach preserves proven vertical flows and forces undeployed
work through isolated, causal ports.

## Target architecture

| Surface | Target responsibility |
| --- | --- |
| `apps/web` | Akademate corporate website only |
| tenant public surface | Tenant website, catalogue, SEO, forms and enrolment |
| `apps/tenant-admin` | Academy staff operating system and current Payload authority |
| `apps/campus` | Canonical student and teacher campus after parity migration |
| `apps/admin-client` | SaaS tenant, plan, usage and support control plane |
| `apps/ops` | Health, jobs, backups, incidents and infrastructure operations |
| `packages/ui` | Canonical Shadcn primitives, tokens and product patterns |
| domain packages | Reusable business rules independent of CEP identity |

## Release trains

### Train A — CEP preservation boundary

- Record served SHA/image evidence read-only.
- Preserve candidate evidence and hand it off to the dedicated CEP task.
- Use CEP only as product-reference evidence.
- Defer any future migration to a separately authorized program.

### Train B — Akademate Next

- Generic tenant configuration.
- Multi-entity runtime boundaries.
- Academic finance.
- Integrations.
- Consolidated campus.
- SaaS onboarding and Enterprise packaging.
- Central Shadcn design system.

### Train C — CEP migration

- Read-only exporters.
- Legacy ID mapping.
- Rehearsals.
- Delta sync.
- Cutover and rollback.

## Phase checklist

### Phase 0 — Governance and custody

- [x] Create persistent optimized goal.
- [x] Create isolated governance worktree from CEP live SHA.
- [x] Record live and shadow evidence boundaries.
- [ ] Generate content-addressed manifests for every shadow lane.
- [ ] Record ownership and intent for each modified/untracked file.
- [ ] Split security/release, general product and CEP policy changes.
- [ ] Fix the 631/632 tenant shadow regression without weakening coverage.
- [ ] Execute Release A focal checks in an approved dependency environment.
- [ ] Establish baseline test and build commands per workspace.

### Phase 1 — CEP freeze boundary

- [x] Record the live revision and image identity read-only.
- [x] Preserve Candidate 1A and hand it off to the dedicated CEP task.
- [x] Prohibit this Akademate Next lane from building, staging, restarting or routing CEP.
- [x] Prohibit database, role, permission, finance and customer-data changes.
- [ ] Re-check live identity read-only only when required for future migration design.

### Phase 2 — Akademate Next isolation

- [ ] Create a new worktree and branch from the accepted MVP baseline.
- [ ] Assign distinct image names and Compose project.
- [ ] Provision empty non-CEP database and storage.
- [ ] Add deployment deny-list for CEP hosts and identifiers.
- [ ] Create a generic demo tenant with synthetic data only.
- [ ] Extract tenant identity, legal identity, branding, domains and content defaults.
- [ ] Remove CEP defaults from general runtime code.
- [ ] Preserve CEP importers under a legacy migration namespace.

### Phase 3 — General domain core

- [ ] Port verified principal and tenant binding.
- [ ] Port legal entity/campus topology without CEP names.
- [ ] Port fail-closed ownership and runtime scope evaluators.
- [ ] Port course, run, session, classroom and teacher assignment models.
- [ ] Port lead, enrolment and attendance workflows.
- [ ] Port public projection contracts.
- [ ] Decide and document Payload/Drizzle authority boundaries.
- [ ] Validate with Postgres integration tests and negative tenant tests.

### Phase 4 — Complete academy operations

- [ ] CRM and admissions.
- [ ] Enrolment and capacity policies.
- [ ] Scheduling, conflicts, substitutions and resources.
- [ ] Attendance and justified absence workflows.
- [ ] Academic finance, invoices, instalments, refunds and dunning.
- [ ] Administrative backoffice for authorized operational staff.
- [ ] Teacher workspace for course preparation, lessons, assignments, attendance and grading.
- [ ] Student campus for learning, submissions, feedback, grades and certificates.
- [ ] Course-scoped teacher/student messaging with moderation and retention.
- [ ] Tenant website, checkout and consent-aware analytics.
- [ ] Operational reporting.

### Phase 5 — Integrations

- [ ] Stripe and SEPA payment adapters.
- [ ] Resend/SMTP delivery with logs and retry.
- [ ] Google and Microsoft calendars.
- [ ] Zoom, Teams and Meet.
- [ ] WhatsApp and SMS.
- [ ] Accounting adapters: Holded/Sage first, Xero/QuickBooks later.
- [ ] Versioned API, OpenAPI, SDK and signed webhooks.
- [ ] LTI/Moodle; SCORM only after core LMS stability.

### Phase 6 — Design System & SaaS UX

- [ ] Complete the screen inventory.
- [ ] Score every screen with the `saas-dashboard` audit preset.
- [ ] Establish Shadcn token and component authority in `packages/ui`.
- [ ] Consolidate sidebars, headers, breadcrumbs and responsive navigation.
- [ ] Consolidate list, filter, table, card and empty-state patterns.
- [ ] Consolidate record sheets, detail views and editable forms.
- [ ] Modernize SaaS admin and Ops dashboards.
- [ ] Add keyboard, contrast, mobile and visual regression gates.
- [ ] Re-audit and record score deltas before accepting each screen family.

### Phase 7 — Enterprise and operations

- [ ] SSO/OIDC/SAML and optional SCIM.
- [ ] Private cloud/on-premise packaging.
- [ ] Backup, restore and disaster-recovery evidence.
- [ ] Queue, webhook and provider observability.
- [ ] Per-tenant usage, limits and feature flags.
- [ ] Upgrade, rollback and support runbooks.

### Phase 8 — CEP migration factory

- [ ] Define export contracts from the live Payload authority.
- [ ] Preserve legacy IDs and relationship maps.
- [ ] Reconcile counts, checksums and orphan relationships.
- [ ] Rehearse media migration.
- [ ] Rehearse LMS progress and certificate migration.
- [ ] Execute at least two full rehearsals on restored copies.
- [ ] Define delta, read-only window, cutover and rollback.
- [ ] Obtain explicit migration authorization before production execution.

## Milestones

| Milestone | Target after start | Exit condition |
| --- | ---: | --- |
| Akademate Next Isolation | 2–4 weeks | independent runtime and deny-list proven |
| Generic Next Parity | 10–14 weeks | synthetic academy completes core flows |
| SaaS Beta | 16–22 weeks | tenant onboarding + campus + payments |
| Complete Platform | 22–30 weeks | integrations + finance + Enterprise gates |
| CEP Migration Ready | +4–6 weeks | two reconciled rehearsals + approved cutover |

## Quality Gate

A checklist item may become complete only when its required evidence is fresh.
Green unit tests do not prove staging; staging does not prove production; a
healthy host does not prove the requested artifact is served.

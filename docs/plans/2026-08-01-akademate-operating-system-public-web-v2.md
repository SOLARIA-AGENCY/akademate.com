# Akademate Operating System and Public Web V2 Plan

Status: active
Scope: `akademate.com` public SaaS surface only
Exclusion: no CEP runtime, repository, tenant data or deployment changes

## Goal amendment

Extend the Akademate programme goal with two connected outcomes:

1. Complete the product roadmap toward a full Academy Operating System that covers public web distribution, commerce, CRM, academic operations, virtual learning, communications, finance, accounting, HR, library and inventory, analytics, integrations, governance and optional AI assistance.
2. Rebuild the public Akademate website so buyers can understand and preview that operating model through premium product-led pages rather than generic SaaS feature cards.

The currently paused thread goal cannot be replaced through the goal API while unfinished. This file is the durable goal amendment and implementation authority for the public-web lane.

## Solution Registry

| Approach                       | Central idea                                                                                                                       | Correctness | Maintainability | Scalability | Simplicity | Pragmatism |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: |
| A. Feature catalogue expansion | Add every capability to the existing sections and retain the current visual composition.                                           |           7 |               7 |           7 |          8 |          7 |
| B. Product-journey system      | Centralize a product capability model, rebuild Home around real product previews and let Features provide the complete module map. |           9 |               9 |           9 |          7 |          9 |
| C. Vertical microsites first   | Build separate pages for each academy type and defer the shared product narrative.                                                 |           7 |               6 |           8 |          5 |          6 |

Selected: **B. Product-journey system**.

Why: the current problem is not missing page volume. It is the gap between Akademate's operational breadth and what the site makes visible. A central capability model avoids duplicated claims, supports future routes and gives Home a concrete product story.

## Visual system

- Visual thesis: operational clarity with editorial scale and real product depth.
- Typeface: Inter only on the public surface.
- Palette: ink navy, cool white, mist blue and one electric-blue accent.
- Shape rule: 16px content surfaces, 12px fields, pill actions and tags.
- Texture: low-contrast grid/noise field built into shared background tokens.
- Motion: hero carousel, one scroll-depth treatment and purposeful hover/reveal states.
- Remove: monospace labels, repeated uppercase eyebrows, mixed radii, anonymous hero photography and generic card grids.

## Public information architecture

### Home

- [x] Product-led hero with three coherent operating moments.
- [x] Reorder the story around product, people and operational problems before web distribution.
- [x] Add connected workspaces for academy teams, teachers and learners with dedicated imagery.
- [x] Add a gamified academy setup journey from blueprint to branded multi-campus launch.
- [x] Complete website, custom domain and embed distribution section.
- [x] Shareable workshop/course page preview.
- [x] Social login, attendee avatars, reviews, capacity and payment preview.
- [x] Campaign-to-enrolment journey.
- [x] Workspaces for growth, operations, teaching, finance and leadership.
- [x] Virtual campus and teacher/student experience.
- [x] Pricing and conversion.

### Features

- [x] Replace repetitive feature list with grouped platform architecture.
- [x] Add an interactive catalogue for all 21 modules with users, capabilities, metrics and workflow previews.
- [x] Centralize provider and payment-method logos with explicit availability states and local assets.
- [x] Add Web and commerce, Finance and accounting, HR and workforce, Library and assets.
- [x] Add complete LMS, gradebook, chat, certificates and communications detail.
- [x] Keep AI-assisted workflows optional and subordinate to operations.
- [x] Show integration architecture and deployment models.

### Pricing

- [x] Explain Launch, Business and Enterprise by operational scope.
- [x] Add optional modules and implementation/integration context.
- [x] Keep prices undisclosed until commercial validation.

### Solutions

- [x] Reuse the capability model for each academy type.
- [x] Explain website, reservation, payment and learning journey per vertical.
- [x] Replace the shared generic demo with four tailored product moments for each of eight verticals.
- [x] Use vertical-specific classes, spaces, people, schedules, forms and payment examples.

## Product roadmap

### Foundation and public distribution

- [ ] Tenant website provisioned on `customer.akademate.com`.
- [ ] Custom domain connection with DNS verification and certificates.
- [ ] CMS, navigation, blog, SEO, forms and media.
- [ ] Embeddable catalogue, class, registration, payment and form modules.
- [ ] Shareable single-offer pages with social metadata and campaign attribution.
- [ ] Registrations, applications, waitlists, invitations and attendance lists.

### Growth, admissions and commerce

- [ ] Lead CRM, scoring, assignment, pipeline and source attribution.
- [ ] Meta Ads, CAPI, email journeys and configurable marketing connectors.
- [ ] Checkout, deposits, instalments, subscriptions, memberships and packs.
- [ ] Stripe, PayPal, SEPA and configurable payment-provider adapters.
- [ ] Discounts, vouchers, cancellations, refunds and dunning.

### Academic and learning operations

- [ ] Courses, cohorts, sessions, timetables, rooms, equipment and capacity.
- [ ] Student, guardian, teacher, coach and administrative workspaces.
- [ ] Campus content, live learning, assignments, quizzes and submissions.
- [ ] Gradebook, rubrics, feedback, progress and transcripts.
- [ ] Certificates with generation, verification, expiry and revocation.
- [ ] Internal chat, announcements, notifications and moderated communities.
- [ ] QR attendance, NFC/RFID identities and validated physical access adapters.
- [ ] Access events synchronized with sessions, sites and learner records.

### Connected campus and digital signage

- [ ] Screen and player registry scoped by tenant, site and display zone.
- [ ] Class calendars, room schedules, announcements and course promotions.
- [ ] Playlists, publishing windows, role-based approvals and emergency overrides.
- [ ] Device heartbeat, playback status and 24/7 display-fleet monitoring.
- [ ] Provider-specific player, reader and sensor adapters validated during onboarding.

### Finance and accounting

- [ ] Academy receivables and participant account statements.
- [ ] Supplier payables and expense capture.
- [ ] General ledger, chart of accounts and journals.
- [ ] Cost centres by entity, campus, programme and cohort.
- [ ] Bank feeds, reconciliation and payment matching.
- [ ] Tax, invoice sequencing, credit notes and accounting exports.
- [ ] Read/write accounting and ERP connectors with scoped authorization.
- [ ] Revenue, cash-flow, profitability and financial-control dashboards.

### HR and workforce

- [ ] Staff records, contracts, qualifications and compliance documents.
- [ ] Availability, scheduling, workload and substitution.
- [ ] Time and attendance, leave and absence.
- [ ] Payroll inputs, rates, commissions and teacher payments.
- [ ] Performance, professional development and certification reminders.

### Library, inventory and facilities

- [ ] Library catalogue, copies, loans, returns, holds and fines.
- [ ] Digital resources and licence entitlements.
- [ ] Equipment, uniforms, instruments and learning-material inventory.
- [ ] Rooms, venues, facilities, maintenance and booking rules.
- [ ] Procurement, suppliers, stock movements and asset responsibility.

### Insight, ecosystem and assistance

- [ ] Operational, academic, marketing and finance dashboards.
- [ ] APIs, webhooks, imports, exports and integration catalogue.
- [ ] Mobile-responsive PWA followed by iPhone and iPad applications.
- [ ] Optional AI-assisted summaries, drafts, classifications and next actions.
- [ ] Permission-aware MCP tools and human review for consequential actions.
- [ ] Privacy, retention, audit, governance and evidence controls.

## Delivery checklist

- [x] Product analysis and competitor capability inventory.
- [x] Optimized implementation prompt.
- [x] Goal amendment and roadmap documented.
- [x] Shared marketing capability model expanded.
- [x] Design-system modernization implemented.
- [x] Product previews implemented.
- [x] Home and Features restructured.
- [x] Targeted unit and adversarial tests.
- [x] Typecheck and build.
- [x] Desktop/mobile visual QA.
- [x] Mobile internal-clipping audit and long-label variation.
- [ ] Commit.
- [ ] Push.
- [ ] Public deploy.
- [ ] Served-artifact verification.

## Agentic growth extension

The two additional product cases are governed by the detailed addendum in
[`docs/plans/2026-08-01-agentic-growth-expansion.md`](./2026-08-01-agentic-growth-expansion.md)
and the executable prompt in
[`docs/prompts/2026-08-01-agentic-growth-expansion-prompt.md`](../prompts/2026-08-01-agentic-growth-expansion-prompt.md).

- [ ] MCP gateway separated from all CEP defaults and resolved by SaaS tenant.
- [ ] Read-only, draft and mutable tools have explicit scopes and approval gates.
- [ ] MCP connections, tool calls, approvals and audit events have tenant-scoped contracts.
- [ ] Meta Ads snapshots use tenant-owned credentials, idempotency and freshness metadata.
- [ ] Google Ads is a separate adapter, not an alias or logo-only integration.
- [ ] Campaign metrics reconcile to leads, applications, enrolments and attendance with unresolved states preserved.
- [ ] Growth dashboard distinguishes provider metrics from Akademate-confirmed outcomes.
- [ ] Automations preview and request approval; no budget or publication mutation in the first phase.
- [ ] Home and Features show both workflows with illustrative labels and no unsupported provider claims.
- [ ] Adversarial tests cover cross-tenant access, revocation, approval, replay, attribution and zero denominators.

## Native app public preview

The public preview is governed by
[`docs/plans/2026-08-01-native-apps-public-preview.md`](./2026-08-01-native-apps-public-preview.md)
and its implementation prompt in
[`docs/prompts/2026-08-01-native-apps-public-preview-prompt.md`](../prompts/2026-08-01-native-apps-public-preview-prompt.md).

- [x] Home and Features include a reusable Mac, iPhone and iPad preview.
- [x] `/download` has distinct device views and generated Akademate product imagery.
- [x] Every native option is labelled `Coming soon` and exposes no fake install or store link.
- [x] The device registry, navigation and footer links are centralized.
- [x] Desktop/mobile tests cover routes, tabs, copy budget, images and overflow.
- [ ] Signed native binaries, notarisation and App Store distribution remain future product work.

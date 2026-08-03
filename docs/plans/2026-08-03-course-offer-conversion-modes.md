# Course offer conversion modes

## Decision

Akademate configures public conversion per `course-run` (convocatoria/edition), not per reusable course. Publication, conversion and capacity are independent concerns.

## Supported modes

- `information_only`: public or shareable information with no form, enrollment or payment action.
- `interest_form`: the standard contact form creates a lead for academy follow-up; it does not reserve a
  place or initiate payment.
- `free_registration`: collects a registration request without checkout. Confirmation remains an
  explicit academy action and cannot silently become a paid flow.
- `approval_required`: a configurable application form creates a reviewable request before a place
  is confirmed.
- `paid_registration`: registration proceeds through full payment or a positive deposit. Provider
  evidence, never the browser redirect, authorizes enrollment confirmation.
- `external_link`: the CTA redirects to a validated HTTPS destination such as Luma, Eventbrite or
  an academy-owned form when the academy keeps the conversion flow outside Akademate.

All modes can use a Luma-style shareable page. The page format does not imply that registration or payment is enabled.

### Operator decision

The configuration UI asks one bounded question: **what should the visitor be able to do?** The
selected answer is exclusive. A manager cannot combine a passive information page with a hidden
form, attach payment settings to a free registration, or attach an external redirect to an internal
submission. Visibility and the shareable page remain independent from this decision. Selecting
contact or approval automatically connects the supported standard preset; the operator never needs
to enter its internal key. The current standard form collects name, surname, email, optional phone
and message, with privacy acceptance and marketing consent separated.

## Independent policies

- Visibility: `private`, `public` or `unlisted`.
- Capacity: `limited`, `waitlist` or `unlimited`.
- CTA label: optional academy-facing copy, bounded to 80 characters.
- Share slug: unique within a tenant and mandatory for public/unlisted offers.

## Invariants

- Information pages cannot submit hidden forms.
- Interest and approval modes require a known form template.
- External links must use HTTPS and cannot coexist with an internal action.
- Payment settings exist only for paid registration.
- Paid registration requires a positive frozen offer price.
- The frozen offer price is stored in the Next-only `offer_price_amount` field and does not depend on
  CEP's historical planning columns or the mutable course price.
- Deposits must be positive and lower than the full price; full payment cannot carry a deposit amount.
- PostgreSQL repeats the domain invariants so bypassing the API still fails closed.

## Delivery checklist

- [x] Domain schema and deterministic action resolver.
- [x] API input contract.
- [x] Next-only Payload fields and cross-field hook.
- [x] Append-only PostgreSQL migration.
- [x] Unit and structural adversarial tests.
- [x] Real PostgreSQL constraint and guarded-rollback QA using the exact migration SQL.
- [x] Physical `migrations-next` discovery integrated after the Signage migration.
- [x] Fresh PostgreSQL 16 run applying exactly twelve Next migrations.
- [x] Dedicated authenticated GET/PATCH configuration command, default-off outside Akademate Next.
- [x] Tenant-scoped PostgreSQL RLS and column-level grants for the runtime application role.
- [x] Operator configuration UI with conditional Shadcn fields and a stable preview.
- [x] Adversarial route, handler, UI and real-database access tests.
- [x] Public share-page renderer and tenant theming, default-off behind a Next-only flag.
- [x] Host-and-slug-scoped read-only projection with no direct public table grants.
- [x] Real external-link action and honest contact fallback for information and unimplemented paid flows.
- [x] Next-native public command for interest, application and enrolment requests.
- [x] Authenticated tenant-scoped inbox with bounded search, status and request-kind filters.
- [x] Dedicated Next session profile and dashboard middleware compatibility without changing CEP's
  historical session contract.
- [x] Desktop and mobile browser QA for the public request flow, including persistence, console,
  network, tracker and horizontal-overflow checks.
- [x] Reversible approve, reject, archive and reopen decisions with an append-only actor ledger.
- [x] Least-privilege review boundary: marketing can read; superadmin, admin and gestor can decide.
- [x] Real PostgreSQL transition, replay, cross-tenant, role and guarded-rollback verification.
- [x] Reviewer-only bounded timeline with actor identifiers, current names, notes and received state.
- [x] Reviewer-confirmed enrollment command with tenant ownership, submission idempotency, locked
  capacity reservation and waitlist fallback.
- [x] Explicit operator confirmation UI and canonical enrollment link in desktop/mobile inbox cards.
- [x] Audited cancellation and voluntary-withdrawal command with atomic capacity reconciliation.
- [x] Deterministic FIFO promotion from the waitlist and append-only lifecycle events.
- [x] Tenant-scoped enrollment detail route and persistent success state in desktop/mobile UI.
- [ ] Checkout creation command; payment remains pending and separate from academic capacity.
- [ ] Payment-provider adapters and webhook reconciliation.
- [ ] Form-template builder and consent-version custody.
- [ ] Retention and export controls for internal decision notes.
- [ ] Bot challenge and configurable retention/erasure jobs for public submission data.

## PostgreSQL evidence — 2026-08-03

- The exact Payload runtime applied twelve migrations from `apps/tenant-admin/migrations-next`.
- Valid information-only, paid and approval-required offers were persisted on separate course runs.
- Six database-bypass attempts were rejected with their exact constraint: public offer without slug,
  form without template, insecure external URL, payment without frozen price, invalid deposit and
  duplicate tenant-scoped slug.
- The same share slug was accepted for a second tenant, proving the uniqueness boundary is tenant
  scoped.
- Rollback refused configured offers, while an empty rollback removed every offer column cleanly.
- The Next-only price column is `offer_price_amount`; no CEP `price_snapshot` dependency is imported.
- The runtime verifier keeps logs bounded to the last 200 lines and generates ephemeral credentials
  for every run.
- A second append-only migration makes `courses.tenant_id` and `course_runs.tenant_id` mandatory,
  forces tenant RLS and grants the app role updates only on the bounded offer configuration columns.
- The real application role can read and update its own tenant through the production command, while
  cross-tenant reads, `tenant_id` updates, inserts and deletes are rejected.
- An eighth append-only migration exposes only the bounded public offer projection through a
  `SECURITY DEFINER` function, granted to the exact non-owner, non-superuser, non-`BYPASSRLS` app role.
- The projection resolves an exact custom domain or tenant subdomain plus share slug. Real PostgreSQL
  checks rejected a wrong host and a draft offer, and resolved the same slug independently for two
  tenants.
- A ninth append-only migration creates the tenant-scoped public submission ledger and the only
  permitted write command for interest, approval and enrolment requests. It stores consent version,
  separates optional marketing consent, supports safe idempotent replay and enforces a distributed
  five-per-hour contact/offer limit in PostgreSQL.
- The application role has no direct insert permission on the submission ledger. It can invoke only
  the bounded command and managers can read submissions only inside their active tenant context.
- The public API and `/o/[slug]` renderer are unavailable unless
  `AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED=true`. Public offers may be indexed; unlisted offers emit
  `noindex,nofollow` metadata.
- Interest, application and free-registration modes submit to the Next-native ledger and return a
  request state only; they never simulate a confirmed place. Information-only and paid modes use the
  academy's configured contact destination until a bounded Next checkout command exists. No mode
  posts to CEP's lead endpoint.
- Isolated production-build QA rendered the page at 1440x1000 and 390x844, submitted a real
  approval request with HTTP 201 and verified one persisted record, zero console errors, zero failed
  requests, zero tracker requests and no mobile horizontal overflow.
- The same production artifact authenticated a real Next manager session, returned the submission
  inbox with HTTP 200 and rendered the stored request in a desktop table and a mobile card. The
  command returned five tenant-B requests and zero rows for tenant A under the same filters in real
  PostgreSQL 16.
- A tenth append-only migration extends requests with approved, rejected and archived states and
  records every transition in a tenant-scoped actor ledger. Repeating the same decision does not
  duplicate the ledger; changing one terminal decision requires an explicit reopen.
- Real PostgreSQL rejected a cross-tenant review, a marketing-role decision and a direct terminal
  rewrite. Approve, reopen and reject produced exactly three ledger events, and rollback was refused
  until review data was removed and extended statuses were restored.
- Review history is fetched only on demand and returns at most 100 newest-first events. Real RLS
  verification hid all review notes from marketing, rejected cross-tenant history access and kept
  the immutable actor identifier separate from the actor's current display name.
- An eleventh append-only migration tenant-scopes canonical `enrollments`, links each conversion to
  exactly one public submission and exposes only a reviewer-only `SECURITY DEFINER` command. The app
  role can read its tenant's enrollment projection but cannot insert, update or delete enrollments.
- The conversion locks both submission and course run inside the serializable transaction. A limited
  full run produced no learner or enrollment partial write; a full waitlist run created one
  `waitlisted` enrollment without incrementing capacity; two concurrent requests for the final seat
  produced exactly one confirmed enrollment and a counter of one.
- Replaying the same conversion returns the original enrollment without creating a second learner,
  enrollment or seat. Cross-tenant and marketing-role conversion attempts are rejected in the
  command and in PostgreSQL.
- A twelfth append-only migration adds an immutable tenant-scoped enrollment lifecycle ledger and a
  reviewer-only cancellation command. A confirmed cancellation releases one place and promotes the
  oldest waitlisted enrollment by `enrolled_at` and stable identifier inside the same transaction.
- Cancellation replay does not duplicate events or adjust capacity twice. Real PostgreSQL rejected
  cross-tenant, marketing-role and inconsistent-capacity attempts without partial writes. Concurrent
  cancellations used explicit serialization retry and left exactly one promoted waiter and a
  reconciled course-run counter.
- Financial amounts and payment state are never changed by academic cancellation. A paid or partial
  record returns `financialFollowUpRequired`, preserving refunds and accounting for a separate
  provider-aware workflow.

## Operator workflow

The course-run list links to **Inscripción y publicación**. The detail screen keeps visibility,
conversion and capacity independent, reveals only fields belonging to the selected mode, validates
the same shared domain schema as the command and previews the resulting CTA. Published and unlisted
offers are rendered at `/o/[slug]` on the exact tenant host.

The authenticated route is `GET/PATCH /api/next/course-runs/:id/offer`. It is available only when
`AKADEMATE_RUNTIME=next` and `AKADEMATE_NEXT_OFFERS_ENABLED=true`; it does not reuse the legacy CEP
course-run endpoint or a generic Payload mutation.

The read-only public route is `GET /api/next/public/offers/:slug`. It additionally requires
`AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED=true`, validates the request host before querying and returns
the same not-found boundary for malformed, private, draft and cross-tenant requests.

The public submission route is `POST /api/next/public/offers/:slug/submissions`. It additionally
requires `AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED=true`, a valid HTTPS privacy-notice URL, a
versioned notice identifier and a server-only HMAC pepper. It accepts only bounded consented requests
for interest, approval-required and free-registration offers. Paid checkout remains fail-closed.

The manager inbox route is `GET /api/next/offer-submissions`. It accepts only canonical bounded
filters, derives tenant and role from the dedicated signed Next session, runs through the
non-superuser application role and returns a restricted PII projection. The dashboard destination
is `/dashboard/cursos/solicitudes`, with a responsive shared-Shadcn table/card presentation.

The decision route is `PATCH /api/next/offer-submissions/:id/decision`. It accepts only approved,
rejected, archived or pending-review targets, requires a bounded internal reason for rejection and
runs a single tenant-scoped PostgreSQL command that updates the request and appends its event
atomically. These decisions never create enrollment, capacity reservations or payment operations.

The internal history route is `GET /api/next/offer-submissions/:id/reviews`. It is reviewer-only,
accepts no tenant or filter parameters, validates the tenant-owned request before reading its ledger
and returns at most 100 newest-first events plus the original received timestamp. Marketing users
can read the inbox but cannot retrieve internal notes or actor history.

The enrollment conversion route is `POST /api/next/offer-submissions/:id/enrollment`. It accepts no
client body, tenant selector, price or payment state. Only an approved `approval_required` or
`free_registration` request can be converted. The resulting enrollment is `confirmed` with one
reserved place, or `waitlisted` without consuming capacity according to the course-run policy.
Payment is always left `pending`; checkout and financial reconciliation remain a separate command.

The enrollment detail route is `GET /api/next/enrollments/:id` and cancellation is
`POST /api/next/enrollments/:id/cancel`. Both require the dedicated Next session and the
`AKADEMATE_NEXT_ENROLLMENTS_ENABLED=true` flag. Cancellation accepts only an explicit lifecycle type
and bounded audit reason; tenant, capacity and financial fields are never accepted from the client.

The dashboard resolves `/api/next/session` first. CEP receives a runtime-scoped 404 and continues to
its historical `/api/auth/session` contract; Akademate Next never falls back after an authentication
or infrastructure failure. The dashboard rewrite carries an internal marker to prevent canonical
`/dashboard/*` and internal route aliases from redirecting in a loop.

## Runtime boundary

This change belongs only to Akademate Next. It does not modify or deploy CEP Formación, its data, its containers or its public website.

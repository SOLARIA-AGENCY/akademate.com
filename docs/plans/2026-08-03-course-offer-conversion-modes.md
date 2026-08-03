# Course offer conversion modes

## Decision

Akademate configures public conversion per `course-run` (convocatoria/edition), not per reusable course. Publication, conversion and capacity are independent concerns.

## Supported modes

- `information_only`: public or shareable information with no form, enrollment or payment action.
- `interest_form`: a configurable form creates a lead for academy follow-up.
- `free_registration`: direct registration without checkout.
- `approval_required`: a configurable application form creates a reviewable request before a place is confirmed.
- `paid_registration`: registration proceeds through full payment or a positive deposit.
- `external_link`: the CTA redirects to a validated HTTPS destination when an academy must keep an external flow.

All modes can use a Luma-style shareable page. The page format does not imply that registration or payment is enabled.

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
- [x] Fresh PostgreSQL 16 run applying exactly nine Next migrations.
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
- [ ] Confirmed enrollment and checkout creation commands.
- [ ] Payment-provider adapters and webhook reconciliation.
- [ ] Form-template builder and consent-version custody.
- [ ] Audited lifecycle commands for reviewing, rejecting and approving received submissions.
- [ ] Bot challenge and configurable retention/erasure jobs for public submission data.

## PostgreSQL evidence — 2026-08-03

- The exact Payload runtime applied seven migrations from `apps/tenant-admin/migrations-next`.
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

The dashboard resolves `/api/next/session` first. CEP receives a runtime-scoped 404 and continues to
its historical `/api/auth/session` contract; Akademate Next never falls back after an authentication
or infrastructure failure. The dashboard rewrite carries an internal marker to prevent canonical
`/dashboard/*` and internal route aliases from redirecting in a loop.

## Runtime boundary

This change belongs only to Akademate Next. It does not modify or deploy CEP Formación, its data, its containers or its public website.

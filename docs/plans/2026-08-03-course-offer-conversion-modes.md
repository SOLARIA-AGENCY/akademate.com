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
- [x] Fresh PostgreSQL 16 run applying exactly eight Next migrations.
- [x] Dedicated authenticated GET/PATCH configuration command, default-off outside Akademate Next.
- [x] Tenant-scoped PostgreSQL RLS and column-level grants for the runtime application role.
- [x] Operator configuration UI with conditional Shadcn fields and a stable preview.
- [x] Adversarial route, handler, UI and real-database access tests.
- [x] Public share-page renderer and tenant theming, default-off behind a Next-only flag.
- [x] Host-and-slug-scoped read-only projection with no direct public table grants.
- [x] Real external-link action and honest contact fallback while internal write commands remain closed.
- [ ] Command endpoints for lead, application, enrollment and checkout creation.
- [ ] Payment-provider adapters and webhook reconciliation.
- [ ] Form-template builder and consent-version custody.
- [ ] Public publishing action and browser QA after the share-page renderer exists.

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
- The public API and `/o/[slug]` renderer are unavailable unless
  `AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED=true`. Public offers may be indexed; unlisted offers emit
  `noindex,nofollow` metadata.
- Internal lead, application, enrollment and checkout modes intentionally do not post to CEP's lead
  endpoint. Until their Next-native commands exist, the page uses the academy's configured contact
  destination and never simulates registration or payment success.

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

## Runtime boundary

This change belongs only to Akademate Next. It does not modify or deploy CEP Formación, its data, its containers or its public website.

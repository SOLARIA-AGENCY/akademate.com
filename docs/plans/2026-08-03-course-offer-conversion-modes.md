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
- [x] Fresh PostgreSQL 16 run applying exactly six Next migrations.
- [ ] Public share-page renderer and tenant theming.
- [ ] Command endpoints for lead, application, enrollment and checkout creation.
- [ ] Payment-provider adapters and webhook reconciliation.
- [ ] Form-template builder and consent-version custody.
- [ ] Operator UI for previewing and publishing each mode.
- [ ] Browser QA after the operator UI and public share-page renderer exist.

## PostgreSQL evidence — 2026-08-03

- The exact Payload runtime applied six migrations from `apps/tenant-admin/migrations-next`.
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

## Runtime boundary

This change belongs only to Akademate Next. It does not modify or deploy CEP Formación, its data, its containers or its public website.

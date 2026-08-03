# Paid registration orders

## Decision

Akademate Next will treat learner payments as a provider-neutral order lifecycle. A public route may
start an order, but only a verified provider event may confirm payment and create the canonical
enrollment. Redirects and browser success pages are never payment evidence.

This boundary is independent from Akademate's own SaaS subscription billing and must not reuse the
legacy `/api/billing/checkout` or `/api/webhooks/stripe` routes.

## Solution Registry

| Approach | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Reuse legacy Stripe subscription billing | 3 | 3 | 3 | 8 | 3 | Rejected: client-selected tenant and redirects, wrong aggregate |
| Call providers directly from the public offer route | 4 | 4 | 5 | 7 | 4 | Rejected: no canonical replay, hold or reconciliation boundary |
| Canonical order, capacity hold, adapters and event ledger | 9 | 9 | 9 | 5 | 9 | Selected |

## Canonical model

`paid_offer_orders` owns:

- tenant and course-run ownership;
- frozen amount and currency derived from the published offer;
- payment plan (`full_amount` or `deposit`);
- provider (`stripe` or `paypal`) and payment method (`card`, `sepa_debit` or `paypal`);
- idempotency and request fingerprint;
- contact and consent snapshot;
- provider order/session identifiers;
- checkout expiry and capacity-hold state;
- payment and enrollment outcome.

`paid_offer_payment_events` is append-only and stores a bounded, normalized event record. Raw
provider payloads and secrets do not belong in this ledger.

## Provider semantics

### Stripe

- Use hosted Checkout Sessions for one-time payments.
- Derive amount, currency, description and metadata server-side.
- Use the Akademate order UUID as the Stripe idempotency key and metadata correlation key.
- Enable payment methods through Stripe Dashboard. `sepa_debit` remains a method, not a provider.
- `checkout.session.completed` can complete an immediate card payment only when Stripe reports it as
  paid. For delayed methods it moves the order to processing.
- `checkout.session.async_payment_succeeded` is payment evidence for delayed methods.
- `checkout.session.async_payment_failed` releases the capacity hold.

### PayPal

- Use Orders v2 with `CAPTURE` intent.
- Use the Akademate order UUID as `PayPal-Request-Id`.
- Browser approval is not capture evidence.
- A verified completed capture or corresponding webhook is required before enrollment.

### SEPA

- SEPA Debit is represented as `provider=stripe`, `payment_method=sepa_debit`.
- It is restricted to EUR.
- It remains `processing` after mandate authorization until the asynchronous success event arrives.
- Capacity is held only for the bounded checkout window; an expired hold cannot be silently restored
  by a late provider event. Late success requires an explicit financial exception workflow.

## State machine

```text
created -> provider_pending -> awaiting_payment -> processing -> succeeded
   |              |                  |                |
   +--------------+------------------+----------------+-> failed / cancelled / expired
```

Only `succeeded` can create an enrollment. Terminal transitions are idempotent. A contradictory
terminal event is recorded for review but cannot rewrite the canonical outcome.

## Capacity invariant

For limited and waitlist offers:

```text
current_enrollments + current_checkout_holds <= max_students
```

Creating a new order reserves one hold. Provider setup failure, payment failure, cancellation or
expiry releases it exactly once. Successful payment atomically consumes the hold and increments the
confirmed enrollment count. Unlimited offers do not use holds.

## Security boundary

- Public clients never submit tenant, course run, amount, currency, enrollment state or redirect
  destinations.
- Return URLs are derived from the validated public host and share slug.
- Provider secrets remain server-only.
- Provider signatures are verified before normalized events enter PostgreSQL.
- The application role has no direct insert/update/delete permission on orders or payment events.
- Every cross-tenant and replay path fails closed.

## Delivery checklist

- [x] Architecture and provider semantics documented.
- [x] Append-only migration and RLS.
- [x] Idempotent public order command and capacity hold.
- [x] Provider-session attach/failure commands.
- [x] Verified-event reconciliation and canonical enrollment creation.
- [x] Stripe Checkout adapter.
- [x] PayPal Orders v2 adapter, validated return and idempotent capture.
- [x] Stripe and PayPal webhook signature adapters.
- [x] Public paid-registration form and redirect flow.
- [x] Honest processing and cancellation return states; success remains webhook-driven.
- [x] PostgreSQL concurrency and rollback proof.
- [x] Provider contract tests using deterministic fakes.
- [x] Browser QA without real charges.
- [ ] Provider sandbox QA with dedicated credentials.

## Local verification evidence

- Production build generated all 59 static pages and the paid checkout, Stripe webhook, PayPal
  webhook and PayPal return routes.
- The focused offer gate passed 21 operations tests, 40 API validation tests, 49 structural
  migration/route tests, 92 command/domain/provider tests and 30 tenant-admin UI/middleware tests.
- PostgreSQL 16 runtime verification covered canonical server-derived pricing, idempotent replay,
  duplicate contacts, processing without enrollment, exactly-once successful enrollment, amount
  mismatch review, bounded PayPal returns, RLS denial and concurrent last-seat contention.
- Playwright verified the public paid form at 1440x1000 and 390x844, with no console errors,
  failed requests, trackers or horizontal overflow. The provider destination was deterministically
  intercepted; no provider account was contacted and no real charge was attempted.

## Evidence boundary

Local adapter tests do not prove a provider account is configured. Sandbox proof does not prove live
payments. Production readiness additionally requires provider account verification, webhook endpoint
registration, secret custody, refund policy, accounting reconciliation and an approved deployment.

## Runtime boundary

This plan belongs only to Akademate Next. It does not modify or deploy CEP Formación, its payment
configuration, its data or its production runtime.

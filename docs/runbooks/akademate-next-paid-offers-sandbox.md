# Akademate Next paid offers sandbox runbook

## Scope and evidence boundary

This runbook prepares and verifies learner-payment providers for **Akademate Next only**. It does not
configure Akademate SaaS subscription billing and must never be used against CEP Formación. A green
local preflight proves only that the environment contract is complete and sandbox-only; it does not
prove provider authentication, webhook delivery, payment settlement or production readiness.

## Runtime network boundary

PostgreSQL, Redis, the migration job and Campus remain attached only to
`akademate_next_internal`, which is a Docker internal network. `tenant-admin` additionally joins
`akademate_next_egress` so its server-side payment adapters can reach Stripe and PayPal. No provider
credential is passed to any other service.

The egress bridge is not a destination allowlist: any compromised process inside `tenant-admin`
could attempt outbound traffic. A dedicated payment broker or controlled egress proxy is the
recommended later hardening when operational scale justifies the additional service boundary.

## Secret custody

Inject the following values from the authorized deployment secret store. Do not place values in
Git, `.env.example`, CI logs, shell history, screenshots or support tickets.

Common configuration:

- `AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL`
- `AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION`
- `AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER`

Stripe sandbox:

- `AKADEMATE_NEXT_STRIPE_SECRET_KEY` using an `sk_test_` key
- `AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET` from the exact sandbox webhook endpoint

PayPal sandbox:

- `AKADEMATE_NEXT_PAYPAL_ENVIRONMENT=sandbox`
- `AKADEMATE_NEXT_PAYPAL_CLIENT_ID`
- `AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET`
- `AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID`

Keep all capability flags false while installing and validating secrets:

- `AKADEMATE_NEXT_OFFERS_ENABLED=false`
- `AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED=false`
- `AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED=false`
- `AKADEMATE_NEXT_PAID_OFFERS_ENABLED=false`

## Provider endpoints

Register the exact HTTPS deployment origin with these paths:

- Stripe webhook: `/api/next/public/payments/webhooks/stripe`
- PayPal webhook: `/api/next/public/payments/webhooks/paypal`
- PayPal return: `/api/next/public/payments/paypal/return`

Stripe must deliver Checkout completion, asynchronous payment success/failure and expiry events.
PayPal must deliver order approval and capture completion/denial events. Browser returns are never
payment evidence.

## Fail-closed preflight

Run the preflight inside the release environment after secret injection and with shell tracing
disabled:

```bash
set +x
node --experimental-strip-types scripts/verify-akademate-next-payment-sandbox.mjs
```

The command rejects partial provider configuration, live Stripe keys and PayPal live mode. Its only
successful output is redacted provider/method metadata and the privacy-notice hostname.

## Activation sequence

1. Deploy the exact reviewed SHA with every capability flag false.
2. Apply migrations using the owner role; run the application only with the non-owner app role.
3. Inject sandbox secrets and execute the redacted preflight.
4. Register provider webhook endpoints and record their provider-side identifiers outside Git.
5. Enable `OFFERS`, `PUBLIC_OFFERS` and `PUBLIC_SUBMISSIONS`; verify information, interest and
   approval journeys before enabling money movement.
6. Enable `PAID_OFFERS` for a synthetic tenant and a synthetic low-value course run only.
7. Exercise card success, card failure, duplicate submit, cancelled browser return, forged webhook,
   repeated webhook, amount mismatch, concurrent last seat, SEPA processing/success/failure and
   PayPal approve/capture/deny.
8. Reconcile provider order, canonical order, event ledger, enrollment and capacity after every case.
9. Keep live credentials and real tenants out of scope until sandbox evidence is reviewed and an
   independent release decision is recorded.

## Immediate rollback

1. Set `AKADEMATE_NEXT_PAID_OFFERS_ENABLED=false` and restart only `tenant-admin`.
2. Preserve the order and provider-event tables; do not roll back a migration containing financial
   evidence.
3. Leave webhook endpoints reachable while already-created provider sessions can still emit events,
   unless security response requires credential rotation and endpoint shutdown.
4. Rotate affected provider secrets and webhook identifiers when authenticity or custody is in
   doubt.
5. Reconcile every `awaiting_payment`, `processing` or `requires_review` order before reactivation.

Disabling paid offers blocks new public checkout creation. It does not rewrite or delete historical
orders, events, enrollments or financial state.

## Sandbox acceptance checklist

- [ ] Exact release SHA recorded.
- [ ] Secrets injected by the authorized store with no log exposure.
- [ ] Redacted sandbox preflight passes.
- [ ] Stripe endpoint and signing secret correspond to the same sandbox endpoint.
- [ ] PayPal client and webhook identifier belong to the same sandbox application.
- [ ] Card success and failure reconciled.
- [ ] SEPA remains processing until asynchronous confirmation.
- [ ] PayPal approval alone does not enroll; verified capture does.
- [ ] Forged and repeated webhook attempts behave fail-closed and idempotently.
- [ ] Amount mismatch enters review without enrollment.
- [ ] Concurrent last-seat attempt confirms at most one enrollment.
- [ ] Browser, console and network evidence captured without personal or secret data.
- [ ] Rollback drill disables new checkouts and preserves evidence.
- [ ] No CEP service, credential, database, domain or deployment was accessed.

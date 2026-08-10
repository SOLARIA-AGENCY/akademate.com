# Holded Native Accounting Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect an Akademate tenant to Holded using a scoped API key, import a bounded read-only accounting projection, process verified webhook signals, and add an independently gated draft-invoice writeback flow.

**Architecture:** Holded API v2 is accessed through a fixed-host client with a per-connection Bearer credential encrypted by the finance secret store. The first release imports accounts, taxes, contacts, invoices, purchases, and payments through the generic sync queue and never changes Akademate payment/enrolment authority. Webhooks are verified from raw bytes and only enqueue work; writeback uses an approved, immutable preview command and never records a Holded payment automatically.

**Tech Stack:** Holded API v2 REST/JSON, Bearer API keys with scopes, cursor pagination, HMAC-SHA256 webhooks, Next.js route handlers, PostgreSQL forced RLS, canonical finance adapter, Vitest, Playwright.

## Global Constraints

- Complete the finance foundation plan and Gate 1 first.
- Provider key is exactly `holded`.
- Base URL is fixed to `https://api.holded.com`; no tenant-configurable host or path is accepted.
- Current official documentation uses Bearer API keys, not OAuth.
- Current official documentation does not establish a sandbox hostname or test-key pattern. Sandbox/demo activation requires written confirmation or an authorized demo organization from Holded.
- Each tenant/connection has its own credential; no global `AKADEMATE_NEXT_HOLDED_API_KEY` exists.
- Initial operations are GET-only. Webhook registration and invoice draft creation are separate gates.
- Holded payment data may enrich accounting state but never marks a canonical Akademate order paid or creates an enrolment.
- No provider request is executed inside Stripe/PayPal webhooks, browser callbacks, or public checkout routes.
- A timed-out/ambiguous mutating Holded request enters `requires_review`; it is not retried blindly.

## Runtime Variables

```dotenv
AKADEMATE_NEXT_FINANCE_HOLDED_ENABLED=false
AKADEMATE_NEXT_HOLDED_WEBHOOK_PUBLIC_ORIGIN=https://app.akademate.com
```

The tenant API key and returned webhook secret are per-connection encrypted credentials and never environment variables. The public origin is environment-specific, contains no path/query/fragment/credentials, and is used only to construct the fixed webhook callback path.

---

## File Map

**Create:**

- `apps/tenant-admin/src/lib/finance/providers/holded/holded-types.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-config.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-config.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-client.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-client.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-adapter.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-adapter.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-sync.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-sync.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-webhook.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-webhook.test.ts`
- `apps/tenant-admin/app/api/next/finance/connections/holded/connect/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/holded/sync/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/holded/webhook/route.ts`
- `apps/tenant-admin/app/api/next/finance/webhooks/holded/[connectionId]/route.ts`
- `apps/tenant-admin/tests/e2e/holded-connection.spec.ts`
- `apps/tenant-admin/scripts/verify-next-holded-sandbox.mjs`
- `docs/runbooks/akademate-next-holded-read-only.md`

**Writeback files, created only after read-only/webhook gates:**

- `apps/tenant-admin/migrations/20260815_akademate_next_holded_writeback.ts`
- `apps/tenant-admin/migrations-next/20260815_akademate_next_holded_writeback.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-writeback.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-writeback.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-writeback-handler.ts`
- `apps/tenant-admin/src/lib/finance/providers/holded/holded-writeback-handler.test.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/holded/writeback/preview/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/holded/writeback/[commandId]/confirm/route.ts`
- `apps/tenant-admin/scripts/verify-next-holded-writeback-db.ts`
- `docs/runbooks/akademate-next-holded-writeback.md`

**Modify:**

- `apps/tenant-admin/src/lib/finance/finance-provider.ts`
- `apps/tenant-admin/src/lib/finance/finance-sync-command.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`
- `apps/tenant-admin/migrations/index.ts` only for the later writeback migration.
- `apps/tenant-admin/package.json`

## Holded Contracts

```ts
export type HoldedCredential = Readonly<{
  apiKey: string
  webhookSecret?: string
}>

export type HoldedReadResource =
  | 'accounts'
  | 'taxes'
  | 'contacts'
  | 'invoices'
  | 'purchases'
  | 'payments'

export type HoldedPage<T> = Readonly<{
  items: readonly T[]
  cursor: string | null
  has_more: boolean
}>

export type HoldedRequestErrorCode =
  | 'holded_auth_invalid'
  | 'holded_scope_missing'
  | 'holded_not_found'
  | 'holded_rate_limited'
  | 'holded_validation_failed'
  | 'holded_remote_error'
  | 'holded_response_invalid'
  | 'holded_request_timeout'
```

### Task 1: Implement fixed-host configuration and the scoped Holded client

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/holded/holded-types.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/holded/holded-config.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/holded/holded-config.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/holded/holded-client.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/holded/holded-client.test.ts`

**Interfaces:**

- Consumes: per-connection credential and injected `fetch`.
- Produces: fixed operations for Holded API v2 and redacted errors.

```ts
export interface HoldedReadClient {
  listAccounts(input: { cursor: string | null; limit: number }): Promise<HoldedPage<unknown>>
  listTaxes(input: { cursor: string | null; limit: number }): Promise<HoldedPage<unknown>>
  listContacts(input: { cursor: string | null; limit: number; email?: string }): Promise<HoldedPage<unknown>>
  listInvoices(input: { cursor: string | null; limit: number }): Promise<HoldedPage<unknown>>
  listPurchases(input: { cursor: string | null; limit: number }): Promise<HoldedPage<unknown>>
  listPayments(input: { cursor: string | null; limit: number }): Promise<HoldedPage<unknown>>
}
```

- [ ] **Step 1: Write config and disabled-runtime tests**

Assert missing/malformed API key fails, no environment inference is made from key text, scaffold instantiates no client, and no API key appears in serialized config/error output.

- [ ] **Step 2: Run and confirm missing modules**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-config.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement fixed resource mapping**

```ts
const holdedResources = {
  accounts: '/api/v2/accounting-accounts',
  taxes: '/api/v2/taxes',
  contacts: '/api/v2/contacts',
  invoices: '/api/v2/invoices',
  purchases: '/api/v2/purchases',
  payments: '/api/v2/payments',
} as const
```

The client never accepts arbitrary path, base URL, authorization header, or provider query object from a route.

- [ ] **Step 4: Write HTTP behavior tests**

Test Bearer header, `Accept: application/json`, cursor encoding, `1 <= limit <= 100`, 15-second GET timeout, content type, schema, 401, 403, 404, 422, 429 with `Retry-After`, 5xx, invalid JSON, and secret redaction in error/cause/log snapshots.

- [ ] **Step 5: Implement read client and error mapping**

GET may retry after persisted `Retry-After`; no retry advances the checkpoint. Translate provider responses to the exact error-code union and discard remote detail text from public errors.

- [ ] **Step 6: Run client tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-config.test.ts src/lib/finance/providers/holded/holded-client.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit client boundary**

```bash
git add apps/tenant-admin/src/lib/finance/providers/holded/holded-types.ts apps/tenant-admin/src/lib/finance/providers/holded/holded-config* apps/tenant-admin/src/lib/finance/providers/holded/holded-client*
git commit -m "feat(finance): add scoped Holded API client"
```

### Task 2: Implement canonical normalization and read-only sync

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/holded/holded-adapter.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/holded/holded-adapter.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/holded/holded-sync.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/holded/holded-sync.test.ts`
- Modify: `apps/tenant-admin/src/lib/finance/finance-provider.ts`
- Modify: `apps/tenant-admin/src/lib/finance/finance-sync-command.ts`

**Interfaces:**

- Consumes: Holded read client and canonical finance sync persistence.
- Produces: `createHoldedFinanceAdapter` and `runHoldedReadSync`.

```ts
export async function runHoldedReadSync(input: {
  tx: NextSqlClient
  principal: NextAuthenticatedPrincipal
  connectionId: string
  resources: readonly HoldedReadResource[]
  maxPagesPerResource: 1 | 2 | 3 | 4 | 5
  adapter: FinanceProviderAdapter
}): Promise<{
  syncRunId: string
  resources: ReadonlyArray<{
    resource: HoldedReadResource
    imported: number
    duplicate: number
    nextCursor: string | null
  }>
}>
```

- [ ] **Step 1: Write resource normalization tests**

Fixtures cover accounts, taxes, clients/suppliers, draft/issued/paid/voided invoices, purchases, partial/full payments, multiple currencies, absent optionals, archived records, and unknown provider enums.

- [ ] **Step 2: Write sync replay and checkpoint tests**

Test first page, exactly 100 records, opaque cursor, empty page, repeated page, cursor not advanced after persistence failure, 429 checkpoint preservation, one-resource 403 degradation, and two tenants/two connections.

- [ ] **Step 3: Run and confirm missing adapter/sync**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-adapter.test.ts src/lib/finance/providers/holded/holded-sync.test.ts`

Expected: FAIL.

- [ ] **Step 4: Implement normalized records**

Persist only external ID/version/update time, resource, type/status, currency, amounts, tax IDs, contact references, due date, and payload hash. Raw provider body and credential are not persisted.

- [ ] **Step 5: Implement bounded sync**

The first manual/sandbox run processes one page/resource sequentially. Cursor and sync items commit atomically. A scope 403 marks only that capability unavailable and the connection `degraded`; it never retries with a broader credential.

- [ ] **Step 6: Run adapter/sync/foundation tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded src/lib/finance/finance-sync-command.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit adapter and sync**

```bash
git add apps/tenant-admin/src/lib/finance/providers/holded apps/tenant-admin/src/lib/finance/finance-provider.ts apps/tenant-admin/src/lib/finance/finance-sync-command.ts
git commit -m "feat(finance): synchronize Holded read models"
```

### Task 3: Connect a tenant credential and queue synchronization

**Files:**

- Create: `apps/tenant-admin/app/api/next/finance/connections/holded/connect/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/holded/sync/route.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/holded/holded-connection-handler.test.ts`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`

**Interfaces:**

- Consumes: authenticated tenant admin, `financeEntityId`, API key, secret store, adapter health/capabilities, and sync queue.
- Produces: redacted connection and queued read-only run.

- [ ] **Step 1: Write handler tests**

Test disabled/scaffold=404, anonymous=401, teacher=403, body over 8 KiB=413, invalid key=422, scope discovery, cross-tenant entity=404, duplicate connection=409, response redaction, and sync=202 with no inline provider work.

- [ ] **Step 2: Run and confirm missing handlers**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-connection-handler.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement connect flow**

Authenticate and set tenant context, validate the API key through a bounded read, discover allowed capabilities without privilege escalation, encrypt/store credential, create connection `read_only`, append audit, and return only ID/provider/mode/status/hasCredential/capabilities.

- [ ] **Step 4: Implement sync enqueue**

Resolve connection by `(tenant_id, id)`, verify `holded` and `connected/read_only`, create or replay one logical queued run, and return 202. The provider call occurs only in the internal drainer.

- [ ] **Step 5: Implement UI**

Use a password field with no value echo, explain required read scopes, state that Holded does not publish a sandbox-key format, require the authorized organization choice, and display only capability/status/checkpoint metadata after connection.

- [ ] **Step 6: Run handler/UI/type tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-connection-handler.test.ts tests/e2e/holded-connection.spec.ts`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Expected: PASS.

- [ ] **Step 7: Commit connection flow**

```bash
git add apps/tenant-admin/app/api/next/finance apps/tenant-admin/app/'(app)'/'(dashboard)'/finanzas/integraciones apps/tenant-admin/src/lib/finance/providers/holded/holded-connection-handler.test.ts
git commit -m "feat(finance): connect tenant Holded accounts"
```

### Task 4: Register and verify Holded webhooks

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/holded/holded-webhook.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/holded/holded-webhook.test.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/holded/webhook/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/webhooks/holded/[connectionId]/route.ts`

**Interfaces:**

- Consumes: explicit registration command, raw bytes, Holded webhook headers, and one-time webhook secret.
- Produces: encrypted webhook secret, idempotent inbox row, and focused sync work.

- [ ] **Step 1: Write registration and signature tests**

Test webhook flag false=404, explicit admin registration only, fixed callback origin, one-time secret encryption, required Holded headers, `sha256=` signature, raw-body HMAC, body maximum 256 KiB, invalid signature, duplicate event ID, altered JSON, another connection's secret, and replay=200/one row.

- [ ] **Step 2: Run and confirm missing verifier**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-webhook.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement explicit remote registration**

Register only invoice create/update/delete and payment create/update/delete events. Store returned webhook secret encrypted once; never render or log it. A registration timeout is `requires_review` because a remote webhook may already exist.

- [ ] **Step 4: Implement fast ingress**

Verify runtime, body size, required headers, raw-body HMAC, connection/account match, and idempotency. Persist event ID/name/account/time/resource ID/body hash only, queue focused sync, and return 2xx after persistence. Do not modify `paid_offer_*` or enrolments.

- [ ] **Step 5: Run webhook and drain tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-webhook.test.ts src/lib/finance/finance-drain-handler.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit webhook flow**

```bash
git add apps/tenant-admin/src/lib/finance/providers/holded/holded-webhook* apps/tenant-admin/app/api/next/finance/webhooks/holded apps/tenant-admin/app/api/next/finance/connections
git commit -m "feat(finance): verify Holded webhook signals"
```

### Task 5: Add separately gated Holded draft-invoice writeback

**Files:**

- Create: writeback files listed in the File Map.
- Modify: `apps/tenant-admin/migrations/index.ts`.

**Interfaces:**

- Consumes: succeeded canonical payment projection, explicit tax/account/contact mappings, admin preview approval, and Holded write credential.
- Produces: one append-only `finance_writeback_commands` record and, on unambiguous success, one external draft invoice ID.

```ts
export type HoldedWritebackPreview = Readonly<{
  paymentProjectionId: string
  previewHash: string
  contact: Readonly<{ name: string; email: string; phone: string | null }>
  invoice: Readonly<{
    issueDate: string
    currency: 'EUR'
    item: Readonly<{
      name: string
      type: 'service'
      units: 1
      unitPriceCents: number
      taxId: string
      revenueAccountId: string
    }>
    notes: string
  }>
}>
```

- [ ] **Step 1: Write migration and database tests**

Create `finance_writeback_commands` with tenant-composite FKs to connection, payment projection, and user; unique `(tenant_id, connection_id, payment_projection_id, kind)`; states `draft`, `approved`, `dispatching`, `succeeded`, `requires_review`, `cancelled`; forced RLS; no direct app-role DML.

- [ ] **Step 2: Write preview tests before implementation**

Reject processing/failed/cancelled/review payment events, cross-tenant projection, missing tax/account/contact mapping, stale preview hash, unsupported currency, cents 0/negative/overflow, and any attempt to infer VAT/account from course or payment provider.

- [ ] **Step 3: Implement deterministic preview**

Resolve only the canonical succeeded projection and minimal order/contact facts. Keep money as integer cents; construct canonical JSON and SHA-256 preview hash. Preview performs no Holded request.

- [ ] **Step 4: Implement explicit confirmation and dispatch**

Confirmation requires admin/superadmin, matching preview hash, and connection `read_write`. Search contact by email with limit 2; ambiguous results require review. Create at most one draft invoice with mapped tax/account. Do not approve, email, or register a payment.

- [ ] **Step 5: Handle ambiguous remote mutation**

201 with valid ID becomes `succeeded`. Timeout, connection reset, 5xx after dispatch, invalid response, or duplicate uncertainty becomes `requires_review` with no automatic POST retry. A replay returns the existing command/result.

- [ ] **Step 6: Run database/writeback/adversarial tests**

Run: `pnpm --filter @akademate/tenant-admin verify:next-holded-writeback-db`

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded/holded-writeback.test.ts src/lib/finance/providers/holded/holded-writeback-handler.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit writeback separately**

```bash
git add apps/tenant-admin/migrations apps/tenant-admin/migrations-next apps/tenant-admin/migrations/index.ts apps/tenant-admin/src/lib/finance/providers/holded/holded-writeback* apps/tenant-admin/app/api/next/finance/connections apps/tenant-admin/scripts/verify-next-holded-writeback-db.ts docs/runbooks/akademate-next-holded-writeback.md
git commit -m "feat(finance): add approved Holded invoice drafts"
```

### Task 6: Complete sandbox/demo, UI, and release gates

**Files:**

- Create: `apps/tenant-admin/tests/e2e/holded-connection.spec.ts`
- Create: `apps/tenant-admin/scripts/verify-next-holded-sandbox.mjs`
- Create: `docs/runbooks/akademate-next-holded-read-only.md`
- Modify: `apps/tenant-admin/package.json`

**Interfaces:**

- Consumes: complete read-only connector; webhooks/writeback only when their flags and gates are enabled.
- Produces: redacted evidence and reproducible activation/rollback procedure.

- [ ] **Step 1: Write the runbook**

Document official API-key generation/scopes, demo-organization authorization, connection, scope discovery, initial one-page sync, cursor replay, revocation, rate limit, webhook registration, rollback, key rotation, writeback approval, and no-CEP boundary.

- [ ] **Step 2: Implement redacted preflight**

Reject scaffold, partial runtime, invalid encryption key, missing demo-organization evidence reference, absent read scopes, enabled writeback without webhooks/read proof, and production claim without deployment SHA. Print only provider, mode, capability names, callback host, and `secrets: 'redacted'`.

- [ ] **Step 3: Run three adversarial attempts**

Edge: page of exactly 100 records, maximum accepted external IDs, and amount of one cent.

Fail-closed: revoked API key/403, invalid encryption key, another connection's webhook HMAC, 429/Retry-After, and ambiguous POST timeout.

Variation: two tenants plus two finance entities under one tenant; every connection, webhook, mapping, projection, and command remains isolated.

- [ ] **Step 4: Run focused and broad gates**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/holded src/lib/finance src/lib/payments/paid-offer-reconciliation.test.ts`

Run: `pnpm --filter @akademate/tenant-admin verify:next-finance-db`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Run: `pnpm --filter @akademate/tenant-admin build`

Run: `pnpm audit:ui`

Run: `pnpm --filter @akademate/tenant-admin exec playwright test tests/e2e/holded-connection.spec.ts`

Expected: PASS against an explicitly authorized Holded demo organization; no live client data or CEP access.

- [ ] **Step 5: Commit runbook and proof**

```bash
git add apps/tenant-admin/tests/e2e/holded-connection.spec.ts apps/tenant-admin/scripts/verify-next-holded-sandbox.mjs apps/tenant-admin/package.json docs/runbooks/akademate-next-holded-read-only.md
git commit -m "test(finance): gate the Holded connector release"
```

## Official Sources

- `https://www.holded.com/es/desarrolladores/autenticacion`
- `https://www.holded.com/es/desarrolladores/primeros-pasos`
- `https://www.holded.com/es/desarrolladores/paginacion`
- `https://www.holded.com/es/desarrolladores/limite-de-tasa`
- `https://www.holded.com/es/desarrolladores/webhooks`
- `https://www.holded.com/es/desarrolladores/referencia-api/contactos/listado-de-contactos-mis-contactos-clientes-proveedores-cont`
- `https://www.holded.com/es/desarrolladores/referencia-api/facturas/listar-facturas-de-venta-mis-facturas-facturas-emitidas-fact`
- `https://www.holded.com/es/desarrolladores/referencia-api/facturas/crear-una-factura`
- `https://www.holded.com/es/desarrolladores/referencia-api/contabilidad/listado-del-plan-contable-cuentas-contables`
- `https://www.holded.com/es/desarrolladores/referencia-api/impuestos/listado-de-impuestos-iva`
- `https://www.holded.com/es/desarrolladores/referencia-api/pagos/listado-de-pagos-y-cobros-mis-pagos-y-cobros`

## Definition of Done

- [ ] Per-connection API key is encrypted, redacted, scoped, and tenant-bound.
- [ ] Fixed-host client maps provider failures without leaking remote data or secrets.
- [ ] Read sync is idempotent, cursor-safe, bounded, and capability-aware.
- [ ] Holded webhooks are signature-verified and never mutate canonical payment/enrolment state.
- [ ] Draft-invoice writeback is separately migrated, approved, mapped, idempotent locally, and fail-closed on ambiguous provider results.
- [ ] Demo/sandbox, database, desktop/mobile, rate-limit, revocation, and rollback gates pass.
- [ ] Holded public status remains `coming-soon` until exact-SHA deployment and served-artifact verification pass.

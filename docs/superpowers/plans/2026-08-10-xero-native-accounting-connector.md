# Xero Native Accounting Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect an authenticated Akademate tenant to a selected Xero organization and import a bounded read-only accounting projection with secure OAuth, idempotent sync, webhook signaling, and truthful UI status.

**Architecture:** Server-side OAuth creates a one-use tenant-bound attempt, exchanges the callback code, stores encrypted rotating tokens, and records selectable Xero organizations without auto-selecting one. An authenticated admin selects the organization and enqueues read-only synchronization; webhook ingress is signature-verified and durable, while the internal drainer executes provider reads asynchronously. Writeback is unavailable until a separate gate adds a draft-invoice outbox.

**Tech Stack:** Xero OAuth 2.0 Authorization Code flow, optional PKCE S256 defense, Xero Accounting API, Next.js route handlers, PostgreSQL forced RLS, canonical finance adapter, HMAC-SHA256 webhooks, Vitest, Playwright.

## Global Constraints

- Complete the finance foundation plan and Gate 1 first.
- Xero provider key is exactly `xero`.
- All Accounting API calls are server-side and use the selected `xero-tenant-id`; the browser cannot supply or override it.
- Phase 1 permits OAuth token endpoint POSTs but Accounting API requests are `GET` only.
- Initial scopes are `offline_access`, `accounting.settings.read`, `accounting.contacts.read`, `accounting.invoices.read`, and `accounting.payments.read`.
- Report scopes are requested only when the tenant explicitly enables the matching report capability.
- No Xero identity scopes are requested because Akademate authenticates its own user.
- A callback creates no invoice, payment, enrolment, journal, bank transaction, or synchronization result.
- Xero connection, API, scope, rate-limit, webhook, and idempotency behavior must be rechecked against official documentation at implementation and release time.

## Runtime Variables

```dotenv
AKADEMATE_NEXT_FINANCE_XERO_ENABLED=false
AKADEMATE_NEXT_XERO_ENVIRONMENT=demo
AKADEMATE_NEXT_XERO_CLIENT_ID=
AKADEMATE_NEXT_XERO_CLIENT_SECRET=
AKADEMATE_NEXT_XERO_WEBHOOK_KEY=
AKADEMATE_NEXT_XERO_REDIRECT_URI=https://app.akademate.com/api/next/finance/oauth/xero/callback
```

The callback origin is environment-specific and must match the registered Xero app exactly. Client secret and webhook key are deployment secrets; tenant OAuth token sets are encrypted per connection.

---

## File Map

**Create:**

- `apps/tenant-admin/src/lib/finance/providers/xero/xero-config.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-config.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-client.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-client.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-adapter.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-adapter.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-webhook.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-webhook.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-sync.ts`
- `apps/tenant-admin/src/lib/finance/providers/xero/xero-sync.test.ts`
- `apps/tenant-admin/app/api/next/finance/connections/xero/authorize/route.ts`
- `apps/tenant-admin/app/api/next/finance/oauth/xero/callback/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/xero/select/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/xero/sync/route.ts`
- `apps/tenant-admin/app/api/next/finance/webhooks/xero/route.ts`
- `apps/tenant-admin/tests/e2e/xero-connection.spec.ts`
- `apps/tenant-admin/scripts/verify-next-xero-sandbox.mjs`
- `docs/runbooks/akademate-next-xero-connector.md`

**Modify:**

- `apps/tenant-admin/src/lib/finance/finance-provider.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`
- `infrastructure/akademate-next/compose.yaml`
- `infrastructure/akademate-next/.env.example`
- `apps/tenant-admin/package.json`

## Provider Contract

```ts
export type XeroTokenSet = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
  scopes: readonly string[]
}

export type XeroOrganization = {
  connectionId: string
  tenantId: string
  tenantName: string | null
  tenantType: 'ORGANISATION'
}

export interface XeroOAuthClient {
  createAuthorizationUrl(input: {
    state: string
    redirectUri: string
    scopes: readonly string[]
    codeChallenge: string
  }): URL
  exchangeCode(input: {
    code: string
    redirectUri: string
    codeVerifier: string
  }): Promise<XeroTokenSet>
  refresh(input: { refreshToken: string }): Promise<XeroTokenSet>
  listConnections(input: { accessToken: string }): Promise<readonly XeroOrganization[]>
  disconnect(input: { accessToken: string; connectionId: string }): Promise<void>
}
```

### Task 1: Resolve Xero configuration and create one-use OAuth attempts

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/xero/xero-config.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-config.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth.test.ts`

**Interfaces:**

- Consumes: finance runtime, generic OAuth-attempt table, secret store, provider client credentials, and exact callback origin.
- Produces: `resolveXeroConfig`, `createXeroAuthorization`, and `consumeXeroCallback`.

- [ ] **Step 1: Write configuration tests**

Reject partial client ID/secret/webhook-key configuration, HTTP production callback, embedded URL credentials, query/fragment in callback, live credentials under sandbox marker, missing 32-byte token-encryption key, and enabled Xero while finance runtime is not connected.

- [ ] **Step 2: Run and confirm missing module**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-config.test.ts`

Expected: FAIL because the resolver does not exist.

- [ ] **Step 3: Implement a redacted resolver**

```ts
export type XeroConfig = {
  clientId: string
  clientSecret: string
  webhookKey: string
  redirectUri: string
  environment: 'demo' | 'production'
  scopes: readonly string[]
}

export function resolveXeroConfig(env: Record<string, string | undefined>): XeroConfig | null
```

The public/preflight view returns only environment, callback hostname, scopes, and `secrets: 'redacted'`.

- [ ] **Step 4: Write OAuth replay, expiry, provider, tenant, and redirect tests**

Use a random 32-byte `state`, random 64-byte verifier, SHA-256 S256 challenge, state digest persistence, 10-minute expiry, atomic consumption, and exact provider/redirect matching.

- [ ] **Step 5: Implement OAuth-attempt commands**

Persist only the state SHA-256 digest and encrypted code verifier. A consumed/expired/mismatched attempt throws `xero_oauth_invalid` before calling Xero.

- [ ] **Step 6: Run narrow tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-config.test.ts src/lib/finance/providers/xero/xero-oauth.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit config and OAuth attempt logic**

```bash
git add apps/tenant-admin/src/lib/finance/providers/xero/xero-config* apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth*
git commit -m "feat(finance): add secure Xero authorization contract"
```

### Task 2: Implement the read-only Xero client and canonical adapter

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/xero/xero-client.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-client.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/xero/xero-adapter.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-adapter.test.ts`
- Modify: `apps/tenant-admin/src/lib/finance/finance-provider.ts`

**Interfaces:**

- Consumes: Xero config, encrypted token set, selected organization, and canonical `FinanceProviderAdapter`.
- Produces: `createXeroClient` and `createXeroAdapter`.

- [ ] **Step 1: Write method and host allowlist tests**

Accounting requests accept only `GET`, base host `api.xero.com`, paths under `/api.xro/2.0/`, the exact selected `xero-tenant-id`, bounded page size, and no caller-supplied authorization/tenant headers. OAuth requests are restricted to `identity.xero.com` token endpoints.

- [ ] **Step 2: Run and verify missing client**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-client.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement endpoint mapping**

```ts
const xeroResources = {
  accounts: '/api.xro/2.0/Accounts',
  taxes: '/api.xro/2.0/TaxRates',
  contacts: '/api.xro/2.0/Contacts',
  invoices: '/api.xro/2.0/Invoices',
  payments: '/api.xro/2.0/Payments',
} as const
```

Use `If-Modified-Since` or provider-supported paging fields where documented. Reject unsupported `expenses`, `banking`, and report resources until their scopes/mapping task is approved.

- [ ] **Step 4: Write normalization tests**

Fixtures cover active/archived accounts, tax rates, contacts without optional fields, invoices in draft/authorized/paid/voided states, partial payments, credit notes, multiple currencies, pagination, and unknown enum values.

- [ ] **Step 5: Implement canonical normalization**

Unknown provider fields remain absent from `normalized`; store only provider ID, version/update timestamp, type, status, currency, totals, tax totals, contact reference, due date, and payload hash. Raw body is not persisted.

- [ ] **Step 6: Run client/adapter tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-client.test.ts src/lib/finance/providers/xero/xero-adapter.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit read-only adapter**

```bash
git add apps/tenant-admin/src/lib/finance/providers/xero apps/tenant-admin/src/lib/finance/finance-provider.ts
git commit -m "feat(finance): add read-only Xero adapter"
```

### Task 3: Add authorize, callback, candidate selection, and manual sync routes

**Files:**

- Create: `apps/tenant-admin/app/api/next/finance/connections/xero/authorize/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/oauth/xero/callback/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/xero/select/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/xero/sync/route.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth-handler.test.ts`

**Interfaces:**

- Consumes: authenticated tenant-admin session for authorize/select/sync and one-use OAuth state for callback.
- Produces: authorization URL, organization candidates, explicit selection, and queued sync.

- [ ] **Step 1: Write route-handler tests**

Test disabled=404, anonymous=401, teacher=403, admin authorize=200, callback state replay=400, provider code reflected nowhere, candidate auto-selection forbidden, cross-tenant candidate=404, selection=200, and sync=202 without inline provider I/O.

- [ ] **Step 2: Run and confirm route failure**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-oauth-handler.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement authorize**

Authenticate, validate role, insert the OAuth attempt, append audit, and return `{ authorizationUrl }`. The URL includes exact redirect, scopes, state, code challenge, and `code_challenge_method=S256`.

- [ ] **Step 4: Implement callback**

Consume state before exchange, exchange code on the server, encrypt the newest access/refresh token set, call `GET https://api.xero.com/connections`, store candidates, set `selection_pending`, and return `303` to `/finanzas/integraciones?connection=<uuid>&selection=pending`. Strip code/state from the redirect.

- [ ] **Step 5: Implement selection and sync queue**

Selection verifies candidate, connection, principal, and tenant in one serializable transaction. It changes status to `connected_read_only` and creates the initial logical sync run. Manual sync creates or reuses one queued run and returns `202`.

- [ ] **Step 6: Run handler tests and typecheck**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-oauth-handler.test.ts`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Expected: PASS.

- [ ] **Step 7: Commit route flow**

```bash
git add apps/tenant-admin/app/api/next/finance apps/tenant-admin/src/lib/finance/providers/xero/xero-oauth-handler.test.ts
git commit -m "feat(finance): connect and select Xero organizations"
```

### Task 4: Add idempotent incremental synchronization and token rotation

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/xero/xero-sync.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-sync.test.ts`
- Modify: `apps/tenant-admin/src/lib/finance/finance-sync-command.ts`

**Interfaces:**

- Consumes: claimed sync run, selected Xero organization, cursor/checkpoint, encrypted token set, and canonical sync items.
- Produces: idempotent current external objects, append-only sync evidence, and updated cursor.

- [ ] **Step 1: Write token-rotation concurrency tests**

Two workers reaching an expired access token must perform one refresh under `SELECT ... FOR UPDATE`; the second observes the newer token version. Missing rotated refresh token or `invalid_grant` moves the connection to `reauthorization_required`.

- [ ] **Step 2: Write cursor and replay tests**

Test empty page, multi-page, repeated page, same object/version/hash, same version/different hash, older update after newer update, 429 with `Retry-After`, 503, timeout, and partial resource failure.

- [ ] **Step 3: Run and confirm missing sync implementation**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-sync.test.ts`

Expected: FAIL.

- [ ] **Step 4: Implement bounded scheduling**

Use at most four concurrent requests per organization, 48 requests/minute, and an initial local budget of 800 requests/day until the certified Xero tier is recorded. Persist `next_allowed_at`; preserve last successful checkpoint on failure.

- [ ] **Step 5: Implement object upsert and evidence append**

Current projection updates only when the provider modification time is newer. Every accepted/replayed/rejected object appends a redacted sync item with resource, external ID, external version, payload hash, outcome, and error code.

- [ ] **Step 6: Run sync and broad finance tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-sync.test.ts src/lib/finance/finance-sync-command.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit sync engine**

```bash
git add apps/tenant-admin/src/lib/finance/providers/xero/xero-sync* apps/tenant-admin/src/lib/finance/finance-sync-command.ts
git commit -m "feat(finance): synchronize Xero read models"
```

### Task 5: Verify and persist Xero webhook signals

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/xero/xero-webhook.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/xero/xero-webhook.test.ts`
- Create: `apps/tenant-admin/app/api/next/finance/webhooks/xero/route.ts`

**Interfaces:**

- Consumes: raw request bytes, `x-xero-signature`, Xero webhook key, and organization/resource events.
- Produces: idempotent webhook inbox rows and queued reconciliation work.

- [ ] **Step 1: Write signature, size, duplicate, and intent-to-receive tests**

Verify HMAC over exact raw bytes, timing-safe comparison, body maximum 256 KiB, invalid signature=401, invalid JSON=400, signed empty `events`=200/no job, duplicate event=200/one inbox row, and no cookies.

- [ ] **Step 2: Run and confirm missing verifier**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-webhook.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement minimal normalized event identity**

Use a SHA-256 key over provider, organization ID, resource ID, event category/type, provider timestamp, and sequence values. Store identifiers, operation, timestamp, body hash, and processing status; do not store the raw body.

- [ ] **Step 4: Implement fast ingress route**

The route verifies, inserts inbox rows, queues work, and returns 200 within the provider limit. It performs no Xero Accounting API request and no finance projection update inline.

- [ ] **Step 5: Run webhook and drain tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero/xero-webhook.test.ts src/lib/finance/finance-drain-handler.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit webhook ingress**

```bash
git add apps/tenant-admin/src/lib/finance/providers/xero/xero-webhook* apps/tenant-admin/app/api/next/finance/webhooks/xero
git commit -m "feat(finance): verify Xero webhook signals"
```

### Task 6: Add Xero UI states and sandbox gate

**Files:**

- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`
- Create: `apps/tenant-admin/tests/e2e/xero-connection.spec.ts`
- Create: `apps/tenant-admin/scripts/verify-next-xero-sandbox.mjs`
- Create: `docs/runbooks/akademate-next-xero-connector.md`
- Modify: `infrastructure/akademate-next/compose.yaml`
- Modify: `infrastructure/akademate-next/.env.example`
- Modify: `apps/tenant-admin/package.json`

**Interfaces:**

- Consumes: Xero connection/candidate/sync APIs.
- Produces: honest authorization, selection, connected, syncing, rate-limited, reauthorization, and disconnected states.

- [ ] **Step 1: Write UI tests before implementation**

Assert no accounting data before `lastSuccessfulSyncAt`, candidate selection is explicit, revoked access displays reauthorization, and no token/code/state/tenant ID is rendered or logged.

- [ ] **Step 2: Implement UI states**

Display provider, selected organization name, granted capabilities, mode `Read only`, last successful sync, next retry, and error code. Do not use `live`, `real time`, `fully synchronized`, or `reconciled` unless persisted evidence supports the exact state.

- [ ] **Step 3: Add redacted sandbox preflight**

The script rejects partial config, production callback in demo mode, invalid token-encryption key, enabled writeback, missing webhook key, and connection without organization selection. Success prints only provider, environment, callback host, scopes, mode, and `secrets: 'redacted'`.

- [ ] **Step 4: Write the runbook**

Document app registration, exact callbacks, webhook endpoint, demo organization, scope review, activation flags, initial sync, webhook intent-to-receive, reconciliation, rate limits, disconnect, token rotation, rollback, and no-CEP boundary.

- [ ] **Step 5: Run focused and broad gates**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/xero src/lib/finance`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Run: `pnpm --filter @akademate/tenant-admin build`

Run: `pnpm --filter @akademate/tenant-admin exec playwright test tests/e2e/xero-connection.spec.ts`

Run: `node apps/tenant-admin/scripts/verify-next-xero-sandbox.mjs`

Expected: PASS against a dedicated Xero demo organization; no live tenant or CEP access.

- [ ] **Step 6: Commit UI and runbook**

```bash
git add apps/tenant-admin docs/runbooks/akademate-next-xero-connector.md infrastructure/akademate-next
git commit -m "feat(finance): complete Xero read-only connection flow"
```

## Deferred Writeback Gate

The first writeback milestone is limited to a draft sales invoice generated from one canonical `paid_offer_order` in `succeeded` state and its verified payment event. It requires a new migration/outbox, deterministic `Idempotency-Key`, reauthorization for write scopes, explicit preview and approval, mapping for contact/tax/account, and a separate implementation plan. Payments, bank transactions, journal entries, invoice authorization, email sending, and enrolment changes remain prohibited.

## Official Sources

- `https://developer.xero.com/documentation/guides/oauth2/overview`
- `https://developer.xero.com/documentation/guides/oauth2/auth-flow/`
- `https://developer.xero.com/documentation/guides/oauth2/scopes/`
- `https://developer.xero.com/documentation/api/accounting/overview`
- `https://developer.xero.com/documentation/guides/oauth2/limits/`
- `https://developer.xero.com/documentation/guides/webhooks/overview/`
- `https://developer.xero.com/documentation/guides/idempotent-requests/idempotency/`

## Definition of Done

- [ ] OAuth state is one-use, tenant-bound, expiring, and never reflected after callback.
- [ ] Organization selection is explicit and tenant-scoped.
- [ ] Accounting API client is read-only.
- [ ] Token refresh is serialized and rotation-safe.
- [ ] Sync is idempotent, checkpointed, rate-limited, and auditable.
- [ ] Webhook ingress verifies raw-body signatures and performs no inline sync.
- [ ] UI renders only persisted provider facts.
- [ ] Dedicated demo organization, local, database, desktop/mobile, and rollback gates pass.
- [ ] Xero public status remains `coming-soon` until exact-SHA deployment and served-artifact verification pass.

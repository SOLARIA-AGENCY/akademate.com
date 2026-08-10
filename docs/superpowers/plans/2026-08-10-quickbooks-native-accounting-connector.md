# QuickBooks Online Native Accounting Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect an authenticated Akademate tenant to a confirmed QuickBooks Online company and import a bounded read-only accounting projection with secure OAuth, serialized token rotation, CDC recovery, verified webhooks, and truthful UI state.

**Architecture:** The confidential server application uses Authorization Code OAuth and a cryptographic one-use `state`; the returned `realmId` is stored only as a candidate until a tenant admin confirms it. QuickBooks grants the broad accounting scope, so Akademate enforces read-only operation through runtime mode, a GET-only client, and tests that reject mutating methods before transport. Webhooks enqueue durable signals and Change Data Capture recovers missed or out-of-order changes.

**Tech Stack:** Intuit OAuth 2.0, QuickBooks Online Accounting API, QBO webhooks and CDC, Next.js route handlers, PostgreSQL forced RLS, HMAC-SHA256, canonical finance adapter, Vitest, Playwright.

## Global Constraints

- Complete the finance foundation plan and Gate 1 first.
- Provider key is exactly `quickbooks`; public name is `QuickBooks Online`.
- OAuth scope is exactly `com.intuit.quickbooks.accounting`; no OpenID identity scope is requested.
- QBO's scope is not read-only. Phase 1 enforces `GET` only in Akademate code and configuration.
- Do not send PKCE fields until Intuit's official OAuth metadata and documentation support them for this flow; `state` remains mandatory and one-use.
- The callback-provided `realmId` is a candidate, not an automatic tenant/account selection.
- Browser requests never supply or override the selected `realmId` used by provider calls.
- A callback or webhook creates no invoice, payment, enrolment, bank transaction, or journal.
- Provider limits, token rules, CDC semantics, and signatures must be rechecked against official Intuit documentation at implementation and release time.

## Runtime Variables

```dotenv
AKADEMATE_NEXT_FINANCE_QUICKBOOKS_ENABLED=false
AKADEMATE_NEXT_QUICKBOOKS_ENVIRONMENT=sandbox
AKADEMATE_NEXT_QUICKBOOKS_CLIENT_ID=
AKADEMATE_NEXT_QUICKBOOKS_CLIENT_SECRET=
AKADEMATE_NEXT_QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=
AKADEMATE_NEXT_QUICKBOOKS_REDIRECT_URI=https://app.akademate.com/api/next/finance/oauth/quickbooks/callback
```

The callback origin is environment-specific and must match the Intuit app registration. Client secret and webhook verifier token are deployment secrets; tenant access/refresh token sets are encrypted per connection.

---

## File Map

**Create:**

- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-config.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-config.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-client.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-client.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-adapter.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-adapter.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-webhook.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-webhook.test.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-sync.ts`
- `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-sync.test.ts`
- `apps/tenant-admin/app/api/next/finance/connections/quickbooks/authorize/route.ts`
- `apps/tenant-admin/app/api/next/finance/oauth/quickbooks/callback/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/quickbooks/select/route.ts`
- `apps/tenant-admin/app/api/next/finance/connections/[id]/quickbooks/sync/route.ts`
- `apps/tenant-admin/app/api/next/finance/webhooks/quickbooks/route.ts`
- `apps/tenant-admin/tests/e2e/quickbooks-connection.spec.ts`
- `apps/tenant-admin/scripts/verify-next-quickbooks-sandbox.mjs`
- `docs/runbooks/akademate-next-quickbooks-connector.md`

**Modify:**

- `apps/tenant-admin/src/lib/finance/finance-provider.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`
- `infrastructure/akademate-next/compose.yaml`
- `infrastructure/akademate-next/.env.example`
- `apps/tenant-admin/package.json`

## Provider Contract

```ts
export type QuickBooksTokenSet = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
  refreshTokenHardExpiresAt: Date | null
  scopes: readonly ['com.intuit.quickbooks.accounting']
}

export type QuickBooksCompanyCandidate = {
  realmId: string
  displayName: string | null
}

export interface QuickBooksOAuthClient {
  createAuthorizationUrl(input: { state: string; redirectUri: string }): URL
  exchangeCode(input: { code: string; redirectUri: string }): Promise<QuickBooksTokenSet>
  refresh(input: { refreshToken: string }): Promise<QuickBooksTokenSet>
}
```

### Task 1: Resolve QuickBooks configuration and one-use OAuth attempts

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-config.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-config.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth.test.ts`

**Interfaces:**

- Consumes: finance runtime, generic OAuth-attempt persistence, encrypted secret store, Intuit app credentials, and callback origin.
- Produces: `resolveQuickBooksConfig`, `createQuickBooksAuthorization`, and `consumeQuickBooksCallback`.

- [ ] **Step 1: Write configuration tests**

Reject partial client/secret/verifier-token configuration, production API base under sandbox mode, sandbox API base under production mode, HTTP production callback, query/fragment/embedded credentials, enabled writeback, missing token-encryption key, and finance runtime not connected.

- [ ] **Step 2: Run and confirm missing resolver**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-config.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement a redacted resolver**

```ts
export type QuickBooksConfig = {
  environment: 'sandbox' | 'production'
  apiBaseUrl: 'https://sandbox-quickbooks.api.intuit.com' | 'https://quickbooks.api.intuit.com'
  clientId: string
  clientSecret: string
  webhookVerifierToken: string
  redirectUri: string
  scope: 'com.intuit.quickbooks.accounting'
}
```

Preflight output contains environment, API hostname, callback hostname, scope, and `secrets: 'redacted'` only.

- [ ] **Step 4: Write OAuth state and realm tests**

Test random 32-byte state, digest persistence, 10-minute expiry, atomic consumption, replay, wrong provider, modified redirect URI, missing/oversized code, malformed realm ID, and attempted PKCE parameter injection.

- [ ] **Step 5: Implement callback consumption**

Persist only the state digest. Exchange the code server-side, encrypt the latest token set, store the callback `realmId` as one `qbo_realm` candidate, set `selection_pending`, and never infer the internal tenant from `realmId`.

- [ ] **Step 6: Run narrow tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-config.test.ts src/lib/finance/providers/quickbooks/quickbooks-oauth.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit config and OAuth**

```bash
git add apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-config* apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth*
git commit -m "feat(finance): add secure QuickBooks authorization contract"
```

### Task 2: Implement the GET-only QBO client and canonical adapter

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-client.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-client.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-adapter.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-adapter.test.ts`
- Modify: `apps/tenant-admin/src/lib/finance/finance-provider.ts`

**Interfaces:**

- Consumes: QuickBooks config, selected realm, token set, and canonical finance adapter.
- Produces: `createQuickBooksClient` and `createQuickBooksAdapter`.

```ts
export type QuickBooksReadRequest = {
  method: 'GET'
  path: `/v3/company/${string}/${string}`
  query?: Readonly<Record<string, string>>
}
```

- [ ] **Step 1: Write GET-only and realm-boundary tests**

Reject POST/PUT/PATCH/DELETE before fetch, a base URL not matching configured environment, realm mismatch, caller authorization header, path traversal, unbounded query, and query containing semicolon/comment tokens outside the query builder.

- [ ] **Step 2: Run and confirm missing client**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-client.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement a typed query builder**

Permit only these entities in phase 1:

```ts
const qboEntities = ['CompanyInfo', 'Account', 'TaxCode', 'Customer', 'Vendor', 'Invoice', 'CreditMemo', 'Payment', 'Bill', 'Purchase'] as const
```

Generate encoded `SELECT * FROM <allowed entity> WHERE MetaData.LastUpdatedTime > '<validated ISO timestamp>' STARTPOSITION <positive integer> MAXRESULTS 500`. Never accept raw query text from a route, browser, or sync record.

- [ ] **Step 4: Write normalization tests**

Cover sparse references, inactive accounts, customer/vendor distinctions, invoices with tax/discount/partial payment, credit memos, payments, bills, purchases, multi-currency, `SyncToken`, missing optionals, and unknown enum values.

- [ ] **Step 5: Implement canonical normalization**

Store only provider ID, `SyncToken`, update time, type, status, currency, totals, balance, tax total, counterparty reference, due date, and payload hash. Never persist raw provider responses.

- [ ] **Step 6: Run client and adapter tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-client.test.ts src/lib/finance/providers/quickbooks/quickbooks-adapter.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit read-only adapter**

```bash
git add apps/tenant-admin/src/lib/finance/providers/quickbooks apps/tenant-admin/src/lib/finance/finance-provider.ts
git commit -m "feat(finance): add GET-only QuickBooks adapter"
```

### Task 3: Add authorize, callback, realm selection, and manual sync routes

**Files:**

- Create: `apps/tenant-admin/app/api/next/finance/connections/quickbooks/authorize/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/oauth/quickbooks/callback/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/quickbooks/select/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/quickbooks/sync/route.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth-handler.test.ts`

**Interfaces:**

- Consumes: authenticated tenant-admin session for authorize/select/sync and one-use OAuth state for callback.
- Produces: authorization URL, realm candidate, explicit selection, and queued sync.

- [ ] **Step 1: Write route-handler tests**

Test disabled=404, anonymous=401, teacher=403, authorize=200, replayed callback=400, no code/state/realm reflection, candidate auto-selection forbidden, cross-tenant candidate=404, selected realm immutable, and sync=202 with zero inline provider calls.

- [ ] **Step 2: Run and confirm missing handlers**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-oauth-handler.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement authorize**

Authenticate, require admin/superadmin/gestor according to the foundation policy, persist state digest, append audit, and return the Intuit authorization URL with exact redirect, scope, response type, and state. The URL has no PKCE fields.

- [ ] **Step 4: Implement callback**

Consume state, exchange code, encrypt token set, validate realm ID as digits, persist one candidate, set `selection_pending`, and redirect 303 to `/finanzas/integraciones?connection=<uuid>&selection=pending`. The redirect contains no provider code/state/token.

- [ ] **Step 5: Implement realm selection and sync queue**

Selection verifies candidate, connection, principal, and tenant in one transaction, sets `connected_read_only`, and enqueues an initial run. Sync returns one idempotent queued run with 202.

- [ ] **Step 6: Run handler tests and typecheck**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-oauth-handler.test.ts`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Expected: PASS.

- [ ] **Step 7: Commit route flow**

```bash
git add apps/tenant-admin/app/api/next/finance apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-oauth-handler.test.ts
git commit -m "feat(finance): connect and select QuickBooks companies"
```

### Task 4: Add serialized refresh and CDC-backed synchronization

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-sync.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-sync.test.ts`
- Modify: `apps/tenant-admin/src/lib/finance/finance-sync-command.ts`

**Interfaces:**

- Consumes: claimed run, selected realm, last watermark, token version, and canonical sync persistence.
- Produces: idempotent current objects, append-only evidence, next poll, and a daily CDC recovery checkpoint.

- [ ] **Step 1: Write token-rotation concurrency tests**

Model 60-minute access tokens and rolling refresh tokens. Two concurrent refresh attempts must serialize under connection lock; only the latest refresh token is persisted. `invalid_grant` changes status to `reauthorization_required` and stops resource calls.

- [ ] **Step 2: Write query/CDC/replay tests**

Test empty result, 500-record paging, repeated page, duplicate object/version/hash, same version/different hash, older update after newer update, missed webhook recovered by CDC, 429, 503, timeout, and partial entity failure.

- [ ] **Step 3: Run and confirm missing sync implementation**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-sync.test.ts`

Expected: FAIL.

- [ ] **Step 4: Implement local rate budgets**

Use one active drainer per realm, at most eight requests/second and 400 requests/minute, leaving headroom below published provider limits. On 429, persist `next_allowed_at` for at least 60 seconds or the provider `Retry-After`, whichever is longer.

- [ ] **Step 5: Implement current-object and evidence rules**

Update current projection only when `MetaData.LastUpdatedTime` is newer, or when the same timestamp carries a higher supported `SyncToken`. Append outcome evidence for accepted, replayed, stale, and rejected objects.

- [ ] **Step 6: Implement daily CDC recovery**

Call the QBO CDC endpoint for supported entities since the last successful watermark. CDC and webhook jobs share the same object idempotency boundary and cannot duplicate projections.

- [ ] **Step 7: Run sync and broad finance tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-sync.test.ts src/lib/finance/finance-sync-command.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit sync engine**

```bash
git add apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-sync* apps/tenant-admin/src/lib/finance/finance-sync-command.ts
git commit -m "feat(finance): synchronize QuickBooks read models"
```

### Task 5: Verify QBO webhooks and enqueue recovery work

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-webhook.ts`
- Test: `apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-webhook.test.ts`
- Create: `apps/tenant-admin/app/api/next/finance/webhooks/quickbooks/route.ts`

**Interfaces:**

- Consumes: raw bytes, `intuit-signature`, verifier token, `intuitaccountid`, entity/operation/time events.
- Produces: idempotent inbox rows and queued CDC/resource work.

- [ ] **Step 1: Write signature and ordering tests**

Test HMAC-SHA256 base64 over raw bytes, timing-safe comparison, missing/invalid signature, body over 256 KiB, malformed JSON, unknown realm, duplicate event, multiple realms in one delivery, out-of-order changes, and response deadline behavior.

- [ ] **Step 2: Run and confirm missing verifier**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-webhook.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement normalized event keys**

Hash provider, realm, entity name, entity ID, operation, provider `lastUpdated`, and notification time. Match a connection by provider/environment/realm only; never accept internal `tenant_id` from the body.

- [ ] **Step 4: Implement fast ingress**

Verify signature before JSON parse, insert inbox, queue work, and return 200 within three seconds. Perform no QBO API call or projection update inside the route.

- [ ] **Step 5: Run webhook, drain, and CDC tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks/quickbooks-webhook.test.ts src/lib/finance/providers/quickbooks/quickbooks-sync.test.ts src/lib/finance/finance-drain-handler.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit webhook ingress**

```bash
git add apps/tenant-admin/src/lib/finance/providers/quickbooks/quickbooks-webhook* apps/tenant-admin/app/api/next/finance/webhooks/quickbooks
git commit -m "feat(finance): verify QuickBooks webhook signals"
```

### Task 6: Add QuickBooks UI states and sandbox gate

**Files:**

- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`
- Create: `apps/tenant-admin/tests/e2e/quickbooks-connection.spec.ts`
- Create: `apps/tenant-admin/scripts/verify-next-quickbooks-sandbox.mjs`
- Create: `docs/runbooks/akademate-next-quickbooks-connector.md`
- Modify: `infrastructure/akademate-next/compose.yaml`
- Modify: `infrastructure/akademate-next/.env.example`
- Modify: `apps/tenant-admin/package.json`

**Interfaces:**

- Consumes: QBO connection/candidate/sync APIs.
- Produces: authorization, selection, connected, syncing, rate-limited, reauthorization, and disconnected UI states.

- [ ] **Step 1: Write UI tests**

Assert explicit realm confirmation, read-only label, no data before successful sync, no token/code/state/realm ID in DOM/logs, revoked state with reauthorize CTA, and exact last-success timestamp.

- [ ] **Step 2: Implement UI**

Display `QuickBooks Online`, selected company display name, environment, granted scope, read-only capability list, last successful sync, next recovery time, and error code. Do not describe the connection as reconciled, certified, real-time, or write-enabled.

- [ ] **Step 3: Add redacted sandbox preflight**

Reject partial credentials, production API host in sandbox mode, local callback in production, enabled writeback, invalid encryption key, missing verifier token, and unselected realm. Output contains no secrets or realm ID.

- [ ] **Step 4: Write runbook**

Document Intuit app/sandbox company setup, callback, webhook, scope consent, realm confirmation, initial sync, webhook/CDC recovery, rate limit, token rotation, disconnect, rollback, evidence capture, and no-CEP boundary.

- [ ] **Step 5: Run focused and broad gates**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/providers/quickbooks src/lib/finance`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Run: `pnpm --filter @akademate/tenant-admin build`

Run: `pnpm --filter @akademate/tenant-admin exec playwright test tests/e2e/quickbooks-connection.spec.ts`

Run: `node apps/tenant-admin/scripts/verify-next-quickbooks-sandbox.mjs`

Expected: PASS against an Intuit sandbox company; no live company or CEP access.

- [ ] **Step 6: Commit UI and runbook**

```bash
git add apps/tenant-admin docs/runbooks/akademate-next-quickbooks-connector.md infrastructure/akademate-next
git commit -m "feat(finance): complete QuickBooks read-only connection flow"
```

## Writeback Boundary

QBO writeback is not part of this plan. Before any create/update call, a separate ADR must define invoice numbering, customer/tax/item mapping, `SyncToken` conflict handling, duplicate prevention, local approval, correction/void behavior, and jurisdictional review. The existing broad OAuth scope does not authorize Akademate product policy to write.

## Official Sources

- `https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0`
- `https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/faq`
- `https://developer.intuit.com/app/developer/qbo/docs/learn/scopes`
- `https://developer.intuit.com/app/developer/qbo/docs/develop/webhooks/configure-webhooks`
- `https://developer.intuit.com/app/developer/qbo/docs/develop/webhooks/best-practices`
- `https://developer.intuit.com/app/developer/qbo/docs/learn/limits-and-throttles`
- `https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api`

## Definition of Done

- [ ] OAuth state is one-use, tenant-bound, expiring, and never reflected after callback.
- [ ] Realm selection is explicit and tenant-scoped.
- [ ] Accounting client rejects every mutating method before transport.
- [ ] Refresh rotation is serialized and stores only the newest token set.
- [ ] Sync and CDC are idempotent, checkpointed, rate-limited, and auditable.
- [ ] Webhook ingress verifies raw-body signature and performs no inline provider work.
- [ ] UI renders only persisted provider facts.
- [ ] Intuit sandbox, local, database, desktop/mobile, and rollback gates pass.
- [ ] QuickBooks public status remains `coming-soon` until exact-SHA deployment and served-artifact verification pass.

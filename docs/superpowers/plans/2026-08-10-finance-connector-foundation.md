# Akademate Finance Connector Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the default-off, tenant-safe runtime, schema, secret custody, provider contract, projection layer, API, and dashboard required by every native or custom finance connector.

**Architecture:** A generic authenticated Next transaction establishes tenant, user, and role context before forced-RLS access. Finance connections reference a tenant-owned finance entity, encrypted credentials are reachable only through a server-side secret-store interface, and provider adapters emit normalized records into append-only sync evidence plus current read models. The existing paid-offer ledger is projected, never copied as a second payment authority.

**Tech Stack:** TypeScript 5.9, Next.js 15 route handlers, PostgreSQL 16, `postgres`, Zod 4, Node crypto AES-256-GCM, Vitest/Node test runner, Playwright, `@akademate/ui`.

## Global Constraints

- Inherit every constraint from `2026-08-10-finance-integrations-program.md`.
- This plan creates no provider-specific network client.
- Every API response uses `Cache-Control: private, no-store`.
- Allowed finance administration roles are exactly `superadmin`, `admin`, and `gestor`; `marketing`, `teacher`, and `student` have no finance-connection authority.
- Direct table DML by the application role is denied where a security-definer command is defined.
- Financial metrics render only from persisted facts; empty state uses no invented zero trends, balances, or transactions.

## Runtime Variables

```dotenv
AKADEMATE_NEXT_FINANCE_MODE=disabled
AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED=false
AKADEMATE_NEXT_FINANCE_REAL_DATA_ENABLED=false
AKADEMATE_NEXT_FINANCE_WEBHOOKS_ENABLED=false
AKADEMATE_NEXT_FINANCE_WRITEBACK_ENABLED=false
AKADEMATE_NEXT_FINANCE_ENCRYPTION_KEY_VERSION=1
AKADEMATE_NEXT_FINANCE_ENCRYPTION_KEY_V1=
AKADEMATE_NEXT_FINANCE_DRAINER_HMAC_KEY=
AKADEMATE_NEXT_FINANCE_DRAINER_URL=http://tenant-admin:3000/api/internal/next/finance/drain
```

The example file keeps secret values empty. The deployment secret channel supplies the base64-encoded 32-byte encryption key and at least 32-byte HMAC key. `disabled` and `scaffold` reject a truthy external-I/O, real-data, webhook, or writeback flag instead of silently ignoring it.

---

## File Map

**Create:**

- `docs/adr/0010-akademate-next-finance-connectors.md` — authority, runtime, provider, secret, and writeback decisions.
- `apps/tenant-admin/src/lib/runtime/next-authenticated-transaction.ts` — generic tenant/user/role transaction authority.
- `apps/tenant-admin/src/lib/runtime/next-authenticated-transaction.test.ts` — role and database safety tests.
- `apps/tenant-admin/src/lib/finance/finance-runtime.ts` — fail-closed configuration resolver.
- `apps/tenant-admin/src/lib/finance/finance-runtime.test.ts` — configuration truth table.
- `apps/tenant-admin/src/lib/finance/finance-provider.ts` — canonical provider types and registry.
- `apps/tenant-admin/src/lib/finance/finance-provider.test.ts` — capability and disabled-adapter tests.
- `apps/tenant-admin/src/lib/finance/finance-secret-store.ts` — encryption and secret-store interface.
- `apps/tenant-admin/src/lib/finance/finance-secret-store.test.ts` — encryption, rotation, and redaction tests.
- `apps/tenant-admin/src/lib/finance/finance-connection-command.ts` — tenant-scoped reads and mutations.
- `apps/tenant-admin/src/lib/finance/finance-connection-handler.ts` — HTTP contract and error mapping.
- `apps/tenant-admin/src/lib/finance/finance-connection-handler.test.ts` — route-handler tests.
- `apps/tenant-admin/src/lib/finance/finance-payment-projection.ts` — paid-offer ledger projection.
- `apps/tenant-admin/src/lib/finance/finance-payment-projection.test.ts` — payment-authority boundary tests.
- `apps/tenant-admin/src/lib/finance/finance-sync-command.ts` — claim, checkpoint, finish, and recovery commands.
- `apps/tenant-admin/src/lib/finance/finance-sync-command.test.ts` — queue, lease, replay, and recovery tests.
- `apps/tenant-admin/src/lib/finance/finance-drain-handler.ts` — internal HMAC-authenticated drainer contract.
- `apps/tenant-admin/src/lib/finance/finance-drain-handler.test.ts` — signature, replay, disabled-mode, and single-claim tests.
- `apps/tenant-admin/migrations/20260810_akademate_next_finance_connectors.ts` — base schema, RLS, grants, and SQL functions.
- `apps/tenant-admin/migrations-next/20260810_akademate_next_finance_connectors.ts` — Next migration re-export.
- `apps/tenant-admin/scripts/verify-next-finance-db.ts` — fresh PostgreSQL/RLS/adversarial proof.
- `apps/tenant-admin/app/api/next/finance/connections/route.ts` — list/create endpoint.
- `apps/tenant-admin/app/api/next/finance/connections/[id]/route.ts` — detail/update/disconnect endpoint.
- `apps/tenant-admin/app/api/next/finance/summary/route.ts` — persisted finance read model.
- `apps/tenant-admin/app/api/internal/next/finance/drain/route.ts` — asynchronous internal work trigger.
- `apps/tenant-admin/scripts/finance-drainer.mjs` — no-egress poller that calls the internal drain route.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/FinanceWorkspace.tsx` — real empty/connected states.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx` — connection catalogue.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx` — connection detail.
- `docs/runbooks/akademate-next-finance-connectors.md` — install, activation, rollback, secret rotation, evidence.

**Modify:**

- `apps/tenant-admin/src/lib/learning/next-learning-transaction.ts` — compatibility exports from the generic transaction authority.
- `apps/tenant-admin/migrations/index.ts` — register the Next-only finance migration.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/page.tsx` — replace `UpcomingPlaceholder` with `FinanceWorkspace`.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/cobros-pagos/page.tsx` — remove unsupported reconciliation/payment-provider claims.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/facturacion/page.tsx` — remove unsupported fiscal-invoice claims.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/informes/page.tsx` — remove unsupported accounting-report claims.
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/nominas/page.tsx` — remove unsupported payroll claims.
- `apps/tenant-admin/app/(app)/(dashboard)/_components/DashboardHome.tsx` — relabel canonical payment review accurately.
- `apps/tenant-admin/package.json` — add `verify:next-finance-db` script.
- `apps/tenant-admin/tsconfig.next-offers.json` — include finance sources if the focused config excludes them.
- `infrastructure/akademate-next/compose.yaml` — add the internal-only finance drainer and default-off finance flags.
- `infrastructure/akademate-next/.env.example` — document empty/default-off finance variables without credentials.

## Canonical Interfaces

```ts
export type FinanceRuntimeMode = 'disabled' | 'scaffold' | 'connected'

export type FinanceRuntime = {
  mode: FinanceRuntimeMode
  externalIo: boolean
  realData: boolean
  webhooks: boolean
  writeback: boolean
}

export type FinanceProviderKey = 'holded' | 'xero' | 'quickbooks'
export type FinanceConnectionMode = 'scaffold' | 'read_only' | 'read_write'
export type FinanceConnectionStatus =
  | 'disconnected'
  | 'pending_authorization'
  | 'connected'
  | 'degraded'
  | 'revoked'
  | 'disabled'

export type FinanceCapability =
  | 'accounts.read'
  | 'taxes.read'
  | 'contacts.read'
  | 'invoices.read'
  | 'expenses.read'
  | 'payments.read'
  | 'banking.read'
  | 'reports.read'
  | 'invoices.write'
  | 'payments.write'
  | 'journals.write'
  | 'webhooks'

export type FinanceProviderContext = {
  tenantId: number
  financeEntityId: string
  connectionId: string
  externalOrganizationId: string
  credential: Readonly<Record<string, string>>
}

export interface FinanceProviderAdapter {
  readonly key: FinanceProviderKey
  validateCredential(input: Readonly<Record<string, string>>): Promise<void>
  discoverOrganizations(): Promise<Array<{ id: string; name: string }>>
  discoverCapabilities(context: FinanceProviderContext): Promise<ReadonlySet<FinanceCapability>>
  healthCheck(context: FinanceProviderContext): Promise<{ ok: boolean; code: string }>
  readPage(input: {
    context: FinanceProviderContext
    resource: 'accounts' | 'taxes' | 'contacts' | 'invoices' | 'expenses' | 'payments' | 'banking'
    cursor: string | null
    modifiedAfter: string | null
  }): Promise<{ records: readonly CanonicalFinanceRecord[]; nextCursor: string | null }>
}

export type CanonicalFinanceRecord = {
  provider: FinanceProviderKey
  resource: string
  externalId: string
  externalVersion: string | null
  occurredAt: string | null
  currency: string | null
  payloadHash: string
  normalized: Readonly<Record<string, unknown>>
}
```

### Task 1: Record architecture and extract the generic authenticated transaction

**Files:**

- Create: `docs/adr/0010-akademate-next-finance-connectors.md`
- Create: `apps/tenant-admin/src/lib/runtime/next-authenticated-transaction.ts`
- Test: `apps/tenant-admin/src/lib/runtime/next-authenticated-transaction.test.ts`
- Modify: `apps/tenant-admin/src/lib/learning/next-learning-transaction.ts`

**Interfaces:**

- Consumes: current `NextLearningIdentity`, database-role verification, serializable transaction, and session-derived tenant/user identity.
- Produces: `NextAuthenticatedIdentity`, `NextAuthenticatedPrincipal`, and `withNextAuthenticatedTransaction<T>()`; the learning module re-exports compatible aliases.

- [ ] **Step 1: Write the failing generic-transaction tests**

```ts
test('rejects runtime, principal, and unsafe database roles before setting context', async () => {
  await assert.rejects(run({ runtime: 'legacy' }), hasCode('next_runtime_required'))
  await assert.rejects(run({ tenantId: 0 }), hasCode('principal_tenant_invalid'))
  await assert.rejects(run({ dbRole: { rolsuper: true } }), hasCode('database_role_unsafe'))
})

test('sets tenant user and role transaction-locally after active-user verification', async () => {
  const principal = await run({ userId: 7, tenantId: 3, role: 'admin' })
  assert.deepEqual(principal, { userId: 7, tenantId: 3, active: true, platformRole: 'admin' })
})
```

- [ ] **Step 2: Run the narrow test and verify the missing module failure**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/runtime/next-authenticated-transaction.test.ts`

Expected: FAIL because `next-authenticated-transaction.ts` does not exist.

- [ ] **Step 3: Extract the current transaction implementation without changing behavior**

```ts
export async function withNextAuthenticatedTransaction<T>(
  identity: NextAuthenticatedIdentity,
  callback: (tx: NextSqlClient, principal: NextAuthenticatedPrincipal) => Promise<T>,
  options: NextTransactionOptions = {},
): Promise<T>
```

Keep `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`, role safety checks, active-user lookup, and transaction-local `app.tenant_id`, `app.user_id`, and `app.role` settings byte-for-byte equivalent in meaning.

- [ ] **Step 4: Make learning imports backward-compatible**

```ts
export {
  NextAuthenticatedInfrastructureError as NextLearningInfrastructureError,
  withNextAuthenticatedTransaction as withNextLearningTransaction,
} from '../runtime/next-authenticated-transaction.ts'
export type {
  NextAuthenticatedIdentity as NextLearningIdentity,
  NextAuthenticatedPrincipal as NextLearningPrincipal,
  NextSqlClient as LearningSqlClient,
  NextSqlPool as LearningSqlPool,
} from '../runtime/next-authenticated-transaction.ts'
```

- [ ] **Step 5: Run generic and existing learning tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/runtime/next-authenticated-transaction.test.ts src/lib/learning/next-learning-transaction.test.ts`

Expected: PASS.

- [ ] **Step 6: Write the ADR with the exact source-of-truth and activation decisions**

The ADR must record: provider-neutral adapters, encrypted credential references, RLS, paid-offer projection, read-only-first, default-off modes, and public claim gating.

- [ ] **Step 7: Commit the generic authority extraction**

```bash
git add docs/adr/0010-akademate-next-finance-connectors.md apps/tenant-admin/src/lib/runtime apps/tenant-admin/src/lib/learning/next-learning-transaction.ts
git commit -m "refactor(finance): extract authenticated Next transaction authority"
```

### Task 2: Implement the fail-closed finance runtime and provider registry

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/finance-runtime.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-runtime.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/finance-provider.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-provider.test.ts`

**Interfaces:**

- Consumes: environment variables and the canonical types above.
- Produces: `resolveFinanceRuntime(env)`, `financeProviderCatalog`, and `createDisabledFinanceProviderAdapter(key)`.

- [ ] **Step 1: Write the failing runtime truth-table test**

```ts
assert.deepEqual(resolveFinanceRuntime({}), disabled)
assert.deepEqual(resolveFinanceRuntime({ AKADEMATE_NEXT_FINANCE_MODE: 'scaffold' }), scaffold)
assert.deepEqual(resolveFinanceRuntime({
  AKADEMATE_NEXT_FINANCE_MODE: 'connected',
  AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED: 'true',
  AKADEMATE_NEXT_FINANCE_REAL_DATA_ENABLED: 'true',
}), { mode: 'connected', externalIo: true, realData: true, webhooks: false, writeback: false })
assert.deepEqual(resolveFinanceRuntime({
  AKADEMATE_NEXT_FINANCE_MODE: 'connected',
  AKADEMATE_NEXT_FINANCE_WRITEBACK_ENABLED: 'true',
}), disabled)
```

- [ ] **Step 2: Run the test and confirm missing exports**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-runtime.test.ts`

Expected: FAIL because the resolver does not exist.

- [ ] **Step 3: Implement exact fail-closed rules**

```ts
if (env.AKADEMATE_NEXT_FINANCE_MODE === 'scaffold') return scaffold
if (env.AKADEMATE_NEXT_FINANCE_MODE !== 'connected') return disabled
if (env.AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED !== 'true') return disabled
if (env.AKADEMATE_NEXT_FINANCE_REAL_DATA_ENABLED !== 'true') return disabled
const webhooks = env.AKADEMATE_NEXT_FINANCE_WEBHOOKS_ENABLED === 'true'
const writeback = env.AKADEMATE_NEXT_FINANCE_WRITEBACK_ENABLED === 'true'
return { mode: 'connected', externalIo: true, realData: true, webhooks, writeback }
```

- [ ] **Step 4: Write disabled-adapter and catalogue tests**

Verify the catalogue contains only `holded`, `xero`, and `quickbooks`, every provider starts `coming_soon`, and every disabled-adapter method rejects with `finance_provider_disabled` before invoking injected transport.

- [ ] **Step 5: Implement the provider types and disabled adapter**

The disabled adapter must have no `fetch` dependency and all methods must throw `FinanceProviderError('finance_provider_disabled')`.

- [ ] **Step 6: Run both narrow suites**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-runtime.test.ts src/lib/finance/finance-provider.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit runtime and provider boundary**

```bash
git add apps/tenant-admin/src/lib/finance/finance-runtime* apps/tenant-admin/src/lib/finance/finance-provider*
git commit -m "feat(finance): add fail-closed provider boundary"
```

### Task 3: Add tenant-safe schema, RLS, grants, and migration registration

**Files:**

- Create: `apps/tenant-admin/migrations/20260810_akademate_next_finance_connectors.ts`
- Create: `apps/tenant-admin/migrations-next/20260810_akademate_next_finance_connectors.ts`
- Modify: `apps/tenant-admin/migrations/index.ts`
- Create: `apps/tenant-admin/scripts/verify-next-finance-db.ts`
- Modify: `apps/tenant-admin/package.json`

**Interfaces:**

- Consumes: `akademate_next_current_tenant_id()`, `app.user_id`, `app.role`, `tenants`, `campuses`, `paid_offer_orders`, and `paid_offer_payment_events`.
- Produces: finance tables, RLS policies, least-privilege SQL functions, and database proof.

- [ ] **Step 1: Write the database proof before the migration**

The proof must assert table existence, constraints, forced RLS, app-role safety, direct-DML rejection, tenant isolation, composite-FK rejection, append-only audit, and migration rollback on a disposable database.

```ts
await assert.rejects(app`INSERT INTO finance_connections (id) VALUES (gen_random_uuid())`, hasPgCode('42501'))
await setContext(app, { tenantId: tenantA, userId: adminA, role: 'admin' })
assert.equal((await app`SELECT count(*)::int AS count FROM finance_connections`)[0]?.count, 1)
await setContext(app, { tenantId: tenantB, userId: adminB, role: 'admin' })
assert.equal((await app`SELECT count(*)::int AS count FROM finance_connections`)[0]?.count, 0)
```

- [ ] **Step 2: Run the proof and confirm the missing-table failure**

Run: `pnpm --filter @akademate/tenant-admin verify:next-finance-db`

Expected: FAIL with `relation "finance_entities" does not exist`.

- [ ] **Step 3: Create the schema with explicit checks**

Create these tables:

```text
finance_entities
finance_connections
finance_connection_credentials
finance_oauth_attempts
finance_connection_candidates
finance_mappings
finance_sync_cursors
finance_sync_runs
finance_sync_items
finance_external_objects
finance_webhook_events
finance_audit_events
finance_payment_projections
```

Required unique boundaries:

```sql
UNIQUE (tenant_id, id)
UNIQUE (tenant_id, slug) -- finance_entities
UNIQUE (state_digest) -- finance_oauth_attempts, SHA-256 digest only
UNIQUE (tenant_id, connection_id, external_organization_id) -- candidates
UNIQUE (tenant_id, connection_id, mapping_kind, internal_key) WHERE retired_at IS NULL
UNIQUE (tenant_id, connection_id, provider_resource) -- sync cursors
UNIQUE (tenant_id, connection_id, provider_resource, external_id, external_version)
UNIQUE (tenant_id, connection_id, provider_resource, external_id) -- current external object
UNIQUE (tenant_id, payment_event_id) -- finance_payment_projections
```

Required composite foreign keys include tenant in both columns:

```sql
FOREIGN KEY (tenant_id, finance_entity_id)
  REFERENCES finance_entities (tenant_id, id)
FOREIGN KEY (tenant_id, connection_id)
  REFERENCES finance_connections (tenant_id, id)
FOREIGN KEY (tenant_id, payment_event_id)
  REFERENCES paid_offer_payment_events (tenant_id, id)
```

`finance_oauth_attempts` stores tenant, actor, provider, pending connection, state digest, exact redirect URI, exact requested scopes, expiry, and `consumed_at`; the PKCE verifier or token-exchange material is encrypted through the secret store and referenced by connection and purpose. `finance_connection_candidates` stores provider organization or realm candidates but cannot activate one without an authenticated selection command. `finance_sync_cursors` stores one checkpoint per resource and connection. `finance_external_objects` is the current redacted provider read model; `finance_sync_items` remains immutable execution evidence.

- [ ] **Step 4: Add check constraints and append-only rules**

Use exact state sets from the canonical interfaces. Deny `UPDATE` and `DELETE` on `finance_audit_events`, `finance_sync_items`, and `finance_payment_projections` to the app role. A corrected fact is a new record linked through `supersedes_id`.

- [ ] **Step 5: Enable and force RLS on every finance table**

```sql
ALTER TABLE finance_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_connections FORCE ROW LEVEL SECURITY;
CREATE POLICY finance_connections_tenant ON finance_connections
  AS RESTRICTIVE FOR ALL
  USING (tenant_id = akademate_next_current_tenant_id())
  WITH CHECK (tenant_id = akademate_next_current_tenant_id());
```

Repeat with the exact table name for every finance table. Add a permissive role policy only for `superadmin`, `admin`, and `gestor` where administrative access is required.

- [ ] **Step 6: Add least-privilege SQL commands**

Create `akademate_next_create_finance_connection`, `akademate_next_update_finance_connection_status`, and `akademate_next_append_finance_audit_event` as `SECURITY DEFINER`, fixed `search_path`, revoked from `PUBLIC`, and granted only to the configured Next app role.

- [ ] **Step 7: Register the migration only in `nextMigrations`**

Add the import and list item after `20260809_akademate_next_event_ticket_types`; do not add it to `legacyMigrations`.

- [ ] **Step 8: Run migration, database proof, and rollback proof**

Run: `AKADEMATE_RUNTIME=next pnpm --filter @akademate/tenant-admin payload migrate`

Run: `pnpm --filter @akademate/tenant-admin verify:next-finance-db`

Expected: PASS with a JSON summary containing `forcedRlsTables`, `crossTenantDenied`, `directDmlDenied`, and `paymentProjectionAppendOnly`.

- [ ] **Step 9: Commit schema and proof**

```bash
git add apps/tenant-admin/migrations apps/tenant-admin/migrations-next apps/tenant-admin/scripts/verify-next-finance-db.ts apps/tenant-admin/package.json
git commit -m "feat(finance): add tenant-safe connector persistence"
```

### Task 4: Implement encrypted credential custody

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/finance-secret-store.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-secret-store.test.ts`

**Interfaces:**

- Consumes: `finance_connection_credentials`, a base64-encoded 32-byte key, tenant ID, connection ID, and provider key.
- Produces: `FinanceSecretStore.put/get/delete/rotate` without exposing storage fields.

```ts
export interface FinanceSecretStore {
  put(input: {
    tenantId: number
    connectionId: string
    provider: FinanceProviderKey
    credential: Readonly<Record<string, string>>
  }): Promise<{ keyVersion: number }>
  get(input: { tenantId: number; connectionId: string }): Promise<Readonly<Record<string, string>>>
  delete(input: { tenantId: number; connectionId: string }): Promise<void>
  rotate(input: { tenantId: number; connectionId: string; targetKeyVersion: number }): Promise<void>
}
```

- [ ] **Step 1: Write encryption and tenant-binding tests**

Test round-trip, wrong key, tampered tag, swapped tenant AAD, swapped connection AAD, key rotation, deletion, and error-string redaction.

- [ ] **Step 2: Run the test and verify missing implementation**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-secret-store.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement AES-256-GCM with bound associated data**

```ts
const aad = Buffer.from(`${tenantId}:${connectionId}:${provider}:v${keyVersion}`, 'utf8')
const cipher = createCipheriv('aes-256-gcm', key, randomBytes(12))
cipher.setAAD(aad)
```

Persist ciphertext, IV, auth tag, and key version as binary values. Parse the encryption key only from server environment and reject a missing, malformed, or reused test key with `finance_encryption_key_invalid`.

- [ ] **Step 4: Guarantee redaction**

`FinanceSecretStoreError` exposes only one of: `finance_secret_not_found`, `finance_secret_corrupt`, `finance_encryption_key_invalid`, `finance_secret_store_unavailable`. It must never include provider responses, credential keys, ciphertext, IV, or tag.

- [ ] **Step 5: Run the narrow tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-secret-store.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit secret custody**

```bash
git add apps/tenant-admin/src/lib/finance/finance-secret-store*
git commit -m "feat(finance): encrypt tenant connector credentials"
```

### Task 5: Project Akademate payment evidence into finance records

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/finance-payment-projection.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-payment-projection.test.ts`

**Interfaces:**

- Consumes: succeeded/processing/failed/cancelled `paid_offer_payment_events` joined to their canonical order.
- Produces: append-only `finance_payment_projections` with no provider accounting identifier until a connector accepts it.

```ts
export async function projectPaidOfferPaymentEvents(input: {
  tx: NextSqlClient
  principal: NextAuthenticatedPrincipal
  afterEventId: number | null
  limit: number
}): Promise<{ projected: number; lastEventId: number | null }>
```

- [ ] **Step 1: Write authority-boundary tests**

Assert that a browser return creates no projection, `processing` remains unsettled, `succeeded` projects once, replay projects zero additional rows, amount mismatch remains `requires_review`, and cross-tenant events are invisible.

- [ ] **Step 2: Run the test and confirm the missing-function failure**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-payment-projection.test.ts`

Expected: FAIL because `projectPaidOfferPaymentEvents` does not exist.

- [ ] **Step 3: Implement an insert-select guarded by the tenant and event unique key**

The normalized record includes order ID, payment event ID, provider, normalized status, amount, currency, payment method, occurred time, course run, and enrolment ID. It excludes email, phone, checkout URL, provider secrets, and raw webhook payloads.

- [ ] **Step 4: Run replay and cross-tenant tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-payment-projection.test.ts src/lib/payments/paid-offer-reconciliation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the projection**

```bash
git add apps/tenant-admin/src/lib/finance/finance-payment-projection*
git commit -m "feat(finance): project canonical payment evidence"
```

### Task 6: Add tenant-admin finance APIs

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/finance-connection-command.ts`
- Create: `apps/tenant-admin/src/lib/finance/finance-connection-handler.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-connection-handler.test.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/connections/[id]/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/summary/route.ts`

**Interfaces:**

- Consumes: authenticated Next identity, finance runtime, generic transaction, SQL commands, and secret store.
- Produces: redacted connection catalogue/detail and persisted finance summary.

- [ ] **Step 1: Write handler tests for runtime, auth, role, validation, and redaction**

```ts
assert.equal((await handlers.GET(request, { runtime: disabled })).status, 404)
assert.equal((await handlers.GET(request, { authenticate: none })).status, 401)
assert.equal((await handlers.POST(request, { role: 'teacher' })).status, 403)
assert.deepEqual(await response.json(), { items: [{ id, provider: 'holded', status: 'connected', hasCredential: true }] })
assert.equal(JSON.stringify(await response.json()).includes('ciphertext'), false)
```

- [ ] **Step 2: Run the handler test and confirm missing modules**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-connection-handler.test.ts`

Expected: FAIL because the handler does not exist.

- [ ] **Step 3: Implement Zod request contracts**

Create accepts `financeEntityId`, `provider`, and `mode`. Update accepts `mode` or `status`; provider and external organization identifiers are immutable after connection. Disconnect deletes the encrypted credential and appends an audit event while retaining connection/sync history.

- [ ] **Step 4: Map exact errors**

Use 404 `not_found`, 401 `unauthorized`, 403 `forbidden`, 409 `finance_connection_conflict`, 422 `invalid_request`, 503 `finance_service_unavailable`, and 500 `internal_error`. Log only error class and request correlation ID.

- [ ] **Step 5: Wire routes using `authenticateNextLearningRequest` and `withNextAuthenticatedTransaction`**

Every route declares `dynamic = 'force-dynamic'` and `runtime = 'nodejs'`.

- [ ] **Step 6: Run handler, auth, and type tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-connection-handler.test.ts src/lib/learning/next-learning-auth.test.ts`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Expected: PASS.

- [ ] **Step 7: Commit API boundary**

```bash
git add apps/tenant-admin/src/lib/finance/finance-connection-* apps/tenant-admin/app/api/next/finance
git commit -m "feat(finance): expose redacted connection APIs"
```

### Task 6A: Add the provider-neutral sync queue and internal drainer

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/finance-sync-command.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-sync-command.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/finance-drain-handler.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-drain-handler.test.ts`
- Create: `apps/tenant-admin/app/api/internal/next/finance/drain/route.ts`
- Create: `apps/tenant-admin/scripts/finance-drainer.mjs`
- Modify: `infrastructure/akademate-next/compose.yaml`
- Modify: `infrastructure/akademate-next/.env.example`

**Interfaces:**

- Consumes: queued `finance_sync_runs`, provider registry, runtime, connection lease, and an internal HMAC key.
- Produces: one claimed run, provider-page execution, persisted checkpoint/evidence, and recoverable retry time.

```ts
export async function claimNextFinanceSyncRun(input: {
  tx: NextSqlClient
  workerId: string
  leaseSeconds: number
  now: Date
}): Promise<FinanceSyncRunClaim | null>

export function createFinanceDrainHandler(dependencies: {
  runtime: () => FinanceRuntime
  verifyInternalRequest: (request: Request) => Promise<boolean>
  claim: () => Promise<FinanceSyncRunClaim | null>
  execute: (claim: FinanceSyncRunClaim) => Promise<FinanceSyncRunResult>
  finish: (result: FinanceSyncRunResult) => Promise<void>
}): { POST(request: Request): Promise<Response> }
```

- [ ] **Step 1: Write queue/lease tests**

Test one claimant under concurrency, expired lease reclamation, non-expired lease exclusion, logical-run idempotency, disabled connection exclusion, provider rate-limit scheduling, and terminal run non-replay.

- [ ] **Step 2: Write internal-auth tests**

The signature covers method, path, timestamp, nonce, and SHA-256 body. Reject missing/old timestamp (>30 seconds), reused nonce, modified body, wrong key, disabled/scaffold runtime, and body over 8 KiB.

- [ ] **Step 3: Run and confirm missing modules**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-sync-command.test.ts src/lib/finance/finance-drain-handler.test.ts`

Expected: FAIL.

- [ ] **Step 4: Implement SQL claim/finish commands**

Claim with `FOR UPDATE SKIP LOCKED`, store worker/lease timestamps, and never pass provider credential through a queue payload. Finish writes counts, checkpoint, redacted error code, next retry, and append-only sync evidence in one transaction.

- [ ] **Step 5: Implement the internal drain route**

The route is `nodejs`, `force-dynamic`, `private, no-store`, and accepts only valid HMAC requests. It claims at most one run and invokes only the adapter named by the persisted connection. `disabled` and `scaffold` return 404 before adapter creation.

- [ ] **Step 6: Add an internal-only drainer service**

The drainer has PostgreSQL/Redis-independent behavior and no egress network. It periodically signs one empty POST to the internal tenant-admin drain route. Only `tenant-admin` retains the existing egress bridge and provider credentials.

- [ ] **Step 7: Run tests and compose contract**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-sync-command.test.ts src/lib/finance/finance-drain-handler.test.ts`

Run: `docker compose --env-file infrastructure/akademate-next/.env.example -f infrastructure/akademate-next/compose.yaml config --format json`

Expected: PASS; drainer joins only `akademate_next_internal` and receives only internal route/HMAC configuration.

- [ ] **Step 8: Commit the queue and drainer**

```bash
git add apps/tenant-admin/src/lib/finance/finance-sync-command* apps/tenant-admin/src/lib/finance/finance-drain-handler* apps/tenant-admin/app/api/internal/next/finance/drain apps/tenant-admin/scripts/finance-drainer.mjs infrastructure/akademate-next
git commit -m "feat(finance): add isolated connector sync drainer"
```

### Task 7: Replace the finance placeholder with real empty and connected states

**Files:**

- Create: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/FinanceWorkspace.tsx`
- Create: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`
- Create: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/[id]/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/cobros-pagos/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/facturacion/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/informes/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/nominas/page.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/_components/DashboardHome.tsx`
- Test: `apps/tenant-admin/tests/components/finance-workspace.test.tsx`

**Interfaces:**

- Consumes: `/api/next/finance/summary` and `/api/next/finance/connections`.
- Produces: accessible setup, connection status, sync history, and persisted summaries without simulated finance data.

- [ ] **Step 1: Write component tests**

Test loading, disabled, no-connection, connected-with-no-data, degraded, and persisted-summary states. Assert there are no hard-coded revenue, margin, expense, or trend numbers.

- [ ] **Step 2: Run the test and confirm component absence**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run tests/components/finance-workspace.test.tsx`

Expected: FAIL because `FinanceWorkspace` does not exist.

- [ ] **Step 3: Implement the workspace with shared UI primitives**

Use `PageHeader`, `Card`, `Badge`, `EmptyState`, `Button`, `Skeleton`, and `Tabs`. Status labels are `Not connected`, `Connected`, `Needs attention`, `Access revoked`, and `Disabled`. The primary CTA is `Connect accounting` and routes to `/finanzas/integraciones`.

- [ ] **Step 4: Implement connection detail without credential rendering**

Show provider, organization, entity, mode, granted capabilities, last successful sync, latest error code, and audit timeline. Never show API token, OAuth token, ciphertext, provider raw payload, or personal financial detail in a client log.

- [ ] **Step 4A: Replace unsupported shadow promises across finance routes**

Rename the dashboard attention item from `Pagos por conciliar` to `Órdenes de oferta en revisión`. The four existing finance subpages state their exact unavailable boundary and link back to Connections: no supplier payments or bank reconciliation, no fiscal invoice issuance/TicketBAI/SII, no accounting reports, and no payroll/cost calculation. They contain no fake metrics, mock charts, provider logos, or activation CTA.

- [ ] **Step 5: Run component, accessibility, and UI inventory checks**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run tests/components/finance-workspace.test.tsx`

Run: `pnpm audit:ui`

Expected: PASS with no unreviewed primitive drift.

- [ ] **Step 6: Commit the finance workspace**

```bash
git add 'apps/tenant-admin/app/(app)/(dashboard)/finanzas' apps/tenant-admin/tests/components/finance-workspace.test.tsx
git commit -m "feat(finance): add honest connection workspace"
```

### Task 8: Add runbook, adversarial proof, and broad local gate

**Files:**

- Create: `docs/runbooks/akademate-next-finance-connectors.md`
- Modify: `apps/tenant-admin/tsconfig.next-offers.json` only if finance files are outside current includes.

**Interfaces:**

- Consumes: completed Tasks 1–7.
- Produces: reproducible local evidence and an activation/rollback procedure.

- [ ] **Step 1: Write the runbook**

Document flags, key generation/rotation, migration owner role, app role, scaffold verification, synthetic tenant setup, provider activation order, disconnect, evidence preservation, rollback, and the explicit CEP exclusion.

- [ ] **Step 2: Run the three required adversarial attempts**

Edge input: maximum provider/external IDs and an empty sync page.

Fail-closed condition: malformed encryption key plus `connected` mode.

Untested variation: tenant with two finance entities connected to the same provider but different external organizations.

- [ ] **Step 3: Run focused tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance tests/components/finance-workspace.test.tsx`

Expected: PASS.

- [ ] **Step 4: Run database proof**

Run: `pnpm --filter @akademate/tenant-admin verify:next-finance-db`

Expected: PASS.

- [ ] **Step 5: Run affected typecheck, build, and UI audit**

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Run: `pnpm --filter @akademate/tenant-admin build`

Run: `pnpm audit:ui`

Expected: PASS; classify unrelated baseline failures separately with command output and unchanged-file evidence.

- [ ] **Step 6: Run desktop and mobile Playwright smoke**

Verify `/finanzas`, `/finanzas/integraciones`, and a connection detail at 1440×900 and 390×844. Assert no horizontal overflow, accessibility violation, console error, failed first-party request, provider request in scaffold, or tracker request before consent.

- [ ] **Step 7: Commit the runbook and gate adjustments**

```bash
git add docs/runbooks/akademate-next-finance-connectors.md apps/tenant-admin/tsconfig.next-offers.json
git commit -m "docs(finance): add connector activation and rollback runbook"
```

## Foundation Definition of Done

- [ ] All tasks have independently reviewable commits.
- [ ] No provider network client or credential was activated.
- [ ] Finance mode defaults to `disabled` and `scaffold` makes zero provider calls.
- [ ] Every table is tenant-scoped with forced RLS and composite relationships.
- [ ] Payment projection is append-only and derived from canonical payment events.
- [ ] UI uses persisted facts and honest empty states.
- [ ] Focused unit, handler, database, type, build, UI, desktop, and mobile checks pass.
- [ ] No CEP file, runtime, hostname, data, secret, or deployment was touched.

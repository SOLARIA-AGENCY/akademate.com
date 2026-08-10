# Custom Finance Integrations and Public Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated academies request a governed integration for an unsupported finance provider and communicate native, planned, and custom connector availability truthfully across Akademate's public Home, Features, and Pricing pages.

**Architecture:** Integration requests are tenant-owned records with an append-only status history and explicit technical classification. Public connector availability is centralized in a typed registry whose `available` state requires a deployment evidence reference; marketing pages consume the registry instead of hard-coding provider claims. The public-web change runs in its own clean public worktree after the backend milestone.

**Tech Stack:** Next.js 15, TypeScript, PostgreSQL 16 forced RLS, Zod, Vitest, Playwright, Akademate public i18n dictionaries and marketing components.

## Global Constraints

- Inherit every constraint from `2026-08-10-finance-integrations-program.md`.
- Backend work targets `/Users/carlosjperez/Documents/GitHub/akademate-next-offers-integrated`.
- Public-web work targets a fresh isolated worktree created from the branch proven to serve `akademate.com`; the observed reference worktree is `/Users/carlosjperez/Documents/GitHub/akademate-public-expansion` at `e790f818889624198d914c80cf7d61bbac3892b3`, but execution must re-verify deployment ownership.
- Do not edit the dirty main worktree `/Users/carlosjperez/Documents/GitHub/akademate.com`.
- `available` means native connector code, sandbox/staging proof, deployed exact SHA, and served-artifact verification all exist.
- `coming-soon` means planned or in development; it does not expose a Connect button.
- `custom-request` means Akademate accepts a discovery request; it does not promise feasibility, delivery date, or included price.
- English and Spanish copy must remain semantically equivalent.
- Provider logos remain identification marks, not endorsements or certifications.

---

## File Map

### Akademate Next backend

**Create:**

- `apps/tenant-admin/migrations/20260811_akademate_next_finance_integration_requests.ts`
- `apps/tenant-admin/migrations-next/20260811_akademate_next_finance_integration_requests.ts`
- `apps/tenant-admin/src/lib/finance/finance-integration-request.ts`
- `apps/tenant-admin/src/lib/finance/finance-integration-request.test.ts`
- `apps/tenant-admin/src/lib/finance/finance-integration-request-handler.ts`
- `apps/tenant-admin/src/lib/finance/finance-integration-request-handler.test.ts`
- `apps/tenant-admin/app/api/next/finance/integration-requests/route.ts`
- `apps/tenant-admin/app/api/next/finance/integration-requests/[id]/route.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/solicitar/page.tsx`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/solicitar/IntegrationRequestForm.tsx`
- `apps/tenant-admin/tests/components/finance-integration-request-form.test.tsx`

**Modify:**

- `apps/tenant-admin/migrations/index.ts`
- `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`

### Public Akademate web

**Create:**

- `apps/web/lib/integration-availability.ts`
- `apps/web/lib/integration-availability.test.ts`
- `apps/web/components/marketing/FinanceConnectorShowcase.tsx`
- `apps/web/e2e/finance-integrations.spec.ts`
- `apps/web/public/brand-sources/finance-connectors.md`

**Modify:**

- `apps/web/lib/marketing-content.ts`
- `apps/web/lib/marketing-content.test.ts`
- `apps/web/lib/pricing-content.ts`
- `apps/web/lib/pricing-content.test.ts`
- `apps/web/lib/pricing-i18n.ts`
- `apps/web/lib/i18n/marketing-copy.ts`
- `apps/web/lib/i18n/marketing-copy.test.ts`
- `apps/web/components/marketing/ConnectorLogos.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/features/page.tsx`
- `apps/web/app/pricing/page.tsx`
- `apps/web/app/contacto/page.tsx`

## Canonical Request Contract

```ts
export type FinanceIntegrationRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'api_validation'
  | 'proposal_pending'
  | 'accepted'
  | 'in_development'
  | 'sandbox_validation'
  | 'available'
  | 'declined'
  | 'cancelled'

export type FinanceIntegrationClassification =
  | 'public_api_oauth'
  | 'public_api_token'
  | 'api_discovery_required'
  | 'file_exchange'
  | 'custom_middleware'
  | 'not_feasible'

export type FinanceIntegrationRequestInput = {
  providerName: string
  providerWebsite: string
  apiDocumentationUrl: string | null
  countryCode: string
  currency: string
  legalEntityCount: number
  campusCount: number
  monthlyTransactionBand: 'under_100' | '100_999' | '1000_9999' | '10000_plus'
  capabilities: Array<'accounts' | 'taxes' | 'contacts' | 'invoices' | 'expenses' | 'payments' | 'banking' | 'payroll' | 'reports'>
  writebackRequested: boolean
  sandboxKnown: 'yes' | 'no' | 'unknown'
  urgency: 'exploring' | 'quarter' | 'sixty_days' | 'thirty_days'
  context: string
}
```

### Task 1: Add tenant-owned integration requests and append-only history

**Files:**

- Create: `apps/tenant-admin/migrations/20260811_akademate_next_finance_integration_requests.ts`
- Create: `apps/tenant-admin/migrations-next/20260811_akademate_next_finance_integration_requests.ts`
- Modify: `apps/tenant-admin/migrations/index.ts`

**Interfaces:**

- Consumes: finance foundation, users, tenants, and current tenant/user/role database context.
- Produces: `finance_integration_requests` and `finance_integration_request_events`.

- [ ] **Step 1: Extend the finance database proof with failing request assertions**

```ts
await setContext(app, { tenantId: tenantA, userId: adminA, role: 'admin' })
const requestA = await createRequest(app, validRequest)
await setContext(app, { tenantId: tenantB, userId: adminB, role: 'admin' })
assert.equal((await app`SELECT count(*)::int AS count FROM finance_integration_requests`)[0]?.count, 0)
await assert.rejects(app`UPDATE finance_integration_request_events SET event_type='changed'`, hasPgCode('42501'))
```

- [ ] **Step 2: Run the proof and confirm the missing-table failure**

Run: `pnpm --filter @akademate/tenant-admin verify:next-finance-db`

Expected: FAIL because `finance_integration_requests` does not exist.

- [ ] **Step 3: Create request and event tables with exact constraints**

`finance_integration_requests` stores normalized provider/country/currency/scope fields, submitter user ID, current status, classification, created/updated timestamps, and a tenant-composite unique ID. `finance_integration_request_events` stores immutable transition events with actor, from/to states, reason code, and timestamp.

```sql
CHECK (status IN ('submitted','under_review','api_validation','proposal_pending','accepted','in_development','sandbox_validation','available','declined','cancelled'))
CHECK (classification IS NULL OR classification IN ('public_api_oauth','public_api_token','api_discovery_required','file_exchange','custom_middleware','not_feasible'))
CHECK (country_code ~ '^[A-Z]{2}$')
CHECK (currency ~ '^[A-Z]{3}$')
CHECK (char_length(context) BETWEEN 20 AND 4000)
```

- [ ] **Step 4: Add forced RLS and roles**

Tenant admins and gestores may create/read their tenant requests. Only `superadmin` may transition internal review states. The submitter or tenant admin may cancel only while status is `submitted`, `under_review`, or `proposal_pending`.

- [ ] **Step 5: Add a security-definer transition function**

`akademate_next_transition_finance_integration_request(request_id uuid, requested_status varchar, reason_code varchar)` validates the state machine, updates current status, and appends one immutable event in one transaction.

- [ ] **Step 6: Register only in `nextMigrations` and run database proof**

Run: `AKADEMATE_RUNTIME=next pnpm --filter @akademate/tenant-admin payload migrate`

Run: `pnpm --filter @akademate/tenant-admin verify:next-finance-db`

Expected: PASS.

- [ ] **Step 7: Commit request persistence**

```bash
git add apps/tenant-admin/migrations apps/tenant-admin/migrations-next apps/tenant-admin/migrations/index.ts apps/tenant-admin/scripts/verify-next-finance-db.ts
git commit -m "feat(finance): persist custom integration requests"
```

### Task 2: Implement request validation, API, and status truth

**Files:**

- Create: `apps/tenant-admin/src/lib/finance/finance-integration-request.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-integration-request.test.ts`
- Create: `apps/tenant-admin/src/lib/finance/finance-integration-request-handler.ts`
- Test: `apps/tenant-admin/src/lib/finance/finance-integration-request-handler.test.ts`
- Create: `apps/tenant-admin/app/api/next/finance/integration-requests/route.ts`
- Create: `apps/tenant-admin/app/api/next/finance/integration-requests/[id]/route.ts`

**Interfaces:**

- Consumes: canonical request contract, authenticated Next transaction, and transition function.
- Produces: `parseFinanceIntegrationRequest`, list/create/detail/cancel/transition handlers.

- [ ] **Step 1: Write failing validation tests**

Reject unsupported URL protocols, loopback/private hosts in submitted provider URLs, invalid country/currency, duplicate capabilities, context shorter than 20 or longer than 4000 characters, zero entities/campuses, and writeback with an empty capability set.

- [ ] **Step 2: Run validation tests**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-integration-request.test.ts`

Expected: FAIL because the parser does not exist.

- [ ] **Step 3: Implement the Zod schema and normalized parser**

Trim strings, lowercase hostnames, uppercase ISO codes, deduplicate/sort capabilities, and preserve the human context text without rendering it as HTML.

- [ ] **Step 4: Write handler authorization and state tests**

Test runtime disabled=404, anonymous=401, teacher=403, tenant admin create/list=201/200, cross-tenant detail=404, invalid transition=409, non-superadmin internal transition=403, and allowed cancellation=200.

- [ ] **Step 5: Implement handlers and route wiring**

All successful responses are redacted tenant-owned projections. Internal notes, provider credentials, and commercial estimates are not accepted by the tenant endpoint.

- [ ] **Step 6: Run handlers and typecheck**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run src/lib/finance/finance-integration-request*.test.ts`

Run: `pnpm --filter @akademate/tenant-admin typecheck:next-offers`

Expected: PASS.

- [ ] **Step 7: Commit API workflow**

```bash
git add apps/tenant-admin/src/lib/finance/finance-integration-request* apps/tenant-admin/app/api/next/finance/integration-requests
git commit -m "feat(finance): add governed integration request API"
```

### Task 3: Build the authenticated request form and request timeline

**Files:**

- Create: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/solicitar/page.tsx`
- Create: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/solicitar/IntegrationRequestForm.tsx`
- Test: `apps/tenant-admin/tests/components/finance-integration-request-form.test.tsx`
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones/page.tsx`

**Interfaces:**

- Consumes: integration request API and shared Shadcn/Akademate primitives.
- Produces: provider discovery form, confirmation, and status timeline.

- [ ] **Step 1: Write component tests**

Test keyboard navigation, labels, inline errors, conditional writeback explanation, single-submit locking, success ID, failed retry, and server status timeline. Assert no promise date, price, or feasibility text is fabricated.

- [ ] **Step 2: Run the component test and confirm missing UI**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run tests/components/finance-integration-request-form.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the form**

Use `Input`, `Select`, `Checkbox`, `Textarea`, `Button`, `Alert`, and `Progress`. The submit label is `Send integration request`; the confirmation states `Request received` and shows the immutable request ID.

- [ ] **Step 4: Implement status timeline**

Render only persisted events using the canonical status labels. `Declined` includes a reason category but no internal notes. `Available` links to the connector catalogue only when the provider registry also marks it available.

- [ ] **Step 5: Run component and UI audit**

Run: `pnpm --filter @akademate/tenant-admin exec vitest run tests/components/finance-integration-request-form.test.tsx`

Run: `pnpm audit:ui`

Expected: PASS.

- [ ] **Step 6: Commit tenant experience**

```bash
git add 'apps/tenant-admin/app/(app)/(dashboard)/finanzas/integraciones' apps/tenant-admin/tests/components/finance-integration-request-form.test.tsx
git commit -m "feat(finance): add custom integration request experience"
```

### Task 4: Create the claim-safe public connector registry

**Execution boundary:** Create a fresh isolated public-web worktree after verifying the branch and deployment manifest that serve `akademate.com`.

**Files:**

- Create: `apps/web/lib/integration-availability.ts`
- Test: `apps/web/lib/integration-availability.test.ts`
- Create: `apps/web/public/brand-sources/finance-connectors.md`

**Interfaces:**

- Consumes: manually reviewed release evidence references.
- Produces: the only public source for connector names, status, CTA, logo, and proof metadata.

```ts
export type PublicConnectorStatus = 'coming-soon' | 'available' | 'custom-request'

export type PublicFinanceConnector = {
  id: 'holded' | 'xero' | 'quickbooks' | 'custom'
  name: string
  status: PublicConnectorStatus
  logoId: 'holded' | 'xero' | 'quickbooks' | null
  proofSha: string | null
  availableSince: string | null
  ctaPath: string
}
```

- [ ] **Step 1: Write failing registry invariants**

```ts
for (const connector of financeConnectors) {
  if (connector.status === 'available') {
    assert.match(connector.proofSha ?? '', /^[0-9a-f]{40}$/)
    assert.match(connector.availableSince ?? '', /^\d{4}-\d{2}-\d{2}$/)
  } else {
    assert.equal(connector.proofSha, null)
    assert.equal(connector.availableSince, null)
  }
}
```

- [ ] **Step 2: Run the test and confirm missing registry**

Run: `pnpm --filter @akademate/web exec vitest run lib/integration-availability.test.ts`

Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Seed truthful initial statuses**

Set Holded, Xero, and QuickBooks to `coming-soon`; set the generic entry to `custom-request`. Use `/contacto?asunto=integracion-contable` for the public request CTA. No connector starts `available` in this plan.

- [ ] **Step 4: Record logo provenance**

For each provider, record official download URL, retrieval date, permitted use context, local path, and checksum. Do not copy a logo from a search result or third-party logo site.

- [ ] **Step 5: Run registry tests**

Run: `pnpm --filter @akademate/web exec vitest run lib/integration-availability.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit registry separately**

```bash
git add apps/web/lib/integration-availability* apps/web/public/brand-sources/finance-connectors.md
git commit -m "feat(web): centralize finance connector availability"
```

### Task 5: Add the public finance connector showcase and pricing boundary

**Files:**

- Create: `apps/web/components/marketing/FinanceConnectorShowcase.tsx`
- Modify: `apps/web/components/marketing/ConnectorLogos.tsx`
- Modify: `apps/web/lib/marketing-content.ts`
- Modify: `apps/web/lib/marketing-content.test.ts`
- Modify: `apps/web/lib/pricing-content.ts`
- Modify: `apps/web/lib/pricing-content.test.ts`
- Modify: `apps/web/lib/pricing-i18n.ts`
- Modify: `apps/web/lib/i18n/marketing-copy.ts`
- Modify: `apps/web/lib/i18n/marketing-copy.test.ts`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/features/page.tsx`
- Modify: `apps/web/app/pricing/page.tsx`
- Modify: `apps/web/app/contacto/page.tsx`

**Interfaces:**

- Consumes: `financeConnectors` registry and localized marketing/pricing content.
- Produces: visual connector section, status labels, pricing extension, and request CTA.

- [ ] **Step 1: Write content tests before changing copy**

Assert Home, Features, and Pricing contain Holded, Xero, QuickBooks, and a request CTA; `coming-soon` providers never use `Available`, `Connect now`, or `Included`; custom integration never uses a fixed delivery promise; English and Spanish expose the same provider IDs and entitlement.

- [ ] **Step 2: Run content tests and confirm failure**

Run: `pnpm --filter @akademate/web exec vitest run lib/integration-availability.test.ts lib/marketing-content.test.ts lib/pricing-content.test.ts lib/i18n/marketing-copy.test.ts`

Expected: FAIL because finance connector content is absent.

- [ ] **Step 3: Implement `FinanceConnectorShowcase`**

Display each provider with official logo, status pill, one-line capability description, and status-dependent CTA. `coming-soon` links to the demo/contact flow; `custom-request` links to the integration request subject. The section must not imply endorsement or certification.

- [ ] **Step 4: Add concise Home and detailed Features content**

Home copy: `Connect accounting to academy operations.`

English detail: `Bring payments, invoices, expenses and reconciliation into one operational view. Holded, Xero and QuickBooks connectors are on the integration roadmap.`

Spanish detail: `Conecta pagos, facturas, gastos y conciliación con la operación de la academia. Los conectores de Holded, Xero y QuickBooks forman parte de la hoja de ruta de integraciones.`

- [ ] **Step 5: Add the pricing extension boundary**

Keep `Accounting, banking and ERP connectors` as `paid-extension` for every base plan. Add notes stating provider subscription/transaction fees and bespoke mapping/migration work are separate. Enterprise includes contracted integration governance, not unlimited custom development.

- [ ] **Step 6: Preserve i18n and contact routing**

The contact page recognizes `asunto=integracion-contable`, preselects the finance integration topic, and sends the same existing server-side lead flow. It does not expose the private recipient email in client code.

- [ ] **Step 7: Run content, typecheck, build, and accessibility tests**

Run: `pnpm --filter @akademate/web exec vitest run lib/integration-availability.test.ts lib/marketing-content.test.ts lib/pricing-content.test.ts lib/i18n/marketing-copy.test.ts`

Run: `pnpm --filter @akademate/web typecheck`

Run: `pnpm --filter @akademate/web build`

Expected: PASS.

- [ ] **Step 8: Commit public content separately**

```bash
git add apps/web
git commit -m "feat(web): present finance integrations with truthful status"
```

### Task 6: Perform public visual, network, and served-artifact gates

**Files:**

- Create: `apps/web/e2e/finance-integrations.spec.ts`

**Interfaces:**

- Consumes: public connector registry and rendered pages.
- Produces: desktop/mobile, i18n, CTA, console, and network evidence.

- [ ] **Step 1: Write Playwright assertions**

At 1440×900 and 390×844, verify Home, Features, Pricing, and Contact in English and Spanish. Check heading hierarchy, logo alt text, status labels, CTA targets, no clipping/overflow, no console error, no failed first-party request, and no analytics/marketing request before consent.

- [ ] **Step 2: Run local public E2E**

Run: `pnpm exec playwright test apps/web/e2e/finance-integrations.spec.ts --project=web-chromium --project=web-mobile`

Expected: PASS.

- [ ] **Step 3: Run three adversarial copy attempts**

Edge: registry contains a provider with a 40-character name and `coming-soon` status.

Fail-closed: an `available` provider lacks `proofSha`; build/test must fail.

Variation: Spanish route `/es/pricing` and English `/pricing` render the same provider status and entitlement.

- [ ] **Step 4: Push only after public-web review**

Record commit SHA and branch; do not deploy from the finance backend worktree.

- [ ] **Step 5: Deploy only with separate public-web authorization**

Deploy the exact public SHA, verify response headers and HTML/JS artifact markers, then rerun the E2E assertions against `https://akademate.com`.

- [ ] **Step 6: Keep initial provider state honest**

After this plan alone, Holded, Xero, and QuickBooks remain `coming-soon`; only the custom request CTA is actionable. Change one provider to `available` only through the matching provider plan Gate 4.

## Definition of Done

- [ ] Authenticated tenants can submit, list, inspect, and cancel allowed integration requests.
- [ ] Status transitions are validated and append-only.
- [ ] Cross-tenant access is denied by forced RLS and handler authorization.
- [ ] Public status comes from one typed registry.
- [ ] `available` is impossible without evidence metadata.
- [ ] Pricing distinguishes paid extensions, provider fees, and bespoke work.
- [ ] English and Spanish are equivalent.
- [ ] Desktop/mobile visual and network gates pass.
- [ ] Public-web deploy, if authorized, is isolated from CEP and the finance backend deploy.

## Provider Graduation Checklist

Use this checklist when Sage Business Cloud Accounting, Zoho Books, A3, Exact Online, or another requested system is considered for native support:

- [ ] Demand evidence is one contracted Enterprise requirement or at least three qualified tenant requests.
- [ ] Provider identity, country coverage, API terms, current version, authentication, scopes, test environment, rate limits, webhook behavior, and certification costs are verified from official sources.
- [ ] Supported resources are mapped to `FinanceCapability` without expanding the canonical contract casually.
- [ ] A provider-specific plan defines exact files, routes, credentials, read-only resources, sync semantics, tests, runbook, rollback, and writeback boundary.
- [ ] The provider adapter passes the foundation's cross-tenant, secret-redaction, disabled-mode, cursor replay, rate-limit, and ambiguous-result tests.
- [ ] Public status stays `custom-request` until the provider plan's sandbox, staging, exact-SHA deployment, and served-artifact gates pass.
- [ ] The native-connector logo is added only after brand provenance and usage rights are recorded.

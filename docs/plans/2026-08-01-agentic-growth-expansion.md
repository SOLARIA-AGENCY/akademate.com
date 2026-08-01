# Agentic operations and measurable academy growth

Date: 2026-08-01

Scope: public `akademate.com` and the isolated Akademate SaaS product lane.

Out of scope: `cepformacion.akademate.com`, its runtime, tenant data, roles, finance, traffic and deployment.

## Decision summary

Akademate adds two connected product cases to the public story and the platform roadmap:

1. **Akademate MCP and agent-assisted operations** — compatible AI clients can query academy context and prepare work through scoped tools. Sensitive actions require human confirmation.
2. **Growth Ads and lead intelligence** — campaign signals from Meta Ads and Google Ads can be reconciled with Akademate leads, applications, enrolments and attendance through a common, freshness-labelled metric contract.

The website is allowed to explain the workflow and show illustrative interfaces. It must not present the providers as a partnership, guarantee that every client is available, promise autonomous decisions, or display synthetic metrics as customer results.

## Goal amendment

The durable Akademate goal now includes:

- a tenant-isolated MCP gateway with role/scoped tools, approval gates, revocation and audit evidence;
- a provider-neutral growth data layer with Meta and Google connectors, idempotent snapshots and attribution from campaign to confirmed academy outcome;
- public product pages that make both workflows understandable through visual, claim-safe examples;
- a test and release contract that proves no cross-tenant access, no pre-consent trackers, no unapproved mutation and no false provider/certification claim.

The persistent goal API is not replaced while the broader programme is active. This document is the public-lane amendment and must be linked from the general operating-system plan.

## Solution Registry

| Approach                                                 | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision                                                              |
| -------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: | --------------------------------------------------------------------- |
| Provider-specific features inside each dashboard         |           6 |               5 |           5 |          7 |          6 | Reject: duplicates authorization and metric semantics                 |
| Shared contracts with provider adapters                  |           9 |               9 |           9 |          7 |          9 | Select: one tenant boundary, one audit model and independent adapters |
| Fully autonomous agent and automatic budget optimisation |           3 |               4 |           6 |          4 |          3 | Reject: high financial, privacy and authorization risk                |

## Case A — Akademate MCP and agent-assisted operations

### Public product promise

> Connect compatible AI clients to the operational context your organisation chooses to share. Ask questions, prepare work and keep approval with the right person.

Safe wording:

- “MCP-compatible clients can query scoped academy context and prepare operational work.”
- “ChatGPT, Claude, Grok and Gemini are provider examples; availability depends on client, tenant configuration and contract.”
- “Every tool call carries tenant, user, role, scope, purpose and approval context.”

Do not use:

- “Your AI agent runs the academy autonomously.”
- “Every agent is supported.”
- “ChatGPT/Claude/Grok/Gemini can change finances, grades, admissions or employment decisions automatically.”
- provider badges that imply partnership, endorsement or certification.

### Architecture

1. **Gateway**: a SaaS-only MCP endpoint resolved by tenant and environment; no CEP hostname or fallback in public code.
2. **Identity**: OAuth/OIDC or signed connection per client; short-lived tokens, audience validation, tenant claim and revocation.
3. **Policy**: deny by default; intersect user RBAC, tenant scope, tool scope, record ownership and purpose.
4. **Tools**:
   - read-only: `academy.search`, `academy.leads.summary`, `academy.campaigns.metrics`, `academy.capacity`, `academy.attendance`;
   - draft: `academy.prepare.follow_up`, `academy.prepare.reminder`, `academy.prepare.report`;
   - mutable: only after explicit approval: `academy.send.message`, `academy.assign.lead`, `academy.create.task`;
   - never autonomous in phase one: payments, refunds, grades, certificates, HR decisions, admissions decisions, permission changes or budget changes.
5. **Audit**: immutable tool request, policy decision, data scope, model/client, approval actor, result and redacted error.
6. **Safety**: prompt-injection boundary, output filtering, PII minimisation, rate limits, tool timeouts, replay/idempotency keys and emergency revocation.

### Data contracts

- `agent_connections`: `tenant_id`, provider, client id, environment, status, scopes, created/revoked timestamps.
- `agent_tool_calls`: `tenant_id`, connection, actor, tool, input hash, requested scope, policy result, approval id, status and audit id.
- `agent_approvals`: immutable action preview, approver, expiry, confirmation token and execution result.
- `agent_audit_events`: append-only event with redacted payload and retention policy.

### Delivery phases

| Phase | Outcome                                                       | Gate                                                   |
| ----- | ------------------------------------------------------------- | ------------------------------------------------------ |
| A0    | Remove CEP defaults; define capability states and public copy | static search shows no public MCP path to CEP          |
| A1    | Read-only MCP tools for one non-CEP tenant                    | tenant/RLS, role and revocation adversarial tests      |
| A2    | Draft tools with approval preview                             | no execution without approval; replay is idempotent    |
| A3    | Limited mutations for messages/tasks                          | audit evidence, rate limit and rollback/revoke drill   |
| A4    | Add more clients/providers                                    | contract tests per client; no provider guarantee in UI |

## Case B — Growth Ads and measurable lead capture

### Public product promise

> Connect campaign signals to leads, applications and confirmed participation so academy teams can see which journeys deserve attention.

Safe wording:

- “Meta Ads and Google Ads can be configured as independent campaign connectors.”
- “Metrics show the provider snapshot, its last sync and Akademate-confirmed outcomes separately.”
- “Automations can prepare routing, reminders and alerts according to rules your team approves.”

Do not use:

- “Real-time data”, “perfect attribution”, “guaranteed ROI”, “automatic optimisation” or “all campaigns connected”.
- a Meta/Google logo as proof of partnership;
- a synthetic CTR, spend or lead count presented as a customer result.

### Architecture

1. **Credential boundary**: encrypted tenant-owned account connection; no shared token, account id or agency filter.
2. **Adapters**: Meta Marketing API and Google Ads API implement the same internal adapter contract but retain provider-specific semantics.
3. **Sync**: idempotent jobs fetch snapshots with `provider`, `account_id`, `campaign_id`, period, currency, timezone, fetched_at and source cursor.
4. **Attribution**: UTM/click ids and consent-aware events link campaign → landing/form → lead → application/reservation → payment/enrolment → attendance. Unknown or duplicated events remain explicitly unresolved.
5. **Dashboard**: campaign table, trend, funnel, spend, reach, impressions, clicks, CTR, CPC, leads, applications, enrolments, attendance and cost-per-result. Every tile shows source and freshness.
6. **Automation**: configurable rules produce a preview and approval request; phase one never changes budgets or publishes ads.

### Data contracts

- `ad_accounts`: `tenant_id`, provider, external account id, credential reference, currency, timezone, status, last sync.
- `ad_metric_snapshots`: immutable provider rows, idempotency key and source freshness.
- `lead_touchpoints`: consent status, UTM, click id, campaign/ad/adset ids and redacted event metadata.
- `conversion_events`: internal event type, source, entity id, event time, dedupe key and reconciliation status.
- `growth_automation_rules` / `growth_automation_runs`: rule version, preview, approval, execution status and audit link.

### Delivery phases

| Phase | Outcome                                         | Gate                                                                |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------- |
| G0    | Claim-safe web example and metric vocabulary    | no fake metrics or tracker code                                     |
| G1    | Meta read-only snapshots for one non-CEP tenant | token/account isolation, idempotent replay, currency/timezone tests |
| G2    | Funnel reconciliation to leads/enrolments       | duplicate, missing-consent and unresolved attribution tests         |
| G3    | Google Ads adapter                              | independent credentials and provider contract tests                 |
| G4    | Rule previews and approved notifications        | no budget mutation, rate limit and audit evidence                   |
| G5    | Optional provider actions                       | separate approval, rollback and commercial authorization            |

## Public web composition

The `/features` hub and the Home product story add one section with two tabs:

1. **AI workspace & MCP**: conversation, tenant/role/scope badge, three action states (`Read`, `Draft`, `Confirm`) and provider wordmarks marked “compatible clients / roadmap”.
2. **Campaign intelligence**: editorial mobile ad image, compact campaign dashboard, funnel and a “Last sync” label. Metrics are labelled `Illustrative example` until backed by a verified tenant dataset.

The section exposes `/features#mcp-agentic-operations` and `/features#growth-ads-intelligence` as direct anchor destinations, uses the generated asset `akademate-growth-ads-mobile-v1.jpg`, and keeps the source code for the dashboard deterministic and accessible.

## Verification contract

### MCP adversarial tests

- tenant A cannot query or mutate tenant B;
- read-only tools reject write scopes and mutable tools reject missing approval;
- revoked connection, expired token, wrong audience and unknown tool fail closed;
- prompt-injected records cannot change tool policy;
- duplicate approval cannot execute twice;
- audit row contains actor, tenant, scope, decision and redacted result.

### Ads adversarial tests

- repeated sync does not duplicate snapshots or conversions;
- invalid token/account/provider fails closed without exposing secrets;
- CTR, CPC and cost-per-lead handle zero denominators;
- currency, timezone, date range and provider differences are preserved;
- UTM, click id, lead and enrolment reconciliation handles duplicates, missing consent and unknown campaigns;
- dashboard always renders freshness and source labels.

### Public web tests

- both tabs and anchor links are keyboard accessible and responsive;
- provider names/logos are marked compatible/configurable/roadmap, never “certified” or “powered by”;
- illustrative numbers include the example label;
- no GA4/GTM/Meta Pixel/marketing request occurs before consent;
- every image loads on desktop and mobile; no horizontal overflow; console has no errors.

## Explicit non-goals

- no CEP deployment or configuration;
- no shared credentials or production customer data;
- no autonomous admissions, grading, finance, HR or advertising-budget decisions;
- no public certification, official seal or provider partnership claim;
- no native Mac, iPhone or iPad binary in this increment; the public roadmap preview is documented separately and remains clearly `Coming soon`.


# AKADEMATE

## Cloudflare-Native Autonomous Transformation

### Master Execution Prompt, Human Bootstrap Guide and Migration Contract

**Version:** 2.0  
**Date:** 29 August 2026  
**Legal owner during incubation:** BRIK64 Inc.  
**Product:** Akademate  
**Cloud SaaS target:** Cloudflare-native, serverless-first, multi-tenant  
**Enterprise target:** Canonical domain with independent On-Premise adapters  
**Execution model:** human-guided bootstrap, evidence-driven migration, progressive autonomous operation

> **ACTIVATION DIRECTIVE:** Ingest this entire document as the authoritative execution contract. Do not begin by implementing code. Start in `PHASE 0 - PREFLIGHT, EVIDENCE AND ARCHITECTURE AUDIT`, follow the first-response contract in Section 20, and guide the human owner through one manual action at a time. Never request passwords, recovery codes, private keys, access tokens, bank data or other secrets through chat.

![BRIK64 Product Genesis and Akademate product boundary](akd_prompt_assets/01_product_genesis.png)

---PAGEBREAK---

# Navigation map

1. How to use this document
2. Mission and definition of success
3. Source authority and verification rules
4. Frozen architectural and corporate decisions
5. BRIK64 Product Genesis Standard
6. Human bootstrap wizard
7. Target Cloudflare-native architecture
8. Multi-tenant data architecture
9. Canonical domain and dual-target adapters
10. External integrations, live classes and video
11. Platform Ops control plane
12. AutonomousOps and Paperclip concepts
13. Graph Loop architecture
14. CI/CD and self-healing development
15. Security, privacy and compliance
16. Observability, analytics and cost control
17. Current-state architecture audit
18. Migration strategy
19. Implementation roadmap
20. Required deliverables and first-response contract
21. Operational appendices and acceptance gates

The canonical ingestible version is the accompanying Markdown file. The DOCX version is optimized for human review, governance and execution planning.

---PAGEBREAK---

# 0. How to use this document

This document is not a generic architecture essay. It is a reusable execution prompt for an advanced engineering agent that must:

1. guide the owner through the institutional and cloud bootstrap;
2. audit the Akademate SaaS implementation that already exists;
3. verify current provider capabilities against official documentation;
4. design and implement the migration to a Cloudflare-native architecture;
5. preserve the complete Akademate business domain;
6. maintain a shared canonical codebase for Cloud SaaS and Enterprise On-Premise;
7. build the Platform Ops and AutonomousOps control planes;
8. automate provisioning, CI/CD, observability, incident response and routine operations;
9. progressively reduce human intervention without removing governance;
10. maintain continuous exit and transfer readiness.

## 0.1 Required operating mode

The receiving agent must operate in four successive modes:

| Mode | Purpose | Default authority |
|---|---|---|
| `GUIDED_BOOTSTRAP` | Create institutional identities, product accounts and recovery controls | Human performs provider actions; agent guides and records evidence |
| `ARCHITECTURE_AUDIT` | Inspect repositories, infrastructure, schemas and deployments | Read-only unless explicitly approved |
| `SUPERVISED_TRANSFORMATION` | Implement adapters, migrations, IaC and tests | Non-production writes may be automated; production is gated by risk |
| `AUTONOMOUS_OPERATIONS` | Operate Graph Loops, incident remediation and routine lifecycle | Constrained by AgentGrants, budgets, policy and R0-R4 controls |

## 0.2 One-step human protocol

When a manual action is required, provide exactly one actionable step using this structure:

```text
STEP ID:
PHASE:
OBJECTIVE:
WHY THIS IS REQUIRED:
PREREQUISITES:
EXACT HUMAN ACTION:
VALUES TO ENTER:
DO NOT SHARE:
EVIDENCE TO RECORD:
HOW I WILL VERIFY:
ROLLBACK / RECOVERY:
RESPONSE EXPECTED FROM HUMAN: DONE / BLOCKED / CORRECTION
```

Do not send the owner a list of forty simultaneous actions. The owner confirms each step, the agent verifies the result, updates the Evidence Ledger and only then advances.

## 0.3 No-secret protocol

The agent must never ask the owner to paste:

- passwords;
- MFA recovery codes;
- TOTP seeds;
- hardware-key backup codes;
- API tokens;
- OAuth client secrets;
- bank information;
- Stripe secret keys;
- private keys;
- service-account JSON;
- encryption keys;
- full tax documents.

The agent may ask for non-secret identifiers such as account IDs, project IDs, resource names, environment names, verification status and 1Password item references.

# 1. Mission and definition of success

Act as a combined:

- Principal SaaS Architect;
- Cloudflare Platform Architect;
- Distributed Systems Engineer;
- Staff Full-Stack Engineer;
- Data Migration Architect;
- Security Architect;
- SRE / DevOps Lead;
- Identity and Access Architect;
- AI Agent Systems Architect;
- Technical Program Manager.

Your mission is to transform the existing Akademate SaaS into a secure, scalable and progressively autonomous platform without a big-bang rewrite.

## 1.1 Final target

The final state must satisfy all of the following:

- Akademate Cloud SaaS runs on a Cloudflare-native, serverless-first architecture.
- Tenant isolation is primarily physical/logical through D1-per-tenant rather than a single pooled database with RLS.
- A Control D1 stores global product and tenant-routing metadata.
- R2 stores files and durable exports; Stream stores adaptive video.
- Queues and Workflows handle asynchronous and durable operations.
- Durable Objects handle coordination, realtime state, locks and selected agent runtime state.
- Platform Ops is a first-class internal product.
- Paperclip is not a mandatory external dependency; its useful organizational concepts are implemented natively in Akademate AutonomousOps.
- Agents use approved Control API/MCP tools and never receive direct production database, root cloud or vault access.
- GitHub-based CI/CD supports preview, staging, progressive production rollout, verification and rollback.
- Akademate scales from 10 to 10,000 tenants without a fundamental architecture rewrite.
- CEP Formación and other Enterprise On-Premise deployments remain supported through PostgreSQL/Docker adapters using the same canonical domain.
- The product can be transferred, spun out or sold without migrating unrelated BRIK64 assets.

## 1.2 Success is not “everything deployed”

Success requires evidence that the system is:

- correct;
- isolated by tenant;
- recoverable;
- observable;
- cost-measured;
- governed;
- portable;
- testable;
- transferable;
- operable by constrained agents.

# 2. Source authority and verification rules

Use this source priority when facts conflict:

1. explicit owner-approved decisions in this document and subsequent written corrections;
2. the actual current Akademate repository, schema, infrastructure and provider accounts;
3. current official provider documentation;
4. approved ADRs and migration records;
5. architectural inference;
6. assumptions, which must always be labelled.

## 2.1 Official documentation requirement

Before relying on a provider capability, verify current official documentation for:

- Cloudflare;
- Google Workspace / Google Cloud;
- GitHub;
- Microsoft Entra / Graph / Teams;
- Zoom;
- 1Password;
- Stripe or another payment provider;
- any AI provider used.

For each material capability, record:

```text
provider
capability
official source
consulted_at
status: GA | BETA | OPEN_BETA | DEPRECATED | UNKNOWN
limits
pricing relevance
fallback
```

A beta capability may be evaluated and used experimentally, but must not become a critical dependency without a documented fallback and owner approval.

## 2.2 Decision request

When official documentation or the current codebase contradicts this target, do not silently improvise. Return:

```text
DECISION REQUEST
- Intended architecture
- Verified constraint
- Affected modules
- Option A
- Option B
- Recommendation
- Cost/risk/lock-in impact
- Required owner decision
```

# 3. Frozen architectural and corporate decisions

Treat the following as approved unless the owner explicitly changes them.

## 3.1 Corporate structure

- BRIK64 Inc. is the current legal owner and product foundry.
- Akademate is an independently isolated product perimeter incubated by BRIK64 Inc.
- BRIK64 Inc. may initially fund, contract and invoice Akademate.
- Akademate must remain technically separable for spin-out, sale or independent financing.

## 3.2 Shared corporate layer

The following may remain shared initially:

- legal entity;
- Mercury and corporate banking;
- Stripe legal merchant account, with Akademate-specific products, customers and reporting;
- accounting and tax filing;
- corporate 1Password organization, with strictly separated Akademate vaults;
- Ramp, Stable, Quo or equivalent corporate services where appropriate.

## 3.3 Isolated product layer

Akademate must have its own:

- `akademate.com` domain and product identity;
- Google Workspace;
- Google Cloud organization/projects;
- Cloudflare account;
- GitHub organization/repositories;
- Cloudflare Startup Program application;
- D1, R2, Stream, Queues, Workflows, Durable Objects and Workers resources;
- CI/CD environments;
- observability and audit data;
- developer applications for Google, Zoom and Microsoft;
- AI provider projects or scoped API credentials;
- product-specific 1Password vaults;
- asset register and transfer package;
- product P&L/cost attribution.

## 3.4 Technical decisions

- Cloud SaaS target: Cloudflare-native and serverless-first.
- Enterprise On-Premise target: PostgreSQL/Docker-compatible adapters.
- One canonical domain and one primary codebase.
- No n8n dependency in the core product.
- No Paperclip runtime dependency in the target architecture.
- No direct agent access to D1, R2, provider root APIs or 1Password vaults.
- Google Meet, Zoom and Microsoft Teams are Bring Your Own Provider integrations for each tenant.
- Cloudflare Stream is the preferred recorded-video/VOD layer.
- An Akademate Live classroom may be evaluated later without changing the ClassSession domain.
- Root identities are institutional, not named after a founder or employee.
- R3 and R4 actions require human governance.

# 4. BRIK64 Product Genesis Standard

Formalize and implement a reusable `BRIK64 Product Genesis Standard` so future products can be created with the same separability.

## 4.1 Product perimeter model

```text
BRIK64 Inc.
  shared corporate layer
    legal
    banking
    accounting
    incubation

  product perimeter: Akademate
    identity
    domain
    cloud accounts
    source code
    data
    integrations
    CI/CD
    observability
    secrets
    product economics
    transfer package
```

## 4.2 Required asset register

Create an Akademate Asset Register containing at minimum:

| Asset class | Required fields |
|---|---|
| Domain | registrar, account owner, renewal, DNS provider, recovery identity |
| Workspace | organization/domain, super-admin identities, recovery controls |
| Cloudflare | account ID, zones, plans, products, service identities, billing owner |
| GCP | organization ID, projects, OAuth apps, billing profile |
| GitHub | organization, owners, repositories, apps, environments |
| 1Password | vault name, custody owner, recovery procedure, transfer class |
| Payments | legal merchant, Akademate products/prices, webhook apps, cost center |
| Data | D1 inventory, R2 inventory, Stream inventory, retention and export |
| Integrations | Google, Zoom, Microsoft, AI, email and support apps |
| IP | repositories, documentation, trademarks, designs and licenses |
| Contracts | customer agreements, vendor agreements, DPAs and subprocessors |

## 4.3 Continuous exit readiness

Maintain an executable transfer runbook covering:

- transfer of domain and DNS;
- transfer of Cloudflare account/resources;
- transfer of Google Workspace and GCP organization;
- transfer of GitHub organization;
- migration of product-specific 1Password vaults;
- rotation of all recovery identities and service credentials;
- export of D1/R2/Stream inventories and customer data;
- reassignment of Stripe products/customers or legal merchant migration;
- customer contract assignment;
- IP and documentation transfer;
- revocation of BRIK64 personnel and agents.

# 5. Human bootstrap wizard

![Guided bootstrap progression](akd_prompt_assets/04_bootstrap_wizard.png)

The agent must inspect what already exists before asking the human to create anything. Each bootstrap step has state:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
VERIFIED
NOT_REQUIRED
SUPERSEDED
```

## 5.1 Bootstrap sequence

### B-000 - Preflight and existing-asset inventory

Determine whether the following already exist and who controls them:

- `akademate.com`;
- Google Workspace;
- GCP organization/projects;
- Cloudflare account/zone;
- GitHub organization;
- 1Password vaults;
- Stripe Akademate products;
- current Akademate repositories and deployments;
- existing OAuth apps;
- current customer data and production traffic.

Do not create duplicates.

### B-010 - Domain and registrant custody

Ensure the domain is owned by the correct corporate entity, auto-renewed, protected with MFA/passkeys and recoverable independently of Cloudflare.

### B-020 - Independent Google Workspace

Create an independent Workspace for `akademate.com` if one does not exist.

Institutional identities should include, subject to plan and licensing optimization:

```text
admin@akademate.com
recovery@akademate.com or equivalent break-glass identity
security@akademate.com
billing@akademate.com
legal@akademate.com
support@akademate.com
infra@akademate.com
```

Use groups/aliases where possible. Do not use a person’s name as the technical root.

Require:

- passkeys or hardware security keys for privileged humans;
- at least two independent recovery mechanisms;
- no routine use of the break-glass identity;
- documented super-admin ownership;
- controlled billing contact.

### B-030 - Product-specific 1Password perimeter

Within the corporate 1Password organization, create segregated vaults:

```text
AKADEMATE - ROOT & RECOVERY
AKADEMATE - CLOUDFLARE
AKADEMATE - GITHUB
AKADEMATE - GOOGLE
AKADEMATE - MICROSOFT
AKADEMATE - ZOOM
AKADEMATE - AI PROVIDERS
AKADEMATE - PAYMENTS
AKADEMATE - PRODUCTION
AKADEMATE - DISASTER RECOVERY
```

The agent may refer to vault/item names, but must never request secret values.

### B-040 - Independent Cloudflare account

Create a Cloudflare account dedicated to Akademate, not a zone mixed into a BRIK64 or CEP account.

Configure:

- institutional administrators;
- billing owner;
- MFA/passkeys;
- scoped service tokens;
- no Global API Key in CI;
- audit and recovery contacts;
- DNS zone;
- DNSSEC when appropriate;
- initial security baseline;
- Workers billing plan only when required by the verified architecture.

### B-050 - Cloudflare for Startups / Workers Launchpad

Verify current official requirements and application routes. Prepare and submit an application describing Akademate as a Cloudflare-native multi-tenant education SaaS built by BRIK64 Inc.

Classify eligibility as:

```text
CONFIRMED
LIKELY
REQUIRES_REVIEW
NOT_ELIGIBLE
```

Do not promise credits before written acceptance.

### B-060 - Independent GitHub organization

Create or verify an Akademate GitHub organization.

Require:

- at least two recoverable owners when feasible;
- organization-owned repositories;
- branch protection/rulesets;
- required checks;
- Dependabot or equivalent dependency monitoring;
- secret scanning;
- CODEOWNERS;
- separate `development`, `staging` and `production` environments;
- GitHub Apps or scoped tokens rather than shared accounts.

### B-070 - Independent Google Cloud organization/projects

Use the Akademate Workspace/Cloud Identity perimeter. Create only what is necessary for Google OAuth and Workspace APIs.

Candidate projects:

```text
akademate-bootstrap
akademate-integrations-dev
akademate-integrations-staging
akademate-integrations-prod
```

Verify whether a different current Google best practice is preferable.

### B-080 - Developer applications

Create product-owned applications when required:

- Google OAuth consent / Calendar / Meet / Drive APIs;
- Zoom OAuth application;
- Microsoft Entra application registration / Graph / Teams;
- payment provider webhook application;
- AI provider projects or scoped service identities.

### B-090 - Product finance segmentation

Inside BRIK64 Inc. financial systems, define:

- Akademate product codes;
- Stripe products/prices;
- customer metadata;
- cost center;
- MRR/ARR attribution;
- infrastructure, AI, video, email and payment-fee attribution;
- future merchant-transfer plan.

### B-100 - Cloud environments

Provision isolated `development`, `staging` and `production` resource bindings. No production resource may be reused by staging.

### B-110 - Evidence and recovery check

Confirm that every root account, resource ID, billing owner, recovery path and product boundary is recorded in the Evidence Ledger and Asset Register.

# 6. Target Cloudflare-native architecture

![Cloudflare-native target architecture](akd_prompt_assets/02_cloudflare_native.png)

## 6.1 Architectural planes

### Edge and Trust Plane

- DNS;
- CDN/cache;
- TLS;
- DDoS mitigation;
- WAF;
- rate limiting;
- Turnstile where appropriate;
- Cloudflare Access / Zero Trust for internal surfaces;
- SaaS custom hostname provisioning.

### Product Runtime Plane

- Workers for public web, application APIs, tenant admin, Campus and Platform Ops;
- preview/staging/production deployments;
- authenticated Control API;
- MCP facade over approved tools.

### Data Plane

- Control D1;
- D1-per-tenant;
- R2;
- Durable Objects;
- Stream;
- Analytics Engine or approved equivalent.

### Async and Orchestration Plane

- Queues;
- Workflows;
- Cron Triggers;
- Durable Object alarms where justified.

### Autonomous Runtime Plane

- Cloudflare Agents SDK where mature and appropriate;
- Workflows for durable agent plans;
- Containers for filesystem-heavy, build or browser tasks;
- AI Gateway;
- Workers AI and external providers.

### Operations and Trust Plane

- Platform Ops;
- AutonomousOps;
- Workers observability;
- security events;
- independent uptime probe;
- audit and evidence ledgers.

## 6.2 Service classification contract

The receiving agent must produce and maintain a verified table:

| Service | Classification | Use in Akademate | Maturity | Fallback |
|---|---|---|---|---|
| Workers | CORE | web/API/control plane | verify | documented |
| D1 | CORE candidate | control + tenant DBs | verify | Postgres adapter for On-Prem |
| R2 | CORE | files/exports/backups | verify | S3 adapter |
| Queues | CORE | event delivery | verify | provider interface |
| Workflows | CORE candidate | durable orchestration | verify | application workflow engine |
| Durable Objects | RECOMMENDED | coordination/realtime/locks | verify | application-level alternative |
| Stream | RECOMMENDED | VOD/recordings | verify | MediaProvider |
| AI Gateway | RECOMMENDED | model routing/telemetry | verify | direct providers |
| Agents SDK | CONDITIONAL | agent runtime | verify | Workflow/Worker runtime |
| Containers | CONDITIONAL | coding/build/heavy tasks | verify | external runner |
| Email Service | CONDITIONAL | transactional email | verify | EmailProvider fallback |
| Workers for Platforms | FUTURE | tenant extensions | verify | not required for core |
| Calls/Realtime video | FUTURE | Akademate Live | verify | Meet/Zoom/Teams |

Do not use a Cloudflare product simply because it exists.

# 7. Multi-tenant data architecture

![Tenant data routing and projection model](akd_prompt_assets/03_tenant_data_routing.png)

## 7.1 Control D1

The Control database owns global platform information, not tenant academic records.

Candidate domains:

```text
organizations
accounts
tenants
tenant lifecycle
tenant database mapping
plans and platform subscriptions
global identities
tenant membership index
service identities
integration directory
platform configuration
platform audit
agent registry
cost and quota configuration
```

## 7.2 D1 per tenant

Each tenant database owns its operational data:

```text
people projections and tenant relationships
students
instructors
courses
course runs
phases
modules
sessions
rooms/resources/venues
enrollments
commercial agreements
attendance
learning
assessments
academic records
credentials
products/orders
billing/invoices/payments
communications
documents metadata
tenant audit
```

Exact table names must follow the audited canonical domain, not this illustrative list blindly.

## 7.3 TenantDataContext

Create a mandatory application abstraction:

```text
request
 -> authenticate actor
 -> resolve account/tenant
 -> authorize ActionContext
 -> resolve tenant database binding
 -> start D1 session with appropriate consistency
 -> execute domain operation
 -> emit domain events
 -> persist audit/evidence
```

Business modules must never select a tenant database directly.

## 7.4 Consistency policy

The Data Access Layer must centralize:

- D1 Sessions API usage;
- bookmarks;
- read-your-own-writes requirements;
- primary-first reads for sensitive operations;
- unconstrained reads for safe read-heavy paths;
- idempotency;
- transaction/batch behavior;
- retry behavior;
- query timeouts;
- query/index performance metrics.

## 7.5 No global live joins

Platform Ops must not query every tenant database synchronously to render global dashboards. Use:

```text
tenant domain event
 -> Queue
 -> global projection / Analytics Engine
 -> Platform Ops query
```

## 7.6 Large-tenant strategy

Document thresholds and a supported split strategy for tenants that approach database limits:

```text
tenant_core
tenant_academic
tenant_finance
tenant_archive_<period>
```

Do not split prematurely. The TenantDataContext must allow a future TenantDataShardMap without changing business services.

## 7.7 R2 object model

Design keys and policies such as:

```text
/{environment}/{tenantId}/{domain}/{resourceId}/{version}/{filename}
```

Implement:

- signed upload/download;
- object metadata;
- tenant authorization;
- content-type and size validation;
- malware scanning workflow;
- retention and legal hold;
- versioning/lifecycle when available;
- export manifests;
- quotas and metering;
- deletion and anonymization policies.

## 7.8 Durable Objects

Use Durable Objects only for problems requiring coordinated state, for example:

- realtime classroom state;
- presence;
- locks;
- booking coordination;
- agent execution state;
- live notifications;
- collaborative editing;
- rate/state machines.

Do not turn Durable Objects into a second general-purpose database layer.

## 7.9 Backup and provider-exit

Implement:

- D1 Time Travel/PITR according to current capability;
- scheduled tenant exports;
- Control DB exports;
- schema manifests;
- R2 object inventory;
- Stream asset inventory;
- encrypted external cold copy when approved;
- restore test automation;
- tenant-level and whole-platform recovery runbooks.

# 8. Canonical domain and dual-target adapters

![Shared domain with Cloud SaaS and Enterprise On-Premise adapters](akd_prompt_assets/05_dual_target_adapters.png)

The migration must preserve the full Akademate domain already designed and implemented.

## 8.1 Canonical bounded contexts

At minimum:

- Organization and Tenancy;
- Identity and People;
- Academic;
- Scheduling;
- Learning;
- Attendance and Access;
- Assessment and Exams;
- Academic Records and Credentials;
- Commerce;
- Tenant Finance;
- SaaS Platform Billing;
- Communication;
- Integrations;
- Web/CMS;
- Platform Ops;
- AutonomousOps;
- Trust, Privacy and Compliance.

## 8.2 Adapter architecture

Business logic depends on ports/interfaces, not provider SDKs.

Examples:

```text
TenantDataStore
ObjectStorageProvider
EventPublisher
WorkflowRuntime
RealtimeCoordinator
VideoProvider
VideoConferenceProvider
EmailProvider
PaymentProvider
AccountingProvider
IdentityProvider
AIProvider
ObservabilityProvider
```

Implementations may include:

```text
D1TenantDataStore
PostgresTenantDataStore
R2ObjectStorage
S3ObjectStorage
CloudflareQueuePublisher
OnPremOutboxPublisher
CloudflareWorkflowRuntime
OnPremWorkerRuntime
```

## 8.3 Cloud SaaS and Enterprise On-Premise

Cloud SaaS uses Cloudflare-native adapters.

Enterprise On-Premise, including CEP Formación, may use:

- PostgreSQL;
- Docker/Compose or Kubernetes;
- S3-compatible storage;
- dedicated workers;
- enterprise-specific observability.

The two targets share domain contracts, policies, event schemas and tests.

## 8.4 Payload CMS audit

Do not delete or retain Payload by assumption. Audit:

- which collections are purely editorial;
- which collections improperly own transactional logic;
- runtime compatibility with Cloudflare;
- database dependencies;
- migration cost;
- whether a Container is temporarily necessary;
- whether editorial functionality should be replaced with a D1/R2-native content service.

The academic, finance, scheduling, assessment and tenant-security domains must not depend on CMS hooks.

## 8.5 Next.js/frontend audit

Verify current official Cloudflare support and the actual Akademate build. Determine:

- Worker/Pages/OpenNext compatibility;
- Node API dependencies;
- filesystem assumptions;
- image optimization;
- middleware/runtime constraints;
- preview deployment strategy;
- bundle and CPU budgets.

# 9. External integrations, live classes and video

## 9.1 Tenant-owned integrations

Each tenant connects its own provider account where the service naturally belongs to the tenant.

Initial conference providers:

```text
GOOGLE_MEET
ZOOM
MICROSOFT_TEAMS
AKADEMATE_LIVE - future
```

## 9.2 TenantIntegration model

Include:

```text
tenantId
providerType
providerAccountId
connectionMode
scopes
encryptedTokenReference
connectedBy
status
health
expiresAt
providerUserMappings
dataProcessingMetadata
```

## 9.3 Google Workspace

Akademate owns its OAuth application, but each tenant authorizes its own Workspace account. Use Calendar/Meet/Drive artifacts only according to current official APIs and granted scopes.

## 9.4 Zoom

Use a product-owned OAuth application. The tenant authorizes its own Zoom account. Do not centralize tenant meetings under Akademate’s own paid account.

## 9.5 Microsoft Teams

Use a product-owned Microsoft Entra application and Microsoft Graph/Teams integrations. Each tenant authorizes its own Microsoft 365 tenant/account.

## 9.6 Academic source of truth

Meet, Zoom and Teams provide conferencing and evidence. Akademate remains the academic system of record.

Record:

```text
scheduled start/end
actual start/end
participant join/leave/reconnect
effective attendance minutes
teacher presence
meeting artifacts
recording availability
provider identifiers
```

Convert provider activity to AttendanceEvidence, then apply Akademate policy to produce AttendanceRecord.

## 9.7 Recorded video

Use Cloudflare Stream for adaptive VOD when verified as suitable.

`VideoAsset` should include:

```text
tenantId
course/lesson/classSession reference
provider/source
streamUid
duration
status
accessPolicy
retentionPolicy
caption/transcript references
storage/delivery metering
```

Playback must use short-lived, authorized access. Track stored and delivered minutes for quotas and cost attribution.

## 9.8 Recording ingestion

For recordings from Meet, Zoom or Teams:

```text
recording ready
 -> provider webhook/poll
 -> Workflow
 -> validation
 -> ingest into Stream
 -> link to ClassSession/Lesson
 -> publish according to policy
 -> source retention/deletion policy
```

## 9.9 Transactional email and agent communication

Separate:

- human corporate mail: Google Workspace;
- transactional mail: EmailProvider abstraction;
- agent/customer communication: Akademate Communication API or support hub.

Evaluate Cloudflare Email Service only after verifying maturity, limits and deliverability. Maintain fallback providers.

# 10. Platform Ops control plane

Create `ops.akademate.com` as a first-class internal application protected by strong identity and Cloudflare Access where appropriate.

## 10.1 Required capabilities

- Organizations and tenants;
- tenant lifecycle: lead, trial, onboarding, active, at-risk, cancellation, churned, archived;
- users and memberships;
- subscriptions, plans and entitlements;
- usage, quotas and cost attribution;
- billing and payment status;
- integrations and OAuth health;
- deployment/environment status;
- security events and audit;
- incidents;
- support activity;
- AI agents, budgets and approvals;
- video/storage/email usage;
- business KPIs;
- data export/DSAR/offboarding workflows;
- asset and evidence status.

## 10.2 No direct database console

Platform Ops must call authenticated Application Services/Control API. It must not become a generic SQL console or bypass domain invariants.

## 10.3 Tenant health

Create a configurable health score using signals such as:

- login and active-user trends;
- feature adoption;
- support load;
- billing status;
- integration health;
- error rate;
- onboarding completion;
- storage/usage thresholds;
- customer engagement.

# 11. AutonomousOps: internalizing Paperclip concepts

Do not deploy Paperclip as a permanent required application unless a later ADR explicitly chooses it. Reuse its useful conceptual model inside Akademate.

## 11.1 Native entities

Candidate entities:

```text
AIOrganization
Agent
AgentIdentity
AgentRole
AgentGrant
AgentManager
Goal
Task
TaskDependency
Budget
Approval
Heartbeat
AgentRun
AgentAction
AgentMemory
AgentPolicy
AgentSchedule
AgentAudit
```

## 11.2 Initial agent roles

- Architecture Agent;
- Bootstrap Guide Agent;
- Cloudflare Platform Agent;
- Data Migration Agent;
- Developer Agent;
- SRE Agent;
- Security Agent;
- Customer Success Agent;
- Support Agent;
- Billing/Cost Agent;
- Compliance Agent;
- Documentation Agent.

Do not activate all agents at once. Begin with read-only and non-production roles.

## 11.3 Agent runtime allocation

Determine the appropriate runtime per task:

| Work type | Preferred runtime candidate |
|---|---|
| Read/analysis/API calls | Worker / Agent runtime |
| Durable multi-step plan | Workflow |
| Coordination/realtime state | Durable Object |
| Git clone/build/test/browser/filesystem | Container or approved external runner |
| Scheduled wake-up | Cron / Workflow / DO alarm |
| Model access | AI Gateway + approved provider |

## 11.4 Risk model R0-R4

| Risk | Examples | Default authority |
|---|---|---|
| R0 | public/read-only analysis | automatic |
| R1 | low-risk, reversible, non-production | automatic within grant |
| R2 | operational production change with safe rollback | policy-controlled; may be automatic |
| R3 | auth, billing, schema, grades, security-sensitive, financial | human approval required |
| R4 | destructive, legal, fiscal, root IAM, tenant deletion | reinforced or dual human approval |

Risk is determined by code/policy, not by the model’s own claim.

## 11.5 Agent tool access

Agents receive semantic tools such as:

```text
tenant.inspect
tenant.health
integration.inspect
incident.create
deployment.inspect
deployment.prepareRollback
support.inspect
billing.inspect
usage.inspect
migration.prepare
github.createIssue
github.openPR
```

They do not receive:

- root provider tokens;
- unrestricted D1 SQL;
- 1Password vault access;
- direct Stripe secret access;
- production shell;
- arbitrary egress.

# 12. Graph Loop architecture

![Autonomous Graph Loop](akd_prompt_assets/06_graph_loop.png)

All autonomous processes follow:

```text
OBSERVE
 -> INTERPRET
 -> PLAN
 -> POLICY / APPROVAL
 -> EXECUTE
 -> VERIFY
 -> RECORD
 -> LEARN
```

## 12.1 Incident loop

```text
telemetry anomaly
 -> incident
 -> SRE/Security analysis
 -> proposed remediation
 -> risk classification
 -> execute or request approval
 -> verify health
 -> update runbook
 -> close with evidence
```

## 12.2 Customer-success loop

```text
usage decline / health risk
 -> analyze support, adoption and billing
 -> propose contact/intervention
 -> execute approved communication
 -> monitor adoption
 -> update health score
```

## 12.3 Billing loop

```text
payment failure
 -> verify webhook/idempotency
 -> retry policy
 -> customer communication
 -> lifecycle/entitlement policy
 -> verify resolution
```

## 12.4 Security loop

```text
security event
 -> classify
 -> contain within grant
 -> escalate R3/R4
 -> remediate
 -> rotate/revoke if approved
 -> verify
 -> audit
```

## 12.5 Capacity/cost loop

```text
usage and cost signals
 -> forecast
 -> detect abnormal tenant/service cost
 -> optimize/quota/plan recommendation
 -> verify service quality and margin
```

# 13. CI/CD and self-healing development

![Autonomous CI/CD and remediation loop](akd_prompt_assets/07_cicd_loop.png)

## 13.1 Environments

Maintain separate:

- local development;
- ephemeral previews;
- development integration environment if required;
- staging;
- production.

Each environment has isolated D1 databases, R2 namespaces/buckets, Queues, Workflows, Durable Object namespaces, secrets and OAuth redirect configuration.

## 13.2 Pipeline

```text
Issue or approved task
 -> branch
 -> PR
 -> lint/typecheck
 -> unit/domain tests
 -> integration tests
 -> D1 migration tests
 -> tenant-isolation tests
 -> security/supply-chain checks
 -> preview deployment
 -> staging migration
 -> E2E/synthetic tenants
 -> risk classification
 -> approval gate if required
 -> progressive production rollout
 -> telemetry observation
 -> automatic rollback or completion
```

## 13.3 Self-healing flow

```text
Cloudflare/Sentry/error signal
 -> incident de-duplication
 -> GitHub Issue
 -> SRE/Developer Agent
 -> reproduction and patch
 -> PR
 -> CI
 -> staging
 -> regression verification
 -> R0-R4 decision
 -> production rollout
 -> telemetry verifies disappearance
 -> issue closes with evidence
```

Use GitHub Issues and PRs as the engineering source of truth unless a separate system is justified later. Do not add Linear by default.

## 13.4 Database migration safety

Require:

- versioned migrations;
- forward-compatible application deployments;
- migration dry-run on synthetic tenant databases;
- tenant-by-tenant resumability;
- idempotency;
- checkpointing;
- reconciliation counts/hashes;
- rollback or compensating plan;
- no destructive migration in the same release as its first application dependency removal.

# 14. Security, privacy and compliance

## 14.1 Core security principles

- deny by default;
- least privilege;
- zero trust;
- institutional ownership;
- service identities;
- short-lived/scoped credentials where possible;
- defence in depth;
- immutable or tamper-evident audit for critical actions;
- no security dependence on frontend hiding;
- no agent self-escalation.

## 14.2 Required threat model

Cover at minimum:

- cross-tenant data leakage;
- account takeover;
- OAuth token compromise;
- webhook forgery/replay;
- D1 injection and authorization bypass;
- R2 URL leakage;
- malicious upload;
- XSS/CSRF/SSRF;
- dependency and CI supply-chain compromise;
- Cloudflare token over-privilege;
- GitHub App compromise;
- prompt injection and tool poisoning;
- confused deputy;
- agent data exfiltration;
- billing manipulation;
- destructive autonomous action;
- custom-domain abuse;
- denial of wallet / cost exhaustion;
- OAuth tenant confusion;
- secret leakage in logs/traces.

## 14.3 Secret lifecycle

```text
CREATE
 -> STORE IN 1PASSWORD ROOT CUSTODY
 -> DISTRIBUTE MINIMAL RUNTIME REFERENCE
 -> USE
 -> ROTATE
 -> REVOKE
 -> AUDIT
```

Use Cloudflare Secrets Store or environment-scoped secrets only as runtime stores. GitHub receives only deployment-specific credentials.

## 14.4 Privacy and compliance

Preserve and implement:

- ProcessingPurpose and LegalBasis;
- consent versioning;
- retention policies;
- DSAR access/export/rectification/restriction/erasure;
- legal retention;
- subprocessor registry;
- international-transfer metadata;
- breach workflow;
- DPIA hooks;
- AIUseCase registry;
- human oversight for impactful educational decisions;
- audit of models, providers, versions and agent actions.

Do not present this architecture document as legal advice. Mark items requiring counsel.

# 15. Observability, business analytics and cost control

## 15.1 Cloudflare-native baseline

First evaluate native capabilities for:

- Worker logs;
- traces;
- request/error/CPU metrics;
- D1 metrics;
- Queue/Workflow metrics;
- R2 metrics;
- Stream analytics;
- AI Gateway telemetry;
- Security Analytics;
- Analytics Engine.

## 15.2 External tools

Classify Sentry, Prometheus, Grafana, Loki, PostHog, Metabase and Uptime Kuma as:

```text
REQUIRED NOW
OPTIONAL NOW
FUTURE
UNNECESSARY
```

Do not introduce them by habit. Maintain OpenTelemetry-compatible correlation where practical.

## 15.3 Correlation context

Use:

```text
requestId
correlationId
traceId
actorId
agentId
tenantId
environment
releaseId
workflowId
```

Do not send unnecessary personal data to telemetry.

## 15.4 Independent uptime

Maintain at least one uptime/health check outside the Cloudflare failure domain for critical public endpoints.

## 15.5 Cost model

Build an updateable model for 10, 100, 1,000 and 10,000 tenants using real usage drivers:

- MAU;
- Worker requests and CPU;
- D1 reads/writes/storage;
- R2 storage and operations;
- Stream stored/delivered minutes;
- Queue operations;
- Workflow steps;
- Durable Object usage;
- Container compute;
- AI provider consumption;
- email;
- payment fees.

Provide Base, Average and Heavy tenant profiles. Tenant count alone is not a capacity metric.

# 16. Current-state architecture audit

The first engineering action is read-only discovery.

## 16.1 Repository audit

Inspect:

- monorepo layout;
- applications and packages;
- Next.js/BFF boundaries;
- Payload collections and hooks;
- Drizzle schemas and migrations;
- PostgreSQL-specific features;
- auth/session/RBAC/RLS;
- tenant model;
- account/group model;
- Campus;
- Finance;
- scheduling;
- assessments/credentials;
- object storage;
- background jobs;
- APIs/MCP;
- CI/CD;
- tests;
- Docker/deployments;
- observability;
- feature flags/capabilities.

## 16.2 Data audit

Inventory:

- tenant counts;
- tenant sizes;
- tables, indexes, extensions, triggers and constraints;
- data quality/inconsistencies;
- global vs tenant-scoped tables;
- cross-tenant queries;
- PII and regulated data;
- binary/file storage;
- event/audit history;
- archived/deprecated data;
- migration blockers.

## 16.3 Mapping contract

Classify every major component:

| State | Meaning |
|---|---|
| `KEEP` | already satisfies target |
| `EVOLVE` | preserve and extend |
| `SPLIT` | one component mixes bounded contexts |
| `ADAPT` | domain is correct; infrastructure adapter changes |
| `REPLACE` | current implementation cannot meet target |
| `DEPRECATE` | retain temporarily with removal plan |
| `NEW` | missing capability |

Do not create `TenantV2`, `StudentNew`, `CourseRun2` or parallel systems unless an ADR proves it necessary.

## 16.4 Audit output

The agent must produce:

- current architecture diagram;
- current data model;
- target mapping;
- dependency graph;
- gap analysis;
- migration risk register;
- compatibility matrix;
- sequence and rollback plan;
- estimated work by phase;
- list of human decisions still required.

# 17. Migration strategy

## 17.1 No big-bang rewrite

Use incremental, tenant-aware migration.

Candidate sequence:

```text
1. Introduce ports/adapters around current PostgreSQL repositories.
2. Add canonical event and ActionContext boundaries.
3. Build Cloudflare environment foundations.
4. Implement Control D1 and Tenant Resolver.
5. Implement D1TenantDataStore for one bounded context.
6. Run contract tests against Postgres and D1 adapters.
7. Provision synthetic tenants.
8. Migrate low-risk read models.
9. Migrate transactional contexts tenant by tenant.
10. Reconcile data and business invariants.
11. Cut over selected tenants behind feature flags/routing.
12. Observe and rollback if required.
13. Complete migration and retire legacy paths only after evidence.
```

## 17.2 PostgreSQL-specific audit

Identify and redesign:

- RLS;
- PostgreSQL extensions;
- JSONB-specific queries;
- triggers/stored procedures;
- advisory locks;
- partial/expression indexes;
- enum types;
- sequence assumptions;
- cross-schema joins;
- transaction isolation assumptions;
- bulk import patterns.

## 17.3 Data migration tooling

Use official D1 APIs/tools where appropriate and create idempotent orchestration that supports:

- per-tenant extraction;
- transformation;
- schema versioning;
- chunking;
- retry;
- checkpointing;
- validation;
- reconciliation;
- cutover marker;
- rollback/restore.

## 17.4 Cutover policy

No tenant is migrated without:

- current backup/export;
- validation of target schema;
- successful contract tests;
- record counts and financial reconciliation;
- file/object manifest validation;
- support/runbook readiness;
- rollback window;
- owner-approved risk classification.

# 18. Implementation roadmap

Each phase must include objective, dependencies, human actions, agent actions, IaC, schema changes, tests, security gate, rollback, evidence and exit criteria.

## Phase 0 - Preflight, evidence and audit

- load this prompt;
- inspect accessible sources;
- build Bootstrap State and Asset Register;
- perform current-state architecture audit;
- no production writes.

## Phase 1 - Product identity and custody

- domain;
- independent Workspace;
- institutional identities;
- MFA/passkeys;
- product vaults;
- recovery and asset register.

## Phase 2 - Cloudflare product perimeter

- independent account;
- zone/security baseline;
- service identities/tokens;
- Startup Program application;
- product billing ownership.

## Phase 3 - GitHub and delivery governance

- organization/repositories;
- branch protection;
- environments;
- secret handling;
- CI skeleton;
- ADR and documentation structure.

## Phase 4 - Cloudflare DEV/STAGING/PROD foundation

- Workers;
- D1 environments;
- R2;
- Queues;
- Workflows;
- Durable Object namespaces;
- Secrets;
- Access;
- observability baseline.

## Phase 5 - Data abstraction and Control Plane foundation

- TenantDataContext;
- Control D1;
- tenant resolver;
- service identities;
- ActionContext;
- event contracts;
- evidence/audit foundation.

## Phase 6 - D1 tenant provisioning

- create database;
- apply schema;
- assign mapping;
- seed policy/configuration;
- create storage namespace;
- verify and activate;
- offboarding/delete safeguards.

## Phase 7 - Canonical domain adapter migration

Migrate bounded contexts incrementally and maintain Postgres adapter parity for Enterprise.

## Phase 8 - Platform Ops

Implement tenant lifecycle, health, usage, integration health, deployment, security, billing and agent management.

## Phase 9 - External integrations

Implement tenant-owned Google, Zoom and Microsoft connections plus payment/email/accounting adapters according to priority.

## Phase 10 - Campus media

Implement R2 content, Stream VOD, signed playback, recording ingestion and usage metering.

## Phase 11 - AutonomousOps foundation

Implement agent identities, grants, budgets, tasks, approvals, runs, audit and constrained tools.

## Phase 12 - Autonomous CI/CD

Connect incident signals, GitHub Issues/PRs, preview/staging tests, risk classification and progressive deployment.

## Phase 13 - Graph Loops

Activate incident, security, customer-success, billing and cost/capacity loops incrementally.

## Phase 14 - Scale and resilience validation

Load tests, tenant isolation, large-tenant split path, backups/restore, provider exit, cost model and operational drills.

## Phase 15 - Production cutover

Migrate selected tenants, observe, expand, reconcile, retire legacy only after proven stability.

# 19. Required deliverable package

The receiving agent must create and maintain a repository package similar to:

```text
docs/
  architecture/
    master-architecture.md
    current-state.md
    target-state.md
    diagrams/
  bootstrap/
    human-guide.md
    bootstrap-state.yaml
    evidence-ledger.md
  adrs/
    ADR-001-...
  migration/
    postgres-to-d1.md
    tenant-cutover-runbook.md
    reconciliation.md
  security/
    threat-model.md
    agent-security.md
    oauth-security.md
  operations/
    graph-loops.md
    incident-runbook.md
    backup-restore.md
    provider-exit.md
  integrations/
    google.md
    zoom.md
    microsoft.md
    video-stream.md
  costs/
    cost-model.md
  transfer/
    asset-register.md
    exit-package.md

infra/
  cloudflare/
  github/
  environments/

schemas/
  control-d1/
  tenant-d1/
  events/

runbooks/
  deployment/
  incident/
  migration/
  recovery/
```

## 19.1 Mandatory documents

1. Master Architecture Specification.
2. Human Bootstrap Guide.
3. Current-State Audit.
4. Gap and Migration Matrix.
5. Cloudflare Resource Manifest.
6. Tenant Data Architecture.
7. D1 Migration Plan.
8. CI/CD Specification.
9. AutonomousOps Specification.
10. MCP/Control API Tool Matrix.
11. Security Threat Model.
12. Cost Model.
13. Evidence Ledger.
14. Asset Register.
15. Exit/Transfer Runbook.
16. ADR set.
17. Test and Acceptance Matrix.

# 20. First-response contract for the receiving agent

The first response after ingesting this document must not contain implementation code. It must use this exact structure:

```text
AKADEMATE TRANSFORMATION CONTROL

MODE: GUIDED_BOOTSTRAP / ARCHITECTURE_AUDIT
CURRENT PHASE: PHASE 0
WRITE AUTHORITY: READ-ONLY

1. Canonical decisions loaded
2. Information already available to me
3. Sources/accounts/repositories I can inspect automatically
4. Unknowns that materially affect the plan
5. Current Bootstrap State summary
6. Current Audit State summary
7. The single next human action, if one is required
8. What I will do automatically after that action
9. Evidence that will be recorded
10. Explicit confirmation that no secrets should be pasted into chat
```

If repository or provider access is available through tools, inspect read-only data before asking the human for details that can be discovered automatically.

# Appendix A. Human step template

```yaml
step_id: B-000
phase: PHASE_0
status: NOT_STARTED
objective: ""
why: ""
prerequisites: []
human_action: []
values_to_enter: []
do_not_share: []
evidence_required: []
verification: []
rollback: []
next_step: null
```

# Appendix B. Bootstrap Evidence Ledger

```yaml
evidence_id: EVD-000001
step_id: B-000
status: VERIFIED
recorded_at: ""
actor_type: HUMAN | AGENT | SERVICE
actor_id: ""
provider: ""
resource_type: ""
resource_id: ""
environment: CORPORATE | DEV | STAGING | PROD
evidence_reference: "1password-item-or-safe-document-reference"
contains_secret: false
verification_method: ""
notes: ""
next_action: ""
```

# Appendix C. Decision request template

```text
DECISION REQUEST ID:
SUBJECT:
CURRENT TARGET:
VERIFIED CONSTRAINT:
AFFECTED DOMAINS:
OPTION A:
OPTION B:
OPTION C:
RECOMMENDATION:
SECURITY IMPACT:
COST IMPACT:
LOCK-IN / PORTABILITY IMPACT:
MIGRATION IMPACT:
OWNER DECISION REQUIRED:
```

# Appendix D. AgentGrant template

```yaml
agent_id: ""
role: ""
owner_account_id: ""
tenant_scope: []
allowed_tools: []
denied_tools: []
risk_ceiling: R1
max_runtime_seconds: 0
max_tool_calls: 0
max_records_read: 0
max_records_modified: 0
max_financial_amount: 0
max_ai_cost_daily: 0
max_ai_cost_monthly: 0
requires_human_approval_for: []
expires_at: ""
kill_switch_group: ""
```

# Appendix E. Initial ADR catalogue

Create at least:

- ADR-001: BRIK64 Product Genesis Standard.
- ADR-002: Independent Akademate Workspace, GCP, Cloudflare and GitHub perimeters.
- ADR-003: Cloudflare-native SaaS target.
- ADR-004: Canonical domain with deployment adapters.
- ADR-005: Control D1 plus D1-per-tenant.
- ADR-006: TenantDataContext and no arbitrary DB selection.
- ADR-007: R2 for object storage.
- ADR-008: Durable Objects only for coordination/realtime.
- ADR-009: Queues and Workflows for asynchronous/durable execution.
- ADR-010: No n8n core dependency.
- ADR-011: Paperclip concepts internalized in AutonomousOps.
- ADR-012: Agent tools instead of direct infrastructure/data access.
- ADR-013: R0-R4 governance.
- ADR-014: GitHub Issues/PRs as engineering system of record.
- ADR-015: Bring Your Own Google/Zoom/Teams.
- ADR-016: Cloudflare Stream for recorded video.
- ADR-017: Separate tenant finance from Akademate SaaS billing.
- ADR-018: Continuous exit readiness.
- ADR-019: Cloudflare-native observability first, external tools by demonstrated need.
- ADR-020: Incremental migration and dual-adapter contract tests.

# Appendix F. Acceptance gates

The transformation cannot be declared complete unless:

- institutional ownership and recovery are verified;
- no critical asset depends on one person’s private account;
- Cloudflare/GitHub/GCP/Workspace product perimeters are isolated;
- tenant isolation tests pass;
- D1 session/consistency policy is centralized;
- no cross-tenant live dashboard joins are required;
- R2/Stream access is tenant-authorized;
- Google/Zoom/Teams are tenant-owned integrations;
- Cloud and On-Prem adapters pass the same domain contract tests;
- migrations are resumable and reconciled;
- backup and restore drills pass;
- CI/CD supports preview, staging, progressive production and rollback;
- agents cannot exceed grants or risk ceiling;
- R3/R4 actions require the configured human approval;
- Platform Ops provides tenant, usage, incident, security and agent visibility;
- the cost model is instrumented;
- the Asset Register and Exit Package are current;
- all deprecated legacy paths have an approved removal record.

# Final execution principle

The agent must optimize for:

```text
simplicity
security
tenant isolation
automation
serverless scalability
cost efficiency
maintainability
auditability
portability
exit readiness
```

Avoid:

```text
server sprawl
microservice sprawl
tool sprawl
shared product accounts
manual recurring cloud operations
big-bang migrations
agent root access
provider-specific business logic
unverified beta dependencies
```

For every component answer:

```text
WHAT
WHY
OWNER
WHERE
HOW CREATED
HOW ACCESSED
HOW SECURED
HOW MONITORED
HOW BACKED UP
HOW TESTED
HOW IT FAILS
HOW IT RECOVERS
HOW IT SCALES
HOW IT IS TRANSFERRED
```

When an operation is dangerous:

```text
PREVIEW -> VALIDATE -> APPROVE -> COMMIT -> VERIFY -> RECORD
```

**END OF MASTER EXECUTION PROMPT**

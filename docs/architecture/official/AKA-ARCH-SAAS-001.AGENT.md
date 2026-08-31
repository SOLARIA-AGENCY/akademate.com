# AKA-ARCH-SAAS-001 agent implementation prompt

You are implementing AKADEMATE on Cloudflare from architecture description AKA-ARCH-SAAS-001 (BRIK64 Inc.).

## Ingest order

1. Read `AKA-ARCH-SAAS-001.ingest.json` in this folder. It is the canonical machine form: codes, ADRs, units, queues, objects, and every figure as Mermaid source.
2. Read each `diagrams/*.mmd` named in that file. PNG files are renderings of those sources.
3. Read this file for the execution contract.
4. Read `AKA-ARCH-SAAS-001.html` or the PDF text layer (sheets 12–12.5 and Appendix A) when you need the human layout.

Appendix A of the PDF holds the Mermaid as selectable text. Figure sheets name the source path on the page (example: FIG-01 · diagrams/01-dos-planos.mmd).

## Execution contract

Apply every ADR-C1 through ADR-C10.

Open tenant data only through TenantDataContext(tenantId). The context yields the D1 binding and the object / R2 prefix for that tenant.

Ship seven Workers: akademate-app, akademate-control, akademate-integrations, akademate-media, akademate-events, akademate-automation, akademate-agents.

Public path: Internet → DNS / Cloudflare for SaaS hostname → WAF → Turnstile → akademate-app.
Ops path: Cloudflare Access → akademate-control.

V1 D1: one Control D1 plus tenant shards. Binding budget about 5 000 per Worker. Shard map lives in Control D1.

R2: product buckets with tenant prefixes `tenants/{tenantId}/`.

Queues by function, each with a DLQ. Consumer akademate-events. Workflows by class, new instance per run, on akademate-automation.

Durable Objects: TenantCoordinator `tenant-{id}`, IdempotencyLock, RateLimiter, PresenceRoom, AgentSession. D1 remains the academic system of record.

Video: upload via akademate-media to Cloudflare Stream. Playback with a short-lived signed token bound to identity and tenant.

Agents: Policy Engine R0 observe, R1 suggest, R2 reversible change, R3 sensitive change, R4 irreversible change. Mutating work goes through Control API. Models leave through AI Gateway gateways akademate-production and akademate-staging. Metadata: tenantId, agentId, operation, riskClass, feature.

Identity: Akademate Identity for academy staff, teachers, learners. Cloudflare Access for Platform Ops.

Billing: BRIK64 Stripe / Mercury for the platform. Tenant learner payments in a separate box.

Plane 1 is the Cloudflare interior. Plane 2 is one institutional account set for the product.

Marketing host akademate.com and www run on the marketing Worker (OpenNext) on Cloudflare. Tenant runtime is akademate-app.

## Implementation sequence

1. Map UNIT-* to Wrangler projects and routes.
2. Create CONTROL_D1 and the first shard bindings. Implement TenantDataContext and the shard map.
3. Create R2 buckets and prefix helpers.
4. Create the six functional queues and their DLQs. Implement the outbox with the domain write.
5. Implement the five Durable Object classes.
6. Wire Stream signed playback on akademate-media.
7. Stand Akademate Identity and Access in front of the two paths.
8. Stand Policy Engine R0–R4 and AI Gateway.
9. Split Platform Billing from learner payments.
10. Emit traces, logs and Analytics Engine datasets named in section 8.4.

## Done when

Every figure in ingest.json has a matching `.mmd`. Every UNIT, Q, DO and ADR-C code is present in code or Wrangler config. Tenant isolation is enforced by TenantDataContext. Agents cannot mutate except through Control API at the stated R-class.


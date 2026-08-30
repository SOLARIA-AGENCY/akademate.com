# Threat model (Cloud SaaS)

Fecha: 2026-08-29. Complementa Master Spec §19.

| Amenaza | Superficie | Mitigación | Test |
| --- | --- | --- | --- |
| Cross-tenant leakage | D1 shard / wrong mapping | TenantDataContext; tenant_id defense in depth; nunca tenantId del body como autoridad | isolation P0 |
| Binding al shard equivocado | Control mapping | mapping signed in session; audit | provision tests |
| D1 injection | SQL | solo `prepare().bind()` | contract tests |
| Static binding sprawl | wrangler | shards V1, no 10k bindings | IaC review |
| payload-token en host campus | cookies | host-only campus_session (Master §5.5) | middleware tests |
| OAuth token theft | TenantIntegration | encrypt at rest; rotate; short refresh | secret scan |
| Webhook forgery | Stripe/Zoom/Meet | signature + idempotency | unit |
| R2 signed URL replay | objects | TTL corto, method+key scoped | |
| Stream token leak | VOD | signed playback, tenant quota | |
| Agent prompt injection | MCP/tools | trust labels, no SQL, R0 default | agent tests |
| Tool poisoning | MCP servers | allowlist, no third-party MCP prod V1 | |
| Confused deputy | Control API | grant + tenant scope server-side | |
| Billing manipulation | Platform Billing | R3 approval, idempotent webhooks | |
| Account takeover | Workspace/CF | passkeys, Access, break-glass dual | |
| SSRF desde agent | Browser/fetch | egress allowlist | |
| Malware upload | R2 | MIME/size V1; async scan later | |
| XSS/CSRF | web | httpOnly cookies, sameSite, CSRF on cookie auth | |
| Supply chain | GitHub Actions | pin versions, scanning | CI |
| DDoS / stuffing | edge | WAF, rate limit, Turnstile | |
| Email Sending beta outage | mail | EmailProvider dual | |
| Secrets Store beta | runtime | Worker secrets GA fallback | |

Deny by default. Least privilege. Scoped CF tokens. Audit append-only para R3/R4.

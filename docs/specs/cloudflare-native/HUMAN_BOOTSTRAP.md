# Human bootstrap guide (uno a uno)

IDs canónicos del prompt v2.0: **B-000 … B-110**. Guía activa: [docs/bootstrap/human-guide.md](../../bootstrap/human-guide.md). Estado: [docs/bootstrap/bootstrap-state.yaml](../../bootstrap/bootstrap-state.yaml).

El agente no pide 40 cosas a la vez. El humano responde `DONE` / `BLOCKED` / `CORRECTION`.

Secretos: nunca en chat ni git. Solo IDs de recurso en el [evidence ledger](./EVIDENCE_LEDGER.md).

## B-000 — Preflight (activo)

Inventariar lo que ya existe. No crear Workspace, cuentas ni DNS. Ver mensaje del agente (plantilla STEP).

## B-010 — Domain and registrant custody

Dominio a nombre de la entidad correcta, auto-renew, MFA en el registrar, recuperación independiente de Cloudflare.

## B-020 — Google Workspace Akademate (antes STEP 001)

Qué: Workspace propio, dominio `akademate.com` (si el DNS ya está en Cloudflare, no mover zona hasta B-040 coordinado).  
Cuentas: `admin@`, `recovery@` o break-glass, `security@`, `billing@`, `legal@`, `support@`, `infra@`. MFA/passkeys en admin.  
No: reutilizar Workspace BRIK64; no usar Gmail personal como superadmin permanente.

## B-030 — 1Password vaults AKADEMATE-* (antes STEP 002)

Diez vaults del spec. Owner: grupo Akademate. Break-glass: 2 humanos en ROOT & RECOVERY. Evidencia: nombres de vault, no ítems.

## B-040 — Cloudflare account de producto (antes STEP 003)

Cuenta **Akademate**, no mezclada con CEP u otros productos. Hoy el marketing corre en cuenta **NAZCAMEDIA** (`522997f4f57193b06db3286d8d6f2778`): no crear zona duplicada ni mover DNS sin DECISION REQUEST.  
API token: scoped, no Global. Evidencia: account id, zone id.

## B-050 — Cloudflare for Startups / Launchpad (antes STEP 004)

Elegibilidad: **REQUIRES_REVIEW**. No tratar créditos como CONFIRMED.

## B-060 — GitHub perimeter (antes STEP 005)

Hoy el repo está en `SOLARIA-AGENCY/akademate.com`. B-060 aísla org de producto; no clonar el repo a ciegas.

## B-070 — GCP Akademate (antes STEP 006)

Solo OAuth/Calendar/Meet/Drive. Proyectos candidatos `akademate-bootstrap`, `akademate-integrations-{dev,staging,prod}`.

## B-080 — Microsoft + Zoom + Google developer apps (antes STEP 007)

Apps OAuth de plataforma. Los tenants conectan sus cuentas (BYO).

## B-090 — Product finance segmentation

Códigos Stripe, cost center, P&L Akademate dentro de BRIK64 Inc.

## B-100 — Cloud environments

DEV / STAGING / PROD aislados. Staging no reutiliza recursos de producción.

## B-110 — Evidence and recovery check

Asset register + ledger completos. STOP. No D1 prod ni cutover.

## A / B / C / D

| Clase | Ejemplos |
| --- | --- |
| A Humano debe | Workspace, CF account, pago, MFA, T&Cs, OAuth apps, R3/R4, Startup apply, legal |
| B Agente puede | IaC wrangler, tests, docs, PRs, seeds sintéticos, audit de repo |
| C Agente prepara, humano confirma | tokens, DNS records, Access policies, D1 create en staging |
| D Automatizar post-bootstrap | provision tenant, deploys, backups, metering, R0/R1 agents |

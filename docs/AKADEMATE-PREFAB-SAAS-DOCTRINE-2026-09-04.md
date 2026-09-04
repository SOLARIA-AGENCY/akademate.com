# Akademate · Prefab SaaS Doctrine

**Sealed:** 2026-09-04 · Commander Jyrian / Carlos J. Pérez López  
**Status:** Canon product doctrine (commercial + delivery). Complements, does not replace, `AKADEMATE-MASTER-ARCHITECTURE` and `docs/ARCHITECTURE.md`.  
**Owner:** ECO-Ω (Chief) · Implementation: AKADEMATE AUDIT-Ω → GROK BUILD AKADEMATE

---

## 1. Analogy (housing → SaaS)

| Housing | Akademate |
|---|---|
| Artisan / custom build on site | **CEP Formación** — one vertical, on-prem, MVP that already charges |
| Prefab housing (certified modules, factory QA, assemble on plot) | **Akademate.com** — multi-tenant SaaS, mold first, then vertical × scale |

**Rule:** Do not sell “custom houses” as the SaaS path. Sell **certified prefab**: same Motor, same Kit, different Ensamble.

CEP is the **proof of demand and billing**. Akademate is the **certified plant** that repeats that value without rewriting the house for every client.

---

## 2. Three layers (always)

### 2.1 Motor (certified structure)
- Domain logic, data model, tenancy, auth, billing/cobros, attendance/asistencia, offerings, outbox/idempotency.
- Elevated from the CEP MVP that already charges — not invented in a vacuum.
- **Certified by BRIK64** (ops/finance/legal surface for the engine that bills). No fake tenants, no fake invoices.
- Maps to Master Architecture: Canonical Core + Capability Engine + Commerce/Finance contexts.

### 2.2 Kit (design system before assemble)
- Complete visual + UX system **before** composing a vertical: Gate 0 `DESIGN.md` (or `.agents/DESIGN.md`), tokens of *this* product, cards, empty/loading/error, nav, dashboard shell.
- Catalog order (sealed UI rail): repo primitives → shadcn MCP / official blocks → named Magic UI / Aceternity slug. No invent from air. No slug = unfinished surface.
- Akademate chrome: `@shadcn/sidebar-16` (do not swap for Fluid on Akademate without GO).
- Maps to Master Architecture: design system / template families per Blueprint — content decoupled from layout.

### 2.3 Ensamble (vertical × scale + modules)
- **Vertical** = Academy Blueprint (e.g. Yoga/Wellness, Professional Training, Sports, Languages…) — see Master §3.
- **Scale** = commercial size of the install, not a code fork:

| Scale | Intent (examples) |
|---|---|
| **S** | Small studio / single site — landing + cobros + asistencias (or equivalent minimal closed loop) |
| **M** | Multi-room / multi-staff — adds scheduling depth, roles, reporting |
| **L** | Multi-campus / multi-entity — org model, advanced finance, dedicated ops |

- **Optional modules** (add only when the client pays or a GO names them): native/app, QR check-in, digital signage, videoconference, Campus capability, etc. Never ship the full module tree into an S close.
- Maps to Master Architecture: Plan × Deployment × Blueprint matrix; capability-driven nav.

---

## 3. Order that preserves cash (DoD sequence)

1. **Freeze / certify Motor** that already charges (CEP → Core elevation + BRIK64 certification path).
2. **Kit:** `DESIGN.md` + dashboard/shell kit complete enough to assemble without inventing UI.
3. **One S-scale vertical** end-to-end (recommended first commercial mold: **Yoga / Wellness** — landing + cobros + asistencias).
4. **Modules** only after a paying client or explicit Commander GO.
5. **Do not** open ten verticals before the first paying S client.
6. **InScouter** = second mold later (Sports), after Akademate S proves cash — not parallel plant build.

Falsifier: “We’re building many verticals / full L stack before one S payer” → STOP Prefab path; return to Motor+Kit+one S.

---

## 4. Relation to existing architecture docs

| Doc | Role vs Prefab |
|---|---|
| Master Architecture (Academy OS, Core + Blueprint + capabilities) | **Product/domain mold** — Prefab names Motor/Kit/Ensamble in commercial language over the same Core |
| `docs/ARCHITECTURE.md` (current prod) | **Runtime today:** Hetzner Docker + Postgres (+ Traefik). Keep accurate. Prefab does not rewrite prod topology in this file. |
| Cloudflare / edge | Master lists **optional Cloudflare edge**. Full “serverless-only Cloudflare” is **not** claimed as current production in repo docs as of this seal. If a separate CF serverless target doc exists, link it here and treat it as **infra target**, not as license to ignore Motor/Kit/cash order. |
| CEP on-prem / OVH | Artisan MVP rail (CEP FORMACION OVH-Ω). HOLD merge/SQL/smoke rules stay until Commander lifts them. |

**Hard rule:** Prefab SaaS doctrine does not invent a Cloudflare serverless production state that the architecture docs do not state. Edge/Workers remain as Master/ops roadmap say.

---

## 5. Fleet roles

| Role | Agent | Duty |
|---|---|---|
| Chief | ECO-Ω | Triage → delegate → watch → collect → escalate. Does not become BUILD. |
| SaaS coordinator | AKADEMATE AUDIT-Ω | Owns akademate.com product rail; orders BUILD. |
| Implement | GROK BUILD AKADEMATE | Code only via this rail for Akademate SaaS. |
| CEP vertical | CEP FORMACION OVH-Ω + GROK BUILD OVH-CEP | Artisan/on-prem; feed Motor elevation, not fork SaaS. |
| Finance/legal surface | BRIK64-Ω | Certify billing identity for the Motor. |

External send / charge / publish / company identity: **Commander yes** only.

---

## 6. Prompt pointer

Durable agent prompt: `docs/PREFAB-SAAS-PROMPT.md` (same folder family) and `/workspace/org/approved/prefab-saas/PREFAB-SAAS-PROMPT.md` on the ECO bus.

---

## Change log

- **2026-09-04:** Initial seal from Commander oral doctrine (Prefab housing analogy; Motor/Kit/Ensamble; S/M/L; modules; BRIK64; cash-preserving order; yoga S first; InScouter later).

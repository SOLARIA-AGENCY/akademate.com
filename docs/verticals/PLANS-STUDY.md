# PLANS-STUDY: plan ladder, presets and the accounting play

Input for the plan/pricing decision. Grounded in two research passes (2026-09-07): SaaS pricing benchmarks across academy-software competitors, and the invoicing/accounting landscape (US + Spain). Tag legend: [O] observed with source, [H] hypothesis, [G] product gap, [TV] to validate.

## Decisions locked (commander, 2026-09-07)

1. **No public prices yet.** Keep "Tailored proposal" across ALL tiers (including Solo) on /pricing, landings and proposals. The anchors below are internal guidance for quotes. Revisit trigger: self-serve funnel validated or pilot cohort data.
2. **Solo band approved, then amended (commander, 2026-09-07):** 1 location, 1-3 staff seats, **members UNMETERED**. The ≤100 member cap was removed: a small studio can run 20 clients per class × 7 classes a day and NEEDS that volume to survive — the limiter is the team and the location, never the client count.
3. **Locations model:** Solo = 1 sede. Business = **2 sedes incluidas**. From the 3rd onwards: **per-location add-on**. Enterprise = unlimited.
4. **Accounting connector priority:** **Holded** (ES anchor) → **QuickBooks** (US) → **Xero** (UK/EU).

## 0. Model correction (supersedes part of WIZARD-BRIEF.md)

The wizard does NOT offer free reconfiguration. It is a **preset chooser**:

- **1 preset per vertical** (10 presets). A preset = the vertical's core menu, vocabulary, methodology defaults and its 3 module sets (core / add-on / marketplace). Choosing "Yoga" never presents a module checklist: it presents the yoga preset.
- **The plan gates capacity and versions**, not the preset shape: locations, active-member band, staff seats, and which versions of modules run (e.g. subdomain vs custom domain + CMS; core analytics vs growth dashboard; reminders vs automations).
- **Add-ons extend any plan** (the 8 paid extensions already defined in `apps/web/lib/pricing-content.ts`: access, signage, growth, finance, workforce, resources, agentic, implementation).

Menu formula: `menu = preset.core ∪ purchased_addons`, always capped by plan limits. Plan and preset are orthogonal axes: same preset renders different capability depth per plan, different presets render different menus on the same plan.

## 1. Market benchmarks: how this software is priced

### Metrics in use
- Per **location**: Mindbody ($79 advertised, real $99-699 by tier), Walla ($320/location flat), Glofox (~$300-950/location + setup), Zen Planner (multi-location as paid extension). [O]
- Per **active member** (bands): TeamUp $119 for 0-100 members → $399+; features identical in every tier, only size moves price. [O, goteamup.com/pricing]
- Per **student/lesson/registration** (education-flavored): Teachworks $16.49 + $0.32/student-lesson; DriveScout/Zutobi from $99 incl. 12 students then per-student; Arlo $105-240 per admin/mo by registration volume; Classter €8.50-21.5/student/yr modular. [O]
- Flat tiers by persona: WellnessLiving Starter $69 ("ideal for solo practitioners") / $199 / $349; Arketa Individual $49 (annual) vs Studio custom. [O]

### Price anchors by segment
- Solo/micro: $0-49/mo (Square Appointments free solo; Arketa $49; Teachworks $16.49 + usage; Acuity $16). [O]
- Single-site established: $99-349/mo. [O]
- Multi-site: $320-950/mo **per location**, or custom franchise contract (ClubReady/ABC). No competitor publishes a "2nd location discount". [O]

### What triggers a tier jump (in order of appearance across tier tables)
Custom domain → automations/SMS → branded white-label app → multi-location consolidated dashboard → API/SSO/franchise reporting. [O composite]

### Churn economics
- #1 churn driver at the incumbent: price escalation + hidden fees (real all-in cost runs 20-50% above sticker); then lock-in (Mindbody even gates downgrades behind 30-day notice). Challengers win explicitly on "no contracts, no hidden fees, no cancellation fees". [O, vibefam/makocrm/gymdesk]
- Solo owners pick lower tiers for cash-flow predictability; annual contracts are a conversion barrier for autónomos. [O/H]

## 2. Recommended plan ladder (proposal, pricing numbers are [TV])

| | **Solo** (new tier) | **Business** (existing) | **Enterprise / Group** (existing) |
|---|---|---|---|
| Target | Autónomo / owner-operator: 1 location, 1-3 staff, **members unmetered** | Growing academy: 2nd location or >3 staff | Groups & franchises: 3+ locations, multi-brand |
| Anchor price | **$49/mo** internal anchor (annual -17%, i.e. 2 months free) [TV] | **$149-199/mo** internal anchor [TV] | Custom; internal floor €500+/mo; CEP dedicated precedent €1,200/mo (OVH line, reference only) |
| Preset | Full core of the chosen vertical preset | Full core + upgraded versions | Full core + network versions |
| Locations | 1 | **2 included; 3rd+ per-location add-on** | Unlimited |
| Web | Subdomain, offer pages, bookings | Custom domain + CMS + blog/SEO | Custom domains per brand |
| Growth | Lead capture, reminders | + CRM pipeline, workflow automations, ads connectors | + network attribution |
| Finance | **Built-in invoicing + receivables** (see §3) | + accounting connectors (QBO/Xero/Holded) | + finance APIs, scoped per-location billing |
| Multi-site | - | Consolidated 2-3 site view | Franchise governance, per-location domains/billing |
| Add-ons | Marketplace visible, purchase enabled | Marketplace + ads/growth extensions | Implementation programme |

- Why meter on **locations + staff seats (NOT members)**: a single room physically caps volume (20/class × 7 classes/day ≈ 150-400 realistic active members), so the location already proxies load — metering members would punish exactly the high-volume small studios that need volume to survive, and would read as "we tax your growth". TeamUp's member-banded model is the cautionary example, not the template. Locations remains the industry's cleanest upsell trigger (Mindbody/Walla pattern). This also makes Solo automatically fair for volume-heavy verticals (camps, driving). [O patterns + commander decision]
- Why a **new Solo tier**: the market shows an explicit solo anchor band ($0-49) we currently cannot enter ("Tailored proposal" only); WellnessLiving and Arketa both convert solos with a named tier. [O]
- Anti-churn guardrails (copy + policy): no setup fee at Solo/Business, monthly option, downgrade without traps, published limits. [O churn evidence]
- 2nd location path (locked): Business includes the 2nd sede; from the 3rd onwards each location is a per-location add-on; franchise-scale governance stays Enterprise. This is the cleanest "your academy grew" upsell moment, and no competitor offers it as a friendly mid-step. [H, differentiation bet]

## 3. The accounting play: replace invoicing, connect accounting

Evidence:
- 9 of 10 competitors **connect**; only Arketa built (partial) accounting. TeamUp and DriveScout literally tell users to buy QuickBooks and export CSVs. [O]
- Spain: autónomos self-serve accounting — only 16% hire a gestoría voluntarily, 35% use none, 90% have no employees. Their stack today is a spreadsheet + €10-15/mo invoicing tool (Contasimple free-€16, Quipu €14-25, Holded €15-59). [O, ceat.es, vendor pricing]
- Veri*factu (RD 1007/2023): any ES invoicing software must be a certified SIF (hash chain, signed records, event logs, AEAT registration). Deadlines moved to 1 Jan 2027 (companies) / ~Jul 2028 (autónomos). Building this is a moat US competitors lack — but it is a real compliance build. [O, BOE/AEAT]

Strategy (tiered, matches the plan ladder):
1. **Solo: replace invoicing, never the ledger.** Built-in compliant invoicing + receivables included ("deja de pagar un segundo software"; gestoría receives ordered exports). This is the strongest sales argument for the 1-room yoga autónoma: *bookings, students, payments AND legal invoices in one place, for less than invoicing tool + booking tool combined.* [O evidence / H bet]
2. **Business: connect.** Native sync of payments/invoices/credit notes + GL mapping into the accounting stack, in locked priority order: **1) Holded** (Spain anchor market), **2) QuickBooks** (US), **3) Xero** (UK/EU). Payload pattern proven by Arlo/Teachworks; WellnessLiving even white-labels middleware, so build-or-buy is open. [O]
3. **Enterprise: finance APIs + per-location scoped billing.** Already the canon ("Accounting, banking and ERP connectors" is enterprise-scope/paid-extension in the repo pricing matrix). [O internal]

Product gap flags: native invoicing beyond receipts is [G/TV] (canon has "Invoices" under Finance integrations); accounting connectors are [G] (none built); Veri*factu SIF certification is [G, build decision with deadlines 2027/28]; "Advanced finance and accounting" paid extension already exists in the repo comparison table as the parking spot. [O internal]

## 4. Preset × plan interaction (how the menu changes)

Same yoga preset, three plans:
- Solo: Dashboard · Clases · Socios · Membresías y bonos · Check-in · Pagos y facturas · Web/Reservas · Analíticas (core) · Configuración. 9 items, 1 sede.
- Business: same + automations inside existing items + Analíticas (growth) + multi-sede selector when the 2nd location opens + connectors in Configuración → Integraciones.
- Enterprise: + Marcas/Sedes governance, per-location billing, network reporting.

Nothing is "removed" between plans inside a preset; the plan upgrades **versions** (subdomain→CMS, reminders→automations, core→growth analytics) and **caps** (locations, seats, members). This keeps the "no feature whiplash" promise and makes upsells legible.

## 5. Worked cases

- **Yoga 1-room autónoma (Madrid), e.g. 20 clients × 7 classes/day:** Solo $49/mo (annual $490), members unmetered. Replaces Contasimple (€12) + a booking tool ($69-119) → argument: "one tool, legal invoices included, your gestoría gets clean exports — and we never charge you more for growing your client list." [O anchors]
- **Same academy opens room 2:** Business $149-199/mo. Upsell moment triggered by the 2nd-location cap; optionally adds growth extension later.
- **3 academies + franchise interest:** Enterprise custom, network reporting, per-brand domains. CEP-style dedicated infra stays on the separate dedicated line. [O precedent]

## 6. Display decision impact (decided: keep prices private for now)

Decision 2026-09-07: do NOT publish prices yet; "Tailored proposal" stays everywhere, including the new Solo tier. Implications:
- /pricing and the vertical landings' pricing teaser remain anchor-free (already true; no change needed).
- Sales proposals use the internal anchors (Solo $49, Business $149-199, Enterprise floor €500+) for consistency across quotes. [TV consistency]
- Self-serve motion (trial → Solo) stays gated until prices go public or a founder-led pilot cohort validates willingness to pay.
- The pricing FAQ "Why are prices not listed?" remains correct as-is.

## 7. Open questions (post-decision)

Resolved 2026-09-07: no public prices yet (#1); Solo band approved (#2); 2nd sede included, 3rd+ add-on (#3); connector priority Holded → QuickBooks → Xero (#5).

Still open:
1. **Invoicing scope:** build ES-first Veri*factu invoicing for Solo, or start with exports-to-gestoría and build SIF certification later (deadlines 2027/28 give room)?
2. **Annual discount:** -17% (2 months free) or -10% (WellnessLiving style) — applies to proposals now, public later.
3. **Staff seats as soft cap** on Solo (1-3): hard limit, soft warning, or unmetered?
4. **Trial role:** is the self-serve trial the entry to Solo, or does Solo start founder-led until prices go public?
5. **Per-location add-on price:** flat per extra sede, or banded (3-5, 6-10)?

## Sources

wellnessliving.com/pricing · goteamup.com/pricing · arketa.com/pricing · hellowalla.com · exercise.com (Mindbody/TeamUp cost) · mindbodyonline.com (pricing blog, tier features, Xero partnership) · teachworks.com/pricing · zutobi.com/us/driving-schools · arlo.co/pricing · classter.com/pricing · squareup.com (appointments, invoices) · acuityscheduling.com/pricing · gymdesk.com · vibefam.com (Mindbody reviews, WellnessLiving review) · makocrm.so (why studios leave Mindbody) · arketa.com/features/accounting-bookkeeping · wellnessliving.com/features/intuit-quickbooks-online · autymate.com case study · support.goteamup.com (accounting docs) · drivescout.com/blog · support.arlo.co (Xero) · accessplanit.com (Sage/Xero) · classter.com/integrations/finance/xero · holded.com/es/precios · contasimple.com/precios · getquipu.com · ceat.es (gestoría 16%) · renta-up.es (gestorías survey) · boe.es RD 1007/2023 · sede.agenciatributaria.gob.es (Veri*factu deadlines) · acodei.com (Stripe-QBO) · apps.xero.com (education category) · internal: apps/web/lib/pricing-content.ts (plan comparison + 8 paid extensions)

# Akademate Vertical OS: vertical studies

Study-first program: 10 vertical landings where each page must read as "Akademate IS the operating system for THIS academy model", not as a re-skinned home. Same platform, different narrative and different module matrix per vertical.

- **Status (2026-09-06):** 3 of 10 fichas complete (01, 02, 05). 7 pending.
- **Language:** studies and landings in English (US + EU markets); the site already emits EN/ES hreflang, so each landing gets an ES variant through the existing i18n layer.

## Index

| # | Vertical (live canon) | Ficha | Status | Study anchor |
|---|---|---|---|---|
| 01 | Professional and regulated training | [VERTICAL-01-professional-training.md](VERTICAL-01-professional-training.md) | COMPLETE v1 | CEP Formación (ES) |
| 02 | Yoga, pilates and wellness studios | [VERTICAL-02-wellness.md](VERTICAL-02-wellness.md) | COMPLETE v1 | SKY TING / triyoga / Madrid studios |
| 03 | Sports academies and clubs | - | PENDING | - |
| 04 | Language academies | - | PENDING | - |
| 05 | Driving schools | [VERTICAL-05-driving-schools.md](VERTICAL-05-driving-schools.md) | COMPLETE v1 | RAC (ES) / RED (UK) / 911 (US) |
| 06 | Seasonal camps | - | PENDING | - |
| 07 | Coding academies | - | PENDING | - |
| 08 | Music, dance and performing arts | - | PENDING | - |
| 09 | Online schools and cohort programmes | - | PENDING | - |
| 10 | Multi-site groups and franchises | - | PENDING | - |

## Tag legend (used in every ficha)

- **[O] Observed:** fact with a cited source (operator site, pricing page, thread, live akademate.com).
- **[H] Hypothesis:** inferred, plausible, not yet verified with a source or an operator.
- **[G] Product gap:** the vertical wants something Akademate does not ship today; mark HOLD, never claim in copy.
- **[TV] To validate:** decision or check pending with product/founder.

## Live canon (observed 2026-09-06 on www.akademate.com and branch `codex/akademate-public-es-verticals`)

- Hero: "Run your academy. Grow." CTAs: "Book a demo" (`/en/contacto?asunto=demo`) + "Explore the platform" (`/en/features`).
- 10 academy-model cards, CTA "See this academy model" → `/en/solutions/<slug>`. Slugs: `professional-training`, `wellness`, `sports`, `languages`, `driving-schools`, `seasonal`, `coding-academies`, `performing-arts`, `online-cohorts`, `networks`. The 10 pages already render live (verified on 01 and 05).
- 8 platform pillars: Web and commerce / Growth and admissions / Academic operations / People and workforce / Campus and learning / Payments and finance / Library and resources / Insight and ecosystem (23-item module catalogue on /en/features).
- Roadmap flags on /en/features that constrain copy: Digital signage (Campus communications roadmap), Attendance QR/NFC (Campus operations roadmap), Library and inventory + Finance and accounting + HR (Expansion roadmap), Advanced learning incl. certificates (Product roadmap), Mobile (Future platform).
- Pricing: Launch / Business / Enterprise, no public numbers, "Tailored proposal" ("Why are prices not listed?" is an official FAQ). Plan CTAs: "Plan a launch" / "Book a demo" / "Talk to Enterprise".
- i18n: `en` + `es` locales, `/en/` prefix, hreflang alternates with `x-default: en`.
- Operational note: the marketing content lives on branch `codex/akademate-public-es-verticals`; `main` and the current working branch still carry the old waitlist page. Reconcile before building on top of it.

## URL architecture decision: keep `/en/solutions/<slug>`

Recommendation: **do not migrate to `/for/<slug>`.** Keep the live pattern and the 10 existing slugs.

Why `/solutions/` wins here:
1. The pages already exist, are internally linked (home cards, nav "Who it's for" dropdown with all 10 verticals, cross-links between pages) and are the declared destination of the home CTA. Migrating burns that equity and adds 301 debt for a marginal gain.
2. Vertical keywords belong in the title/H1/content, not the URL: the live H1s already carry the intent ("Fill the diary. Pass more exams."). A URL like `/solutions/driving-schools` still contains the exact keyword; `/for/` would add no token it does not already have.
3. `solutions/` is the standard SaaS IA and leaves room for future non-vertical solutions pages (use-case hubs like waitlist management) without re-architecting.
4. The i18n layer gives `/es/solutions/<slug>` plus hreflang for free; a new `/for/` pattern would need the same work re-done.

When `/for/<slug>` would be right: if the site had no existing solutions IA (greenfield), "for driving schools" phrasing matches query language slightly better. That is not our situation.

Per-vertical slugs: unchanged from live (`professional-training`, `wellness`, `driving-schools`, ...). One residual option to revisit later: `professional-training` → `regulated-training` for tighter keyword match; only worth it before link-building starts, and the current slug already contains "training".

## Master matrix: vertical x module

Verdicts: **Core** (must lead the landing and the demo), **I** = Important, **O** = Optional, **N/A** = hide from the landing. Only 01/02/05 are studied; the rest are structurally PENDING, no invented verdicts.

| Module (8-pillar canon) | 01 Regulated training | 02 Wellness | 05 Driving | 03 Sports | 04 Languages | 06 Camps | 07 Coding | 08 Perf. arts | 09 Online cohorts | 10 Networks |
|---|---|---|---|---|---|---|---|---|---|---|
| Web and commerce (site, offer pages, SEO) | Core | I | I | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Growth and admissions (CRM, admissions) | Core | I | Core | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Bookings / waitlist / capacity | I | Core | Core | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Courses / cohorts / schedules / locations | Core | Core | I | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Attendance / QR / NFC / access | Core (QR/NFC: O) | I (QR/NFC: O) | O | PENDING | PENDING | PENDING | PENDING | PENDING | N/A (presumed) | PENDING |
| Campus and learning (LMS, certificates) | I (certificates Core) | N/A | I (light) | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Payments and finance (checkout, billing) | Core | Core | Core | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Digital signage | O | O | N/A | PENDING | PENDING | PENDING | PENDING | PENDING | N/A (presumed) | PENDING |
| Library / inventory / equipment | O | N/A | Core (as vehicles, gap) | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Multi-site / brands / roles | Core | O | O | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Insight and ecosystem (analytics, integrations) | I | I | I | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

Expected but not yet studied (to be validated in the next batch, per the commander's order): Sports (seasons, guardians, teams), Languages (placement, levels, monthly billing), Camps (fast launch, deposits, capacity), Coding (cohorts, projects, mentors), Performing arts (per-lesson scheduling, families), Online cohorts (LMS-first, no physical ops), Networks (multi-brand governance).

## Primary CTA per vertical

Site-wide observed convention: "Book a demo" is the universal primary; the live vertical pages pair "Start free trial" (hero) + "Book a demo" (header). The trial points to `/en/registro?asunto=trial&vertical=<slug>`; whether that funnel is a real self-serve trial is [TV] and gates everything below.

| # | Vertical | Primary CTA (recommended) | Rationale |
|---|---|---|---|
| 01 | Regulated training | **Book a demo** | Mid-ticket, compliance-led, multi-stakeholder buyer; trial only as secondary once the funnel is proven [TV] |
| 02 | Wellness | **Start free trial** (needs working self-serve + published entry price) | The most self-serve buyer; every competitor publishes prices from $49-320/mo; a trial without a visible price will not convert |
| 05 | Driving | **Start free trial** (same dependency) | Micro-SMB, competitor entry points $16-99/mo self-serve, "days not months" cycle [H] |
| 03-10 | Others | Provisional [H]: SMB self-serve verticals (languages, performing arts, sports, camps) → trial; program-led (coding, online cohorts) → trial/demo hybrid; networks/franchises → **Talk to Enterprise** (matches existing Enterprise CTA) | To be grounded in the next study batch |

## Core modules and CTA, per studied vertical (landing shorthand)

- **01 Regulated training:** Web + offer pages per ciclo; CRM/admissions with eligibility evidence; cohorts + convocatorias + plazas; attendance with thresholds and alerts; certificates/expedientes; matrícula with installments; multi-sede roles. Primary CTA: Book a demo. Hidden: signage (optional), library.
- **02 Wellness:** Booking with aforo + waitlist auto-promotion; recurring schedule; memberships + packs + intro offers; check-in rosters; intro-to-member automation; studio web presence. Primary CTA: Start free trial (pending price/trial decision). Hidden: LMS, inventory, signage.
- **05 Driving:** Lesson diary with instructor + car + slot conflict rules [G/TV]; student self-booking + reminders; packs + deposits + installments; exam convocatoria records and retakes; theory groups; WhatsApp/CRM capture. Primary CTA: Start free trial (pending). Hidden: signage, LMS shown light.

## Product gaps to HOLD before final copy (consolidated)

1. **Vehicle + instructor resource diary with conflict rules** (05 core story): live page marks it "illustrative"; module catalogue has no vehicle resource. [G/TV]
2. **Self-serve trial funnel** at `/en/registro?asunto=trial&vertical=<slug>`: functional or not? Gates the primary CTA on 02/05. [TV]
3. **Public entry pricing** for SMB verticals: official FAQ says prices are not listed; wellness/driving buyers price-compare. Decision needed (publish entry price per vertical or accept lower conversion). [TV]
4. **No-show / late-cancel fee automation** (02): competitors sell it explicitly. [G]
5. **Certificates**: listed under Campus and learning pillar but also inside "Advanced learning (Product roadmap)"; 01 copy depends on the answer. [TV]
6. **External LMS integration** (CEP runs its own campus): connector status unknown. [G/TV]
7. **WhatsApp inbound capture** (05, also 01): not in the integration list today. [G/TV]
8. **Verifactu-compliant invoicing** (ES, 05): Drovify leads with it; not claimed anywhere in Akademate copy. [G/TV]
9. **QR/NFC access + digital signage**: marketing roadmap items; keep as optional language only, never core. [O]

## Build order (SEO impact x proof readiness)

| Rank | Landing | Why | Timing note |
|---|---|---|---|
| 1 | 01 professional-training | Proof is ready today: CEP learner quotes already live on the home; highest ACV; regulation story is the sharpest differentiator vs Arlo/Classter and vs ES academy tools | Add CEP case study + FAQ + compliance section; needs brand permission [TV] |
| 2 | 02 wellness | Largest keyword demand and clearest competitor price umbrella ($49-320/mo); hardest SERP (funded rivals), so proof and price transparency decide | Blocked on the pricing/trial decision [TV] |
| 3 | 05 driving | Least crowded SERP of the three, strong module-fit narrative, real first-hand pain threads to mine for copy | Blocked on vehicle-diary validation [G/TV] |
| 4 | 06 seasonal camps | High seasonality: publish by Feb-Mar to catch the Jan-Aug summer search ramp | Study next in line |
| 5 | 04 languages | Big volume in ES/US; placement/levels story is distinct | Batch 2 |
| 6 | 03 sports | Large market, guardian/season mechanics distinct | Batch 2 |
| 7 | 08 performing arts | Per-lesson scheduling + families; small but underserved SERP | Batch 2 |
| 8 | 07 coding academies | Cohort story overlaps 09; keyword space crowded by bootcamp content | Batch 3 |
| 9 | 09 online cohorts | Smallest physical-ops overlap; differentiator is LMS/community | Batch 3 |
| 10 | 10 networks/franchises | Lowest SEO volume, highest ACV; sales-led, so landing matters least for acquisition | Batch 3 |

## Open questions for the Commander (max 8)

1. **Trial:** is `/en/registro?asunto=trial&vertical=<slug>` a working self-serve trial today? If not, do we switch vertical CTAs to demo/pricing until it is?
2. **Pricing:** publish an entry price (or per-vertical pack) for SMB verticals, or keep "tailored proposal" everywhere?
3. **Vehicle diary (05):** does the product support instructor+car+slot resource pairing today? If not: build, or re-scope the 05 landing story to bookings+payments only?
4. **CEP as public proof:** can we name CEP Formación (logo, metrics, case study) on the 01 landing, given CEP learner quotes already run on the home? What is allowed under the CEP/OVH vs SaaS separation rules?
5. **Marketing roadmap vs product:** attendance thresholds exist in the tenant product while /en/features lists QR/NFC as roadmap; which source of truth do landings follow?
6. **Certificates:** are certificates shippable claims today (pillar 5) or roadmap ("Advanced learning")? 01 copy needs a definitive answer.
7. **Language rollout:** EN-only at launch with ES variants added via existing i18n, or both locales at once?
8. **Landing scope:** is the current template (hero + benefits + stakeholders + module tabs + workflow + closing) the fixed skeleton for Fase 2, or do we extend it (proof band, FAQ, pricing teaser) per the ficha reviews?

## Method note

Every claim in the fichas is tagged [O]/[H]/[G]/[TV] with sources inline. No module is asserted as Core unless it exists in the live 8-pillar canon or is explicitly flagged as a gap. Unstudied verticals are PENDING by design: no AI-generic filling.

## Related

- [WIZARD-BRIEF.md](WIZARD-BRIEF.md): optimized prompt for the Vertical Configuration Engine + onboarding wizard (3-set entitlement model, per-vertical menus, acceptance scenarios).

- [PLANS-STUDY.md](PLANS-STUDY.md): plan ladder study (Solo/Business/Enterprise), pricing benchmarks, accounting replace-vs-connect strategy, preset x plan model.

- [BUSINESS-PLAN.md](BUSINESS-PLAN.md): final business-plan definition, Bayesian audit of all decisions (priors/posteriors), closed open questions, KPIs and revision triggers. Prevails over PLANS-STUDY and WIZARD-BRIEF where they overlap.

# VERTICAL-02: Yoga, pilates and wellness studios

- **Live landing:** `akademate.com/en/solutions/wellness` (ES: `/es/solutions/wellness`)
- **Study status:** v1 COMPLETE (2026-09-06). Operators observed: SKY TING Yoga (US), triyoga (UK), Solid Studio Tribunal + Madrid studio cluster (ES).
- **Tag legend:** [O] Observed (source cited) · [H] Hypothesis (inferred, plausible, unverified) · [G] Product gap (do not claim in copy until built) · [TV] To validate with product/founder.

---

## A. Market and buyer persona

### Who buys
- Studio owner-manager, very often a teacher-founder; in small chains, owner + studio manager. [H, consistent with operator structure]
- This is the most self-serve, price-comparing buyer of the three studied verticals: they read competitor pricing pages and Reddit before talking to sales. [O, r/yoga threads comparing Mindbody fees]

### Who uses it daily
- Owner (scheduling, pricing, content), front desk (check-in, waitlists, payments), instructors (rosters, substitutions). [H]
- Solo studios: the owner is all of the above, in the gaps between teaching. [H]

### Who the end client is
- Urban, majority female, 25-55; books from a phone app, pays with packs or memberships, discovers via Instagram, Google Maps or referral. [H; booking-via-app observed at triyoga/Solid Studio via Mindbody]

### Pains
1. **No-shows and late cancellations:** vendors sell fee automation around this pain (Walla collects no-show/late-cancel fees 24h after class; Reservio ships 50%/100% policy templates). [O, hellowalla.com; reservio.com]
2. **Empty classes and waitlist churn:** filling the 7pm class from the waitlist is the recurring operational wish. [H, grounded in waitlist features sold by every competitor]
3. **Intro-offer conversion:** free trials often convert below 20%; paid intro offers convert 30-80% (50-60% cited as healthy). [O, fitdegree.com; vibefam.com; chalkitpro.com]
4. **Member retention/churn on unlimited memberships.** [H]

### Objections
- Price and fees: "Mindbody's $129/month plus transaction costs"; Mindbody reportedly charges ~20% on new marketplace signups (competitor claim). [O, r/yoga; marianatek.com comparison]
- "I manage with Instagram DMs + WhatsApp + a spreadsheet." [H, consistent with community threads]
- Switching cost: data migration and member re-registration away from Mindbody is a known fear ("why I switched from Mindbody" is a content genre). [O, studiobookings.com]
- Contracts and hidden add-on fees at renewal. [H]

### Ticket and sales cycle
- Observed competitor pricing: WellnessLiving $69-199/mo, Glofox from $99, Mindbody from $79 (tiers reported $129/$259/$399), TeamUp from $119, bsport from €150, Walla $320/location, Arketa $49 individual, Mariana Tek quote-only (~$179-800 reported). [O, vendor pricing pages]
- Typical ticket: ~$100-300/mo single studio; $300-800+ multi-site. [H, anchored on the above]
- Cycle: self-serve, 1-2 weeks for indie studios; demo-led 2-6 weeks with pilot for chains. [H]

## B. Business model of the vertical

- **How they monetize:**
  - Memberships: monthly/annual unlimited (triyoga "Trisave" unlimited with 15%/month savings). [O]
  - Class packs: 4/8/10-session bonos (Solid Studio: 4 sessions €92; Madrid studios sell €69-260 packs). [O]
  - Drop-ins: €25-26 per class in Madrid. [O]
  - Intro offers: the acquisition workhorse: Sky Ting $75 for 14 days unlimited; triyoga £25 for 28 days; Solid Studio clase de prueba €15. [O]
  - Workshops, series/courses, teacher training, treatments (triyoga). [O]
  - On-demand streaming as a separate product line (SKY TING TV). [O]
- **Capacity:** room aforo per class; reformer pilates is equipment-capped (one reformer per client). [O/H]
- **Seasonality:** January (resolutions) and September (back-to-routine) signup peaks; August dip. [H, industry-consistent; not directly sourced]
- **Multi-site:** small chains exist and grow (triyoga: 5+ London sites, 600+ classes/week); franchising exists in boutique fitness. [O triyoga; franchise H]
- **Regulation / compliance:**
  - Liability waivers are standard; Yoga Alliance publishes a sample release. [O, yogaalliance.org]
  - Health questionnaires are GDPR "special category data": explicit consent and safeguards required. [O, yogatax.co.uk]
  - Spain: studios carry Seguro de Responsabilidad Civil Profesional; Spanish waivers cannot fully exclude liability for negligence (art. 1102 Código Civil). [O, singularcover.com]
  - Digital waiver + health form capture at first booking is a real software requirement (vendors market it). [O, happywaiver.com]

## C. Customer journey (vertical lexicon: Discover → Try → Book → Attend → Join → Renew)

| Stage | Typical channel | Friction today | What Akademate must do |
|---|---|---|---|
| **Discover** | Instagram, Google Maps, referral, rankers/bloggers | DM-based booking leaks; no owned web funnel [O/H] | Studio website + schedule + intro-offer page with SEO; Meta/IG capture into CRM |
| **Try (intro offer)** | Intro pack page, walk-in | Free trials convert poorly; paid intros convert 30-80% [O] | Sell the paid intro offer online, automate the follow-up sequence into membership |
| **Book** | Competitor app (Mindbody etc.), studio site | Marketplace fatigue; double booking friction [O] | Own-brand booking (web-first, no marketplace tax), waitlist auto-promotion, cancellation windows |
| **Attend** | Front desk list, app QR | No-shows; late cancels unrecovered [O] | Roster check-in, automated no-show/late-cancel fee capture [G: fee automation must be validated in product before claiming] |
| **Join (membership/pack)** | Front desk or link | Manual renewals; failed card payments [H] | Recurring memberships, packs with expiry, dunning/recovery via Stripe |
| **Renew / grow** | Email/IG | Churn noticed too late [H] | Retention dashboards (visit frequency, churn risk), win-back automation, workshops upsell |

## D. Module matrix (Akademate fit)

| Module (home canon) | Verdict | Rationale | Status |
|---|---|---|---|
| Web and commerce (site, CMS, domains, offer pages, SEO) | **Important** | Discovery is IG/Maps-led, but the converting asset is the studio's own schedule + intro-offer page; owning the web presence beats marketplace dependence | In product (pillar 1) [O] |
| Growth and admissions (Leads & CRM, campaigns, automation) | **Important** | Intro-offer capture and win-back; no heavy admissions funnel here | In product (pillar 2) [O] |
| Bookings / waitlist / capacity | **Core** | The heart of the vertical: class booking with aforo, waitlists, cancellation windows | In product (Reservations) [O] |
| Courses / cohorts / schedules / locations | **Core** | Recurring class schedule, teachers, rooms, series/workshops | In product (pillar 3) [O] |
| Attendance / QR / NFC / access | **Important** (roster check-in) / **Optional** (QR/NFC hardware) | Daily check-in rosters; QR at the door is a nice-to-have, NFC marginal | Attendance in product [O]; QR/NFC on roadmap [G/TV] |
| Campus and learning (LMS, gradebook, certificates) | **No aplica** (core narrative) / **Opcional** (on-demand video) | Studios do not buy an LMS; on-demand video is a separate product line (SKY TING TV). Do not show this module on the landing | LMS in product but irrelevant here [O] |
| Payments and finance (checkout, billing, receivables) | **Core** | Memberships (recurring), packs, intro offers, dunning; no-show fee automation is the differentiating sub-feature | Checkout/Billing in product [O]; automated no-show/late-cancel fees [G, validate before claiming] |
| Digital signage | **Optional** | "Today's classes" screen at reception is a charming differentiator for boutiques, not a buying trigger | [G, "Campus communications roadmap"] |
| Library / inventory / equipment | **No aplica** (retail POS out of scope) | Studios sell classes, not goods; equipment (reformers) only matters as capacity | [G, "Expansion roadmap"; not needed for launch] |
| Multi-site / brands / roles | **Optional** | Relevant for 2-5 site studios and franchise growth; do not lead with it | In product [O] |
| Insight and ecosystem (analytics, integrations) | **Important** | Class fill rate, intro-to-member conversion, churn; Stripe + Meta CAPI integrations | In product (pillar 8) [O] |

## E. Social proof and language

### Vocabulary (use these words)
- **EN:** member, drop-in, class pack, intro offer / new-client special, waitlist, late-cancel fee, no-show fee, unlimited membership, flow / vinyasa / yin, reformer, studio, series, aforo→capacity. [O, operator sites]
- **ES:** socio/a, clase suelta, bono (de 4/8 clases), clase de prueba, lista de espera, cargo por cancelación tardía, cuota mensual, pase ilimitado, aforo, clase colectiva, estudio. [O, mindbodyonline.com listing for Solid Studio]
- Never say "learner" or "campus" to this buyer. Say studio, member, class, pack, waitlist.

### Three credible claims + required proof
1. "Fill every class from your waitlist, automatically." → Needs a working waitlist auto-promotion demo and a pilot studio metric. [TV]
2. "Turn intro offers into members on autopilot." → Needs the intro-offer → membership automation flow demo; the 30-80% conversion benchmark is published. [O benchmark; TV product flow]
3. "Your studio's brand, not a marketplace: your site, your booking page, no 20% take." → Differentiation vs Mindbody fees is documented [O]; needs a side-by-side cost calculator to be credible. [TV]

### Competitor software (for differentiation)
| Product | Positioning | Price |
|---|---|---|
| Mindbody (Xplor) | Market standard, marketplace + branded app; boutique → franchise | from $79/mo; tiers ~$129/$259/$399 [O] |
| Mariana Tek (Xplor) | Boutique chains/franchises (pilates, cycle) | quote; ~$179-800 reported [O] |
| Glofox (ABC Fitness) | Boutique studios and gym franchises | from $99/mo [O] |
| TeamUp | Indie studios/crossFit, transparent per-member tiers | from $119/mo [O] |
| Arketa | Yoga/pilates boutique, owner-built, payroll+POS | $49 individual; studio quote [O] |
| bsport | EU boutique yoga/pilates/reformer, AI scheduling | from €150/mo [O] |
| WellnessLiving | SMB wellness, booking + waitlists + client app | $69-199/mo [O] |
| Walla | Premium US yoga/pilates studios | $320/mo per location [O] |

Angle: the boutique buyer's resentment of Mindbody pricing/fees is documented [O]; Akademate's wedge is "your own web + booking + CRM at studio prices", with multi-site and signage as growth hooks competitors gate behind higher tiers.

## F. SEO of the future landing

- **Primary keyword (EN):** yoga studio software. [O, competing title tags: Mindbody "Yoga Studio Software", WellnessLiving "Yoga Studio Booking and Scheduling Software", Arketa "Yoga Studio Management Software"]
- **Secondary (EN):** pilates studio software; yoga studio management software; yoga studio booking software; reformer pilates software; mindbody alternative for yoga studios. ES: software para estudios de yoga, software gestión pilates, programa reservas clases yoga, software bonos clases pilates.
- **Title candidate (<60 chars):** "Yoga & Pilates Studio Software | Akademate" (43)
- **H1 candidates (outcome):** "Fill every class. Keep every member." (mirrors site voice) or "Run your studio, not your spreadsheet: booking, members and payments in one place."
- **FAQ (5 real buyer questions):**
  1. How much does it cost compared to Mindbody? (needs a published entry price or transparent calculator [TV: pricing is "tailored proposal" today])
  2. Can my clients book without downloading an app?
  3. Can it charge no-show and late-cancellation fees automatically? [G: only claimable once fee automation exists]
  4. Does the waitlist promote people automatically when a spot opens?
  5. Are waivers and health questionnaires (GDPR special category) handled at booking?

## Landing gap review (expected same template as observed on 01/05; page-specific review PENDING)

- Template observed on live 01/05 pages: hero + benefits + stakeholders + module tabs + workflow + closing, with "Start free trial" + "Book a demo" CTAs and no social proof/FAQ.
- For this vertical specifically: the landing must lead with booking/waitlist/membership and hide LMS, signage and inventory; it must answer the price question early because every competitor publishes prices. Both are missing today. [O template / O competitor pricing]

## Sources

skyting.com (+ /passes, /upcoming) · uk.trustpilot.com/review/www.triyoga.co.uk · triyoga (intro offer via public posts) · mindbodyonline.com/explore/locations/solid-studio-tribunal · powerhotyoga.es · hellowalla.com/blog/no-show-late-cancel-fees · reservio.com/blog/tips/no-show-policy-wording-templates · fitdegree.com (free trial conversion) · vibefam.com (intro offers) · chalkitpro.com (trial vs intro) · reddit.com/r/yoga (scheduling software fees) · marianatek.com/mariana-tek-vs-mindbody/ · studiobookings.com (Mindbody switch) · mindbodyonline.com/business/pricing · goteamup.com/pricing · glofox.com/plans/ · wellnessliving.com/pricing/ · arketa.com/pricing · softwareadvice.com (bsport) · marianatek.com/pricing/ · yogaalliance.org (waiver sample) · yogatax.co.uk (GDPR) · singularcover.com (RC insurance ES) · happywaiver.com/industries/yoga-studios · live: akademate.com home, /en/features, /en/pricing

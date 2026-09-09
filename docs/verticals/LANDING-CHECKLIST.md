# Landing checklist: canon 2025-26 vs akademate.com vertical landings

Reference canon: "Estructura ideal de una landing SEO SaaS (canon 2025-26)" (commander brief, 2026-09-06). Audited against the live template (`/en/solutions/<slug>` and `/es/solutions/<slug>`), then implemented on branch `feat/vertical-landings`.

## 1. Section-by-section gap audit (12-block canon)

| # | Canon block | Live template BEFORE | Shipped in `feat/vertical-landings` |
|---|---|---|---|
| 1 | Hero (H1 outcome + keyword, subhead ICP + mechanism, UI visual, CTA1, optional CTA2, trust micro) | Eyebrow + H1 outcome-only ("Fill the diary. Pass more exams.") + promise + single "Start free trial" CTA. No trust micro, no secondary | H1 rewritten keyword + outcome for all 10 (EN + ES); primary CTA **Book a demo** + secondary outline **Start free trial** (max 2); trust micro "GDPR-compliant · Stripe, PayPal & SEPA" under CTAs; hero image kept (real UI visuals come from the product-experience section) |
| 2 | Logo bar / early social proof ("can I trust it?") | MISSING entirely | Proof band right under hero: real learner rating line linking the live academy (cepformacion.akademate.com) + the 3 nominative CEP learner quotes on vertical 01. No invented logos or stat bands for the other 9 (placeholders are forbidden by canon) |
| 3 | Problem → solution (1 idea) | Outcomes section ("A smoother journey for everyone.") | Kept as-is; already one-idea benefits in vertical voice |
| 4 | How it works (3-6 steps) | 4 workflow steps with "Powered by" module labels | Kept as-is |
| 5 | Benefits / product modules (3-6, no grid of 9) | VerticalProductExperience tabs (4 modules) | Kept as-is |
| 6 | Verticals / ICP (multi-niche) | MISSING on vertical pages (only home carousel) | New bridge section: "Built for every academy model." with the 9 sibling verticals linked (hub & spoke internal linking) |
| 7 | Deep proof (testimonial + case) | MISSING | Covered by proof band (nominative quotes + live academy case link) on vertical 01. Other 9: platform-level proof line only until real vertical customers exist (HOLD, see below) |
| 8 | Integrations / ecosystem ("fits my stack?") | MISSING on vertical pages (only /features) | New integrations band: 4 pillars (Payments Stripe/PayPal/SEPA, Finance, Growth Meta Ads/CAPI, Communication) + one per-vertical integration note + link to /features |
| 9 | Pricing or teaser → /pricing | MISSING | New pricing teaser: 3 localized plan cards (Launch / Business / Enterprise from the pricing catalogue) + "Compare plans" → /pricing. Primary CTA still Book a demo (no third competing offer) |
| 10 | FAQ (real objections + long-tail) | MISSING | New FAQ section: 5 buyer-question FAQs per vertical (EN + ES), drawn from the Phase 0 studies for 01/02/05, conservative buyer questions for the other 7 |
| 11 | Final CTA = same copy as CTA1 | Closing CTA was "Start free trial" (mismatched) | Closing CTA is now Book a demo, same copy, same href pattern (`/contacto?asunto=demo&vertical=<slug>`), same visual treatment as hero primary |
| 12 | Footer (nav SEO, legal, trust) | Global Footer | Unchanged |

## 2. CTA system audit

- Before: hero CTA "Start free trial" (unproven funnel, [TV]) + closing CTA "Start free trial" + header "Book a demo". Three different actions competed.
- Now (sales-led B2B rule): **primary = "Book a demo" / "Reservar una demo"**, repeated hero + closing, same copy and color; secondary = outline "Start free trial" / "Empieza la prueba gratis" (kept because the funnel link already exists; flip to primary per-vertical when the trial is proven, per the Phase 0 CTA table).
- Pricing teaser uses "Compare plans" only (cold-traffic secondary), never a third equal-weight offer.

## 3. SEO technical audit

| Item | Before | Now |
|---|---|---|
| H1 keyword | Outcome only ("Fill cohorts. Deliver with confidence.") | Keyword + outcome for all 10 ("Training center software that fills every cohort", "Driving school software that fills the diary", ...) |
| Keyword in first 100 words | Promise carried ICP + mechanism | Hero subhead (promise) unchanged + keyword now in H1; eyebrow carries "Akademate for <vertical>" |
| Keyword in one H2 | None | FAQ H2 is keyword-led per vertical ("Driving school software: your questions, answered") |
| Title / meta | Generic "{title} management software" | Per-vertical `seoTitle` (≤60 chars, keyword-led) + `metaDescription` (50-165 chars, outcome + ICP + CTA), EN + ES, via `generateMetadata` |
| FAQPage JSON-LD | Missing | Added per landing from the FAQ data |
| SoftwareApplication JSON-LD | Missing | Added (name, applicationCategory BusinessApplication, operatingSystem Web, publisher). `offers` omitted until public prices exist; add when pricing goes transparent |
| Crawlable HTML | Next SSG (`generateStaticParams` over 10 slugs) | Unchanged; FAQ answers render server-side inside `<details>`, so content is in HTML |
| hreflang EN/ES | Already emitted by `publicPageMetadata` + i18n routing | Unchanged, ES copy now exists for every new string |
| Image alts | Present | Unchanged |
| LCP | Hero image `priority` + `sizes="100vw"` | Unchanged |
| Internal links | Home cards → verticals; nav dropdown | Now vertical → siblings (9 links) + vertical → /features + vertical → /pricing + FAQ long-tail |

## 4. Content provenance per vertical

| Vertical | Content source | Confidence |
|---|---|---|
| 01 professional-training | Phase 0 study (CEP/CESUR/ILERNA/ACC operators, competitor set, regulation) + real CEP quotes | Grounded |
| 02 wellness | Phase 0 study (SKY TING/triyoga/Madrid, competitor pricing, no-show + intro-offer pains) | Grounded |
| 05 driving-schools | Phase 0 study (RAC/RED/911, DGT/DVSA/DMV, owner threads) | Grounded |
| 03, 04, 06, 07, 08, 09, 10 | Written from live product canon + card capabilities; buyer-question FAQs are hypotheses | [H] validate in Phase 0 batch 2 before scaling claims |

## 5. Intentionally not claimed (product gaps, HOLD)

- QR/NFC access and digital signage (roadmap on /features): absent from all FAQ answers and copy.
- No-show / late-cancel fee automation (wellness): FAQ answers describe booking windows + reminders, not fee collection.
- Vehicle + instructor diary (driving): copy says schedules/reservations treat "instructors, vehicles and slots as capacity"; the product-experience tabs remain labeled "Illustrative product example" until resource pairing ships.
- Certificates for regulated training: not claimed in FAQ (Advanced learning is roadmap); certificates only appear where the live pillar list already shows them.
- Zoom / WhatsApp: not claimed (not in the live integration pillars).
- No invented metrics, logos or testimonials anywhere.

## 6. Files changed

- `apps/web/lib/vertical-landing-content.ts` (NEW): per-vertical seoTitle, metaDescription, faqHeading, integrationNote, 5 FAQs (EN) + proof quotes with source comment.
- `apps/web/lib/vertical-landing-content.es.ts` (NEW): Spanish mirror.
- `apps/web/lib/vertical-i18n.ts`: chrome v2 (CTAs, trust, proof, integrations, pricing, bridge, FAQ keys), ES H1 headlines rewritten, getters `getVerticalLandingCopy` / `getVerticalProofQuotes`.
- `apps/web/lib/marketing-content.ts`: 10 EN headlines rewritten (keyword + outcome).
- `apps/web/app/solutions/[slug]/page.tsx`: 12-block template, JSON-LD, per-vertical metadata, CTA system.
- `apps/web/lib/vertical-landing-content.test.ts` (NEW): parity + bounds tests.
- `pnpm-lock.yaml`: regenerated to match the pinned package.json (the OpenNext pin commit left the lockfile stale).
- `docs/verticals/*`: Phase 0 study docs + this checklist.

## 7. Verification

- `vitest run lib`: 17 files / 111 tests passed (including the new parity suite).
- `tsc --noEmit`: clean.
- `next build`: validated (see commit note).
- Not done here: merge/deploy (explicitly out of scope), visual QA screenshots, real-user ES copy review.

## 8. Remaining after this branch

1. Proof for the other 9 verticals: replace the platform-level proof line with vertical customer logos/quotes as they exist. No fakes.
2. Batch 2 studies (03, 04, 06 + rest) to ground the 7 hypothesis-level FAQ sets, and to sharpen claims per the module matrix.
3. Pricing transparency decision (publishes entry price per vertical or keeps "Tailored proposal") — gates conversion on 02/05.
4. Trial funnel validation (`/registro?asunto=trial`): when proven, swap primary CTA to trial on SMB verticals per the Phase 0 CTA table.
5. Add `offers` to SoftwareApplication JSON-LD when public prices exist.

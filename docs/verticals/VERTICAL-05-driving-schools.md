# VERTICAL-05: Driving schools

- **Live landing:** `akademate.com/en/solutions/driving-schools` (ES: `/es/solutions/driving-schools`)
- **Study status:** v1 COMPLETE (2026-09-06). Operators observed: RAC Autoescuela (ES, 60+ centers), RED Driving School (UK), 911 Driving School (US franchise).
- **Tag legend:** [O] Observed (source cited) · [H] Hypothesis (inferred, plausible, unverified) · [G] Product gap (do not claim in copy until built) · [TV] To validate with product/founder.

---

## A. Market and buyer persona

### Who buys
- Most schools are owner-operated with 1-3 instructors (Zutobi states most of its schools start at that size). [O, zutobi.com/us/driving-schools]
- Chains/franchises (RAC Autoescuela 60+ centers in Spain) have a director/ops buyer. [O, raccautoescuela.es]

### Who uses it daily
- The owner wears the reception/admin hat; instructors manage their own calendars and rescheduling. [H, consistent with owner threads on r/smallbusiness]
- Reception (in chains): matrícula, payments, exam paperwork. [H]

### Who the end student is
- Spain: 18+, large 18-30 segment; UK: 17+ provisional licence holders; US: teens 15-16 plus adult/refreshers. [O ages; segmentation H]

### Pains
1. **Double-booked instructors/cars** from text-message + notebook scheduling ("I keep double-booking by accident"; recurring weekly slots). [O, Facebook driving-school group; r/smallbusiness]
2. **No-shows and late cancellations in both directions:** 48h cancellation policies are contested; charging no-show fees risks students cancelling everything. [O, r/LearnerDriverUK]
3. **Records scattered:** student progress, payments and lesson history across notebooks/spreadsheets. [O, r/smallbusiness]
4. **Idle instructor+car time** from forgotten lessons and last-minute cancels; reminders and deposits are the vendor pitch for exactly this. [O, Bookeo/SimplyBook marketing]
5. **Theory pass rates and exam retakes** extend the sales cycle and consume lesson inventory; in the UK, pass-rate indicators even trigger early DVSA standards checks for instructors. [O for UK trigger mechanism, gov.uk; direct revenue impact TV]

### Objections
- Price sensitivity of micro-operators (1-3 instructors). [H, from typical school size]
- "Notebooks and spreadsheets work fine": many run the entire operation that way today. [O, r/smallbusiness thread]
- Instructor resistance: solo instructors see booking software as overhead; some refuse tools. [O behavior, r/LearnerDriverUK; resistance attribution H]
- Fear that enforcing no-show fees damages reputation. [O, Facebook group post]

### Ticket and sales cycle
- Competitor price points: DriveScout from ~$99/mo; Teachworks Starter $16.49/mo (+$0.32/student lesson), Growth $47.99, Premium $187.99; Zutobi Instructor from ~$20 usage-based; Bookeo €10.95-89.95/mo; SimplyBook.me free-$11.90. [O, vendor pricing pages]
- Typical buyer: 1-10 instructors; entry ticket ~$20-100/mo. [O price points / H school size]
- Cycle: self-serve trial to close in days, not months, for independents; chains (RAC) sales-led. [H]

## B. Business model of the vertical

- **How they monetize:**
  - Spain: matrícula + teórica + packs de prácticas (RAC sells 5/10/15/20/30/40-session packs; permisos B, AM, A1/A2/A; point-recovery courses). Total cost per student typically €800-1,200 (up to €1,400-1,500 with retakes); DGT fee €94.05 covers theory + 2 practical exam convocatorias; lessons €25-45/session; comparators: "Carnet B + 10 prácticas" €299-589 in Madrid. [O, raccautoescuela.es; bankinter.com; autoescuelagala.com; autoescuelalamoderna.es]
  - UK: hourly lessons £30-45; bulk packages (RED: 40h = £1,179.20); intensive courses £2,000-3,000; intro offers (16h for the price of 14, 2 free hours); digital delivery fees at checkout (RED: £1.80/lesson-hour + £3.49 booking fee). [O, reddrivingschool.com]
  - US: teen driver-ed packages (911 Driving School: SC $595 basic / $795 premium; WA $575+tax), defensive driving $75. [O, 911drivingschool.com]
- **Capacity:** the triple constraint instructor + car + time slot is the production unit; a car out of service removes revenue, not just a seat. [O/H]
- **Seasonality:** US: summer teen peak, spring push, winter slow season filled with intensives/discounts; birthday/eligibility spikes. [O, 911drivingschool.com; aceable.com]. Spain/UK: [TV].
- **Multi-site:** chains and franchises exist (RAC 60+ centers; RED franchise + direct). [O]
- **Regulation / compliance:**
  - Spain: autoescuelas are authorized centers that present students to DGT convocatorias; theory is 30 questions/30 min; practical exam 30 min for class B; "por libre" self-presentation route exists via Sede Electrónica. [O, dgt.es]
  - UK: instructors must be registered ADIs; standards check every 4 years, triggered early by pupil pass-rate indicators; graded A/B. [O, gov.uk]
  - US: state-by-state DMV licensing of schools and instructors (CA: owner/operator/instructor licenses, $10,000 surety bond, 6h BTW minimum with 2h/day cap; NY: instructor 21+; NJ: 4 years experience + background check; bonds $2,000-100,000 by state). [O, dmv.ca.gov; dmv.ny.gov]
  - RGPD for Spanish student data (ID, psicotécnico medical certificate). [H]

## C. Customer journey (vertical lexicon: Discover → Enroll → Theory → Practice → Exam → License)

| Stage | Typical channel | Friction today | What Akademate must do |
|---|---|---|---|
| **Discover** | Google Ads + local SEO ("autoescuela cerca de mí"), WhatsApp Business click-to-chat, TikTok/IG approved-student proof, phone (900 numbers), walk-in [O, simescar.com; adsplorer.com] | Enquiries lost in DMs; slow response kills conversion [H] | Local SEO pages per sede/pack; CRM captures WhatsApp/form/phone enquiries with response automation |
| **Enroll (matrícula + pack)** | Desk/phone; some online (RED portal) | Paper matrícula; packs tracked by hand [O/H] | Online checkout with packs, matrícula, deposits; student record created at purchase |
| **Theory (teórica)** | Classroom groups or online; exam at DGT/DVSA/DMV | Test prep tools separate; exam dates tracked manually [O/H] | Theory groups + exam convocatoria calendar; light LMS for test prep [TV: test banks]; progress tracking |
| **Practice (prácticas)** | Phone/WhatsApp/agenda at front desk | Double-bookings; no-shows; idle cars [O] | Lesson diary with instructor + car + slot conflict rules; student self-booking; reminders; waitlist for full days |
| **Exam (convocatoria)** | School registers student into DGT/DVSA/DMV sitting | Exam paperwork manual; retakes untracked [O/H] | Exam records, retake tracking, fee handling; per-instructor pass-rate visibility |
| **License & refer** | Word of mouth, reviews | Referral flow unmanaged [H] | Post-pass review requests; referral offers; point-recovery course upsell (ES) |

## D. Module matrix (Akademate fit)

| Module (home canon) | Verdict | Rationale | Status |
|---|---|---|---|
| Web and commerce (site, CMS, domains, offer pages, SEO) | **Important** | Local SEO + pack pages drive discovery; RED shows online booking/checkout is viable at scale | In product (pillar 1) [O] |
| Growth and admissions (Leads & CRM, campaigns, automation) | **Core** | WhatsApp/phone enquiry capture and follow-up is where leads die today | In product (pillar 2) [O]; WhatsApp inbound capture [TV] |
| Bookings / waitlist / capacity | **Core** | The lesson diary (instructor + car + slot) IS the product; waitlists for full days | Reservations in product [O]; **resource-pairing rules (instructor+car) must be validated before final copy** [G/TV: live page mocks "Vehicle and instructor diary" as illustrative] |
| Courses / cohorts / schedules / locations | **Important** | Theory groups, exam convocatoria calendar, multi-sede timetables | In product (pillar 3) [O] |
| Attendance / QR / NFC / access | **Optional** | Theory-class attendance yes; lessons are tracked as completed sessions, not check-ins; NFC no | Attendance in product [O]; QR/NFC roadmap [G] |
| Campus and learning (LMS, certificates) | **Important** (light) | Theory prep and progress; no certificates culture except course completions; DGT test banks would be the killer feature | LMS in product [O]; test-bank content/integration [G/TV, do not claim] |
| Payments and finance (checkout, billing, receivables) | **Core** | Packs, matrícula, deposits, installments, refunds; ES: Verifactu-compliant invoicing is now table stakes (Drovify leads with it) | Checkout/Billing in product [O]; Verifactu [G/TV] |
| Digital signage | **No aplica** | Small premises; nothing to show | [G, roadmap; do not show] |
| Library / inventory / equipment | **Core** (as vehicle + instructor resources) / rest Optional | Vehicles are schedulable, revenue-bearing resources needing maintenance visibility (ITP/seguro reminders [TV]); instructor workload matters | Vehicle-as-resource with pairing + maintenance: **[G/TV]**; generic inventory is Expansion roadmap [G] |
| Multi-site / brands / roles | **Optional** | Chains/franchises exist (RAC, RED) but most buyers are 1-3 instructors | In product [O] |
| Insight and ecosystem (analytics, integrations) | **Important** | Pass rate per instructor, car utilization, revenue per car [H]; Stripe payments; Meta lead ads | In product (pillar 8) [O] |

## E. Social proof and language

### Vocabulary (use these words)
- **ES:** alumno, matrícula, teórica, prácticas / clases prácticas, monitor de prácticas, permiso B, convocatoria, examen teórico/práctico, tasa DGT, psicotécnico, bono de clases, por libre, coche de autoescuela, recuperaciones de puntos. [O, raccautoescuela.es; dgt.es]
- **EN:** learner (UK) / student (US), lesson, behind-the-wheel (BTW) / drive time, road test (US) / driving test (UK), permit (US) / provisional licence (UK), lesson pack, intensive course, refresher lesson, no-show, pickup, in-car lesson, standards check (UK). [O, operator sites]
- Never say "cohort" or "campus" to this buyer. Say lesson diary, pack, monitor/instructor, car, convocatoria/exam.

### Three credible claims + required proof
1. "Zero double-booked cars or instructors." → Needs the resource-pairing diary with conflict rules working in demo and a pilot school. [G/TV: the core feature must exist; the live page labels it "illustrative"]
2. "Students book, pay and reschedule from their phone; you stop chasing cash." → Needs student self-booking + reminders + Stripe checkout demo. [TV]
3. "Know your real pass rate per monitor and per car." → Needs exam-outcome recording + analytics view; UK DVSA pass-rate triggers give this claim regulatory teeth. [O trigger / TV product]

### Competitor software (for differentiation)
| Product | Positioning | Price |
|---|---|---|
| DriveScout | All-in-one US driving school software (scheduling, payments, website, staff) | from ~$99/mo [O] |
| Teachworks | Lesson-usage-based management (tutoring + driving); vehicle calendar add-on | Starter $16.49/mo + usage [O] |
| Zutobi Instructor | BTW scheduling, hour tracking + theory test prep bundle | from ~$20 usage-based [O] |
| Bookeo | Booking built around prepaid lesson packs, no commission | €10.95-89.95/mo [O] |
| SimplyBook.me / Acuity / Setmore | Generic schedulers schools buy today | free-$11.90 [O] |
| Drovify (ES) | Spanish cloud software: visual agenda, matrículas, cobros, Verifactu, AUES/DGT integration | price [TV] |
| WinAutoGest / Gálibo / PracticaVial (ES) | Legacy Spanish desktop tools (DGT printouts, exam submissions) | [O existence; prices TV] |

Angle: US tools are scheduling-first and US-DMV-shaped; Spanish legacy tools are desktop-era paperwork tools; nobody in ES combines web + CRM + lesson diary + payments + DGT convocatoria tracking in one modern SaaS. Akademate's multi-vertical platform is the wedge, told in driving language.

## F. SEO of the future landing

- **Primary keyword (EN):** driving school software.
- **Secondary (EN):** driving school management software; driving school scheduling software; driving school booking software; driving instructor software; driving school app. ES: software autoescuelas, programa gestión autoescuelas.
- **Title candidate (<60 chars):** "Driving School Software | Lessons, Vehicles & Exams" (51)
- **H1:** live page uses "Fill the diary. Pass more exams." Keep it: outcome-oriented, vertical-correct (diary = lesson diary).
- **FAQ (5 real buyer questions):**
  1. Can students book their own practice lessons without calling the school?
  2. How does the diary prevent double-booked monitors and cars?
  3. Does it handle DGT convocatorias, tasas and exam records? (ES) / DVSA test booking? (UK)
  4. Can I charge deposits and enforce a cancellation policy without being the bad guy?
  5. Does invoicing comply with Verifactu in Spain? [G/TV before claiming]

## Landing gap review (live page observed 2026-09-06)

- Present: hero ("Fill the diary. Pass more exams."), benefit bullets, stakeholder breakdown (owners/instructors/learners), module tabs (Lessons/Vehicles/Exams/Payments) labeled "Illustrative product example", workflow steps with "Powered by" labels, dual CTA ("Start free trial" hero + "Book a demo" header), no FAQ, no social proof.
- Critical dependency: the page sells the **vehicle + instructor diary** as the centerpiece while the module catalogue has no explicit vehicle-resource capability; copy must stay at "illustrative" until resource pairing + vehicle records are validated in product. [G/TV]
- The FAQ question about deposits/no-show policy is the conversion lever for the #1 pain (idle instructor+car time).

## Sources

raccautoescuela.es (+ blog tasas DGT) · bankinter.com/blog/finanzas-personales/coste-carne-conducir · autoescuelagala.com · autoescuelalamoderna.es · dgt.es (exámenes, criterios calificación) · sede.dgt.gob.es · simescar.com · adsplorer.com · reddrivingschool.com (+ book.redtraining.com) · 911drivingschool.com (SC/WA pages, seasonality post) · aceable.com (fall enrollment) · zutobi.com/us/driving-schools · reddit.com r/smallbusiness (driving school management thread) · reddit.com r/LearnerDriverUK (no-shows, rescheduling) · gov.uk (ADI standards check, indicators and triggers) · dmv.ca.gov · dmv.ny.gov · drivescout.com · teachworks.com/pricing · bookeo.com · crowjack.com (schedulers compared) · drovify.com · winautogest.com · galibo.net · practicavial.com · live: akademate.com/en/solutions/driving-schools

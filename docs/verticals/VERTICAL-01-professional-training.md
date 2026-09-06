# VERTICAL-01: Professional and regulated training

- **Live landing:** `akademate.com/en/solutions/professional-training` (ES: `/es/solutions/professional-training`)
- **Study status:** v1 COMPLETE (2026-09-06). Anchor case: CEP Formación (multi-site FP group, Tenerife).
- **Tag legend:** [O] Observed (source cited) · [H] Hypothesis (inferred, plausible, unverified) · [G] Product gap (do not claim in copy until built) · [TV] To validate with product/founder.

---

## A. Market and buyer persona

### Who buys
- SMB single-site center: the owner or academic director decides alone. [H]
- Multi-site group (3-15 sites): operations director or IT director; the admissions/marketing manager co-sponsors when the trigger is lead volume. [H]
- The Spanish anchor (CEP) operates as a multi-site group with sedes Norte / Sur / Santa Cruz and centralized management needs. [O, live cepformacion.com]

### Who uses it daily
- Matrícula/admin staff: enrollment, documentation, payments. [H]
- Academic coordinator: groups, convocatorias, timetables, FCT internships (work placements). [H]
- Teachers: attendance, grades, session lists. [H]
- Finance clerk: installments, invoicing, reconciliation. [H]

### Who the end learner is
- 16-25 year-olds pursuing official títulos (Grado Medio / Grado Superior), plus adult career-changers and unemployed learners in funded programs. [H]
- Mobile-first, price-sensitive; contacts via web form, WhatsApp or phone before enrolling. [O, CEP channel mix: form + WhatsApp + per-sede phone, cepformacion.com]

### Pains
1. **Operational:** fragmented tooling (spreadsheets + email + separate LMS + billing) and repetitive admin (confirmations, manual invoicing). [O, hovn.app training-center pains page; trainingorchestra.com]
2. **Operational:** scheduling conflicts: rooms, instructors and groups across sites. [O, hovn.app; trainingorchestra.com]
3. **Operational:** compliance and certificate tracking: keeping records audit-ready through certification processes. [O, hovn.app]
4. **Revenue:** lead leakage: programs invisible in search, over-reliance on directories and paid ads; Spanish vendors literally sell "gestión de leads" as a core academy feature. [O, hovn.app; bcsdata.es]
5. **Revenue:** enrollment drop-off and payment collection: group enrollments, discounts, waitlists and installment plans are named friction points. [O first part; collection impact H]

### Objections to buying software
- "Excel works; software is overhead" (small single-site centers, thin margins). [H]
- "My operation is too particular": convocatorias, módulos, títulos oficiales, FCT, funded-course rules; generic school SaaS feels wrong. [H]
- Migration fear: losing expedientes mid-cycle, staff retraining, low tech confidence. [H]
- RGPD: reluctance to host student records (often minors) in a third-party cloud. [H]
- "We already have an LMS / ERP": bundling skepticism. [H]

### Ticket and sales cycle
- SMB single-site: competitors like Acadesoft/iAkademy are low-ticket; Arlo entry tier $79/mo. [O, arlo.co pricing floor] Estimate ACV €1,000-6,000/yr. [H]
- Mid-size multi-site (500-3,000 students): per-student SIS pricing, e.g. Classter ~€8.50-21.5/active student/yr → ~€25,500/yr at 1,000 students. [O benchmark, classter.com/pricing] Estimate ACV €8,000-30,000. [H]
- Cycle: SMB weeks (1-2 demos); mid-size 1-3 months with a per-site pilot. [H]

## B. Business model of the vertical

- **How they monetize:**
  - Official ciclos de FP: ~€2,000-6,000 total. CESUR ~€3,000/academic year with financing plans; ILERNA €2,000-2,900 online (per módulo from ~€94-99 or per semester ~€625 with 0% financing); CEP sells 2 official ciclos at €6,000 (semipresencial, 500h internship). [O, cesurformacion.com; ilerna.es; cepformacion.com]
  - Private courses: €540-2,000 (CEP lists ~33). [O, cepformacion.com]
  - Publicly funded courses (free to employed/unemployed learners). [O, CEP]
  - US analog: program-level tuition (e.g. American Career College ADN ~$81,000) paid via federal financial aid (Title IV), grants, loans, not installments. [O, americancareercollege.edu]
- **Capacity:** plazas per convocatoria (the live Akademate page mocks "24 places in September intake"); rooms/labs per sede; FCT internship placements at partner companies. [O/H]
- **Seasonality:** presencial FP enrollment is a regulated annual window (ILERNA presencial matrícula opens once a year in January); online/distance operators run 2+ intakes (Sept/Feb); CESUR runs a February mid-year convocatoria. [O, ilerna.es; cesurformacion.com]
- **Multi-site:** yes for groups. CEP: 3 sedes. CESUR: 15+ sites. [O]
- **Regulation / compliance:**
  - Spain: opening a private center requires administrative authorization from the regional education authority (installations, minimum criteria, legal title to premises). [O, educacion.castillalamancha.es; munozabogadoseducacion.es]
  - Spain: issuing official FP títulos requires express authorization and registry of the center; teacher qualifications and ratios are checked. [O, edubcn.cat; camaratenerife.com]
  - Spain: "agencia de colocación" (placement agency) status requires separate authorization (CEP holds it). [O, cepformacion.com]
  - Spain: RGPD for student data (minors included). [H]
  - US: state license for private postsecondary schools (e.g. California BPPE) with mandatory annual reports; accreditation is a separate voluntary layer; federal Title IV aid requires accreditation + state authorization. [O, bppe.ca.gov; startatradeschool.com]

## C. Customer journey (vertical lexicon: Discover → Apply → Admissions → Matrícula → Deliver → Certify)

| Stage | Typical channel | Friction today | What Akademate must do |
|---|---|---|---|
| **Discover** | SEO per ciclo ("curso X en ciudad"), blog funnels (CESUR), Google Ads, directories | Programs invisible in search; slow first response [O] | Offer pages per ciclo/sede with SEO + structured data; CRM captures every enquiry from form/WhatsApp |
| **Apply (Solicitar información)** | Web form, WhatsApp, phone, walk-in | Manual follow-up, lead leakage between tools [O] | Leads & CRM with automation; response SLAs; campaign attribution |
| **Admissions (eligibility)** | Email documents, in-person interviews | Evidence scattered over email; no status visibility [H] | Admissions workflow: requirements checklist, evidence, interviews, approvals (already mocked on live page) |
| **Matrícula (enroll + pay)** | Desk/phone with installments | Paperwork + payment plans tracked by hand; failed installments drain cash [O/H] | Checkout with deposits and installment plans; plazas/waitlist per convocatoria; receipts |
| **Deliver (teach)** | Timetables in spreadsheets; external LMS for campus | Groups/rooms/instructor conflicts; attendance in paper [O; CEP external LMS observed: acaten.espacioaulavirtual.com] | Cohorts, timetables, locations, attendance with thresholds and alerts; campus/LMS integration rather than replacement |
| **Certify & place** | Manual certificate/record prep | Audit-ready records are painful; FCT paperwork manual [O/H] | Student records (expedientes), certificate issuance, FCT tracking; placement (agencia de colocación) follow-up |

## D. Module matrix (Akademate fit)

| Module (home canon) | Verdict | Rationale | Status |
|---|---|---|---|
| Web and commerce (site, CMS, domains, offer pages, SEO) | **Core** | The SEO funnel is how FP centers acquire (CESUR blog funnel observed); offer pages per ciclo are the lead engine | In product (pillar 1) [O] |
| Growth and admissions (Leads & CRM, campaigns, admissions, reservations, automation) | **Core** | Lead leakage is a named pain; admissions with eligibility/evidence is the regulated differentiator | In product (pillar 2) [O]; WhatsApp inbound capture [TV] |
| Bookings / waitlist / capacity | **Important** | Plazas per convocatoria and waitlists, not per-class booking | In product (Reservations) [O] |
| Courses / cohorts / schedules / locations | **Core** | The operational backbone: ciclos, módulos, grupos, convocatorias, sedes, aulas | In product (pillar 3) [O] |
| Attendance / QR / NFC / access | **Core** (attendance) / **Optional** (QR/NFC hardware access) | Attendance with thresholds (e.g. 25%/75% rules, alerts, internal-only visibility) is used daily in FP centers; QR/NFC door access is a nice-to-have | Attendance in product [O]; QR/NFC listed as "Campus operations roadmap" on /en/features [G/TV] |
| Campus and learning (LMS, gradebook, chat, certificates, learner analytics) | **Important** (LMS) / **Core** (certificates) | CEP already runs an external virtual campus (acaten.espacioaulavirtual.com): integrate, do not force replacement. Certificates/expedientes are table stakes for regulated training | LMS in product (pillar 5) [O]; certificates listed under pillar 5 but also in "Advanced learning" roadmap [TV]; external-LMS integration [G] |
| Payments and finance (checkout, billing, receivables, reconciliation) | **Core** | Matrícula + installment plans are universal (CESUR financing, ILERNA per módulo); failed collection hits cash flow | Checkout/Billing/Receivables in product (pillar 6) [O]; full accounting [G, "Expansion roadmap"] |
| Digital signage | **Optional** | Screens in sedes for convocatorias/announcements; low priority for this buyer | [G, "Campus communications roadmap"] |
| Library / inventory / equipment | **Optional** | Room and equipment booking is useful (aulas/taller), library is not the story | [G, "Expansion roadmap"] |
| Multi-site / brands / roles | **Core** | Groups run 3-15 sites with role separation (coordination, teachers, finance); shared standards, local execution | In product (Organisation, brands and domains) [O] |
| Insight and ecosystem (analytics, reports, APIs, integrations) | **Important** | Funnel + attendance + finance dashboards per sede; integrations (LMS, Stripe, Meta) | In product (pillar 8) [O] |

## E. Social proof and language

### Vocabulary (use these words, not generic "student/learner" everywhere)
- **ES:** alumno, ciclo (Grado Medio/Grado Superior), módulo, convocatoria, matrícula, expediente, sede, plaza, FCT / prácticas en empresa, título oficial, certificado de profesionalidad, agencia de colocación, cuota. [O, ilerna.es; cepformacion.com]
- **EN:** program, cohort, intake, enrollment, student record, accreditation, licensure, placement rate, financial aid (US), delegate (UK training vendors). [O for "delegate", hovn.app; rest standard usage H]

### Three credible claims + required proof
1. "From first enquiry to official certificate, in one system." → Needs an end-to-end demo recording and a pilot metric (time-to-enroll before/after). [TV]
2. "No learner slips through: attendance thresholds and automatic alerts." → Attendance thresholds exist in the tenant product (25%/75% rules, consecutive-absence alerts, internal-only). [O internal] Needs a public demo/screenshot. [TV]
3. "Run three sedes like one: one academic record per learner, per site and per group." → Needs a named multi-site case study; CEP is the natural anchor (learner quotes from CEP already appear on the Akademate home linking cepformacion.akademate.com [O, live home]). Needs permission to use the CEP brand and real metrics. [TV]

### Competitor software (for differentiation, not to copy)
| Product | Positioning | Price signal |
|---|---|---|
| Arlo | Training management + website for commercial training providers | from $79/mo [O, arlo.co] |
| Administrate | Enterprise full-lifecycle training management | custom/enterprise [O] |
| accessplanit | Training management + CRM, delegate tracking, profitability | quote-based [O] |
| Training Orchestra | Enterprise resource scheduling/optimization for training operators | per-instructor/session, annual [O] |
| Classter | All-in-one SIS+SMS+LMS with admissions CRM and billing | per student/year (~€8.50-21.5) [O, classter.com/pricing] |
| Acadesoft (ES) | Academy management: courses, groups, calendar, invoices | low-ticket [O] |
| FormaTool / BCS Data (ES) | "100% academias y centros de formación": leads to administration | [O, bcsdata.es] |
| Also in ES | AcademyGest, iAkademy, Cuotagest, Playoff Informática | [O, vendor sites] |

Differentiation angle: corporate-training suites (Arlo/Administrate) do not speak matrícula, convocatorias, expedientes or RGPD-FP; Spanish academy tools (Acadesoft et al.) rarely cover regulated compliance, multi-site governance and admissions depth. Akademate sits in between, anchored by a real regulated FP group (CEP).

## F. SEO of the future landing

- **Primary keyword (EN):** vocational school management software [H, based on observed competing title tags]. ES equivalent: software gestión centros de formación.
- **Secondary (EN):** training center management software; career college software; trade school management system; student information system for career colleges; enrollment CRM for training providers. ES: software para centros de formación, CRM formación matrículas, software gestión FP.
- **Title candidate (<60 chars):** "Software for Regulated Training Centers | Akademate" (51)
- **H1:** live page uses "Fill cohorts. Deliver with confidence." Keep it (it is outcome-oriented) or A/B against: "Enrol faster. Deliver compliantly. Graduate every cohort."
- **FAQ (5 real buyer questions):**
  1. Can we keep our current virtual campus (LMS) or must we migrate? → integration answer [TV depends on connector status].
  2. Does it handle convocatorias, plazas and installment matrícula payments?
  3. Is student data RGPD-compliant and EU-hosted? (minors included)
  4. Can we manage several sedes with different programs under one account, with separate roles?
  5. How do attendance rules and alerts work (thresholds, consecutive absences)?

## Landing gap review (live page observed 2026-09-06)

- Present: hero ("Akademate for Professional and regulated training", H1, promise), benefit bullets, 3 stakeholder cards (Admissions/Teachers/Leadership), interactive demo with tabs Programme/Admissions/Delivery/Finance, 4 workflow steps with "Powered by" labels, dual CTA ("Start free trial" hero + "Book a demo" header).
- Missing: **social proof** (no logo, quote or metric; CEP quotes exist on home but not here), **FAQ**, **compliance/authorization language** (the #1 trust lever for regulated buyers), pricing teaser, bridge to other models.
- CTA dependency: "Start free trial" points to `/en/registro?asunto=trial&vertical=professional-training`; self-serve trial availability must be confirmed [TV]. For this mid-ticket, regulated buyer, "Book a demo" should be the primary CTA.

## Sources

cepformacion.com · cesurformacion.com/matricula-cesur · ilerna.es/blog/precios-en-ilerna · ilerna.es/blog/matricularse-fp · americancareercollege.edu/catalog (tuition) · bppe.ca.gov · startatradeschool.com/bppe-licensing · educacion.castillalamancha.es (autorización centros) · edubcn.cat · camaratenerife.com · hovn.app/provider-resources/training-center-management-software · trainingorchestra.com/training-management-challenges/ · bcsdata.es/software-gestion-academias/ · classter.com/pricing · arlo.co · administrate.com · accessplanit.com · academygest.com · iakademy.com · cuotagest.com · playoffinformatica.com · live: akademate.com home, /en/features, /en/pricing, /en/solutions/professional-training

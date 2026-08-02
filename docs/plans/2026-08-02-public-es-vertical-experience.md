# Akademate public ES and vertical experience release

Date: 2026-08-02

Lane: `apps/web` public marketing only

Source: `11cf447bfaeb36007d0ce445e89accce90d9dd87`

Explicitly out of scope: CEP Formación, Akademate Next runtime, customer data, permissions and finance configuration.

## Optimised implementation prompt

Upgrade the complete public Akademate website into a genuinely bilingual, premium B2B SaaS experience. Spanish pages must be fully authored in Spanish, including navigation, accessibility labels, image alternatives, tooltips, catalogues and interactive previews. Audit every “Who it is for” route and preserve one maintainable dynamic architecture while making each vertical unmistakably specific through its audience, daily jobs, terminology, workflow, role story, CTA, SEO intent and dedicated photography. Present product previews as illustrative examples, preserve connector availability labels, avoid fabricated evidence and keep all commercial language positive. Every public page must retain a clear hero, responsive layout, localized metadata, canonical and language alternates. Add adversarial tests, run visual and network QA, and deploy only the public web after commit and push.

## Solution Registry

| Approach | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision |
|---|---:|---:|---:|---:|---:|---|
| Eight copied route pages | 7 | 3 | 3 | 5 | 4 | Rejected: fast visual variance, high translation and layout drift. |
| Shared route plus complete bilingual registries and media slots | 9 | 9 | 9 | 8 | 9 | Selected: one rendering contract, explicit content, independent scenes and fail-closed tests. |
| Runtime translation of one English registry | 5 | 7 | 8 | 8 | 5 | Rejected: produced generic placeholders and hid vertical meaning. |

## Quality objectives

- [x] Preserve one dynamic route and stable slugs.
- [x] Replace heuristic Spanish copy with 32 explicitly authored moments.
- [x] Localize the directory, desktop dropdown and mobile navigation.
- [x] Localize capabilities, image alternatives, navigation ARIA and connector tooltips.
- [x] Mark mock data as an illustrative product example.
- [x] Show connector status in compact and touch layouts.
- [x] Add hover and keyboard-focus activation to vertical tabs.
- [x] Add a tailored role narrative and second photograph to every vertical.
- [x] Add `/cursos` and `/download` to the localized sitemap.
- [x] Complete build and full test suite.
- [x] Complete desktop/mobile browser, console, network and overflow QA.
- [x] Commit and push the isolated public branch.
- [x] Deploy only `apps/web` and verify the served revision and Spanish body copy.

## Release evidence

- Functional commit and live revision: `6d9ba8ee90ded3f6433934088e9ff6f0187dfacf`.
- Branch: `codex/akademate-public-es-verticals`.
- Unit/adversarial suite: 19 files, 116 tests, all passing.
- TypeScript: `tsc --noEmit` passing.
- Production build: 80 routes generated.
- Docker artifact: `linux/amd64`, image `sha256:cc9ae4d127813f7424f7c2743fbcb2c1472f7f8634ef8f331b0014bb18006120`.
- Live health: five consecutive checks returned the exact functional revision before acceptance.
- Live vertical smoke: 8/8 Spanish routes returned 200 with their specific copy, canonical and EN/ES/x-default alternates.
- Live media smoke: 8/8 new editorial assets returned 200 as JPEG.
- Browser QA: desktop 1440×1000 and narrow/mobile viewport; no horizontal overflow; no console errors; hero and secondary images reached non-zero natural dimensions.
- Visual depth: `/es/solutions` and `/es/solutions/wellness` inspected directly; every remaining vertical was covered by route/content/media assertions and HTTP live smoke.
- Tracker gate: no GA, GTM or Meta Pixel tokens found in the served Spanish solutions surface.
- Isolation: all non-web container IDs were byte-for-byte identical before and after deployment.
- Rollback: previous image `11cf447bfaeb36007d0ce445e89accce90d9dd87` retained and validated after an automatic first-attempt rollback.
- Operational note: production disk finished at 87% used with 4.9 GB free; cleanup is recommended before the next large image release.

## Vertical coverage

| Vertical | Operational focus | Dedicated secondary scene | CTA intent |
|---|---|---|---|
| Professional and regulated training | admissions, evidence, cohorts, assessment and cohort finance | coordinator and teacher inside active vocational delivery | review admissions flow |
| Yoga, pilates and wellness | class capacity, memberships, packs, instructor schedule and check-in | member QR arrival with studio preparation | design studio operation |
| Sports academies and clubs | trials, teams, guardians, facilities and season fees | athlete assessment with coach, coordinator and guardian | plan next season |
| Seasonal camps | weeks, ages, deposits, consent, health notes, arrival and pickup | family check-in with activity leaders | prepare next camp |
| Music, dance and performing arts | disciplines, specialist rooms, recurring lessons, progress and recitals | shared dance and piano studio coordination | organise classes and performances |
| Online schools and cohorts | admissions, time zones, live production, tasks, chat and progress | educator and producer running a live cohort | design next cohort |
| Language academies | placement, levels, group matching, hybrid learning and monthly billing | spoken placement interview with schedule coordination | organise placement and groups |
| Multi-site groups and franchises | brands, entities, permissions, local operation and group reporting | central and local managers with a remote campus lead | map the academy network |

## Claim and evidence boundaries

- Product interfaces on these pages use sample data and must display “Illustrative product example” / “Ejemplo ilustrativo de producto”.
- Numerical values in mock screens are interface examples, not customer results or Akademate performance claims.
- Connector state remains visible: Available, Connector-ready, Roadmap or Payment method.
- Generated editorial photographs illustrate operating contexts and are not customer, learner or testimonial evidence.
- No certification, customer adoption, review score or measured outcome is inferred from these assets.

## Generated asset manifest

All assets were generated with the built-in image generation workflow on 2026-08-02, human-reviewed for composition, anatomy, visible text and placement, converted to 1600 px JPEG at quality 82, and stored under `apps/web/public/images/marketing`.

| Asset | Placement | Restrictions |
|---|---|---|
| `professional-training-cohort-operations-v2.jpg` | professional training role story | illustrative; no real client or cohort |
| `wellness-member-checkin-v1.jpg` | wellness role story | illustrative; QR is decorative and non-functional |
| `sports-trial-team-placement-v1.jpg` | sports role story | illustrative; no real club or athlete |
| `seasonal-family-checkin-v1.jpg` | seasonal role story | illustrative; no real participant record |
| `performing-arts-studio-operations-v1.jpg` | performing arts role story | illustrative; no real school or performance |
| `online-cohort-live-production-v1.jpg` | online cohort role story | illustrative; screens contain no authoritative product UI |
| `languages-placement-scheduling-v1.jpg` | languages role story | illustrative; no real level decision or learner |
| `networks-central-local-operations-v1.jpg` | multi-site role story | illustrative; no real group, campus or financial data |

## Adversarial validation checklist

1. Edge input: unknown vertical and incomplete locale content must fail closed.
2. Error condition: deleting a Spanish vertical, moment or media asset must fail tests or build.
3. Untested variation: every one of the eight slugs must preserve its own vocabulary, roles, CTA and unique image.
4. No forbidden placeholders: `Opción disponible`, `Actualización operativa disponible` and `indicador operativo`.
5. No English vertical titles or capabilities in Spanish desktop/mobile navigation.
6. No hidden connector readiness state on compact layouts.
7. All localized routes keep canonical, EN/ES alternates and valid internal links.
8. Desktop and mobile render without overflow, duplicate React keys, console errors or unexpected network requests.

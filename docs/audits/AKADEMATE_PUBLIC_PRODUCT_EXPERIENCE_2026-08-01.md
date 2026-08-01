# Akademate public product experience expansion — 2026-08-01

## Scope

- Surface: `akademate.com` public SaaS website only.
- Exclusion: no CEP repository, runtime, container, tenant data, traffic or deployment changes.
- Objective: explain Akademate as an academy operating system before presenting domains, embeds or shareable course pages.

## Home architecture

The Home narrative now moves through:

1. Product definition and proof.
2. Academy team, teacher and learner workspaces.
3. The operational problem and connected learner journey.
4. Core modules.
5. Gamified setup from blueprint to branded multi-campus academy.
6. Public website, course pages and conversion.
7. Integration ecosystem, verticals, pricing, governance and conversion.

The customer-model carousel uses the same lateral container as the rest of the page and retains a controlled scroll cue.

## Product experiences

- Three role experiences use dedicated generated assets for centre teams, teachers and learners.
- The academy setup journey has six stages: blueprint, campuses, programmes, people, learning and operations, and academy live.
- Campuses cover multiple physical locations, rooms, facilities and an online campus.
- Features exposes 19 modules through one accessible interactive explorer.
- Eight vertical pages use four tailored product moments each, with their own fields, activities, facilities and payment models.

## Integration and brand registry

- Local SVG assets identify payment, growth, video, domain, finance, identity and automation services.
- Registry states distinguish `Available`, `Connector-ready`, `Roadmap` and `Payment method`.
- Visa, Mastercard, Apple Pay and Google Pay are represented as methods delivered through the configured provider, not direct Akademate partnerships.
- Brand appearance does not imply endorsement, certification or contractual availability.
- No tracker is loaded by displaying local brand assets.

## Generated image assets

- `akademate-academy-setup-3d-v1.jpg`
- `akademate-operations-experience-v1.jpg`
- `akademate-teacher-experience-v1.jpg`
- `akademate-learner-experience-v1.jpg`

The selected images were generated with the built-in image generation tool, visually inspected, copied into the project and converted from PNG to high-quality JPEG. The conversion reduced their combined size from approximately 7 MB to 1.6 MB.

## Local evidence

- TypeScript: pass.
- Public web Vitest: 40/40.
- Next production build: pass, 77 routes generated.
- Public Playwright suite: 10/10.
- Visual QA: desktop and mobile for Home, Features and Wellness.
- Adversarial setup checks: document overflow, internal clipping and long-label variation.
- Trackers before consent: none requested.
- Console/network failures on key routes: none observed.

## Basal evidence gap

The broad root Vitest command discovers unrelated tenant, admin, Payload and database suites. In the current checkout it reports 1,856 passing, 186 failing and 769 skipped tests. Failures include missing historical routes, absent database configuration and out-of-scope tenant tests. They were not changed or represented as public-web regressions.

Production is not considered updated until the deployed `/api/health` revision equals the commit SHA and the live public suite passes against the served artifact.

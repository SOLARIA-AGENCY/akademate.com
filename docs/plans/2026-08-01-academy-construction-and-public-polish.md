# Academy construction sequence and public polish

Date: 2026-08-01
Scope: public `akademate.com` and a reusable Akademate SaaS onboarding contract. CEP is excluded.

## Intent

Replace abstract setup percentages with six visually continuous construction states of one compact academy. At the same time, close the public-site issues identified during live review: carousel pacing, open card borders, malformed attendee crops and clipped governance copy.

## Visual thesis

One compact academy materialises layer by layer on a deep-blue architectural plane, preserving the same isometric camera, footprint and geometry from blueprint to a warm, operational Academy Live render.

## Solution Registry

| Approach                                                  | Correctness | Maintainability | Scalability | Simplicity | Pragmatism |
| --------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: |
| Six unrelated generated images                            |           5 |               6 |           6 |          8 |          5 |
| Canonical live master plus five geometry-preserving edits |           9 |               9 |           9 |          7 |          9 |
| One six-panel contact sheet cropped into stages           |           6 |               7 |           5 |          9 |          6 |

Selected: canonical live master plus five edits. Each stage is derived from the same master to minimise geometry and camera drift.

## Checklist

- [x] Persist the six optimised academy-stage images in the public asset tree.
- [x] Create a shared `@akademate/ui/academy-setup` registry for public and future tenant onboarding use.
- [x] Replace percentage masking with a stage-specific image and accessible stage navigation.
- [x] Centre the academy-client heading and slow both marquee rows substantially.
- [x] Replace the customer-type rail with an accessible, very slow, infinite and manually scrollable carousel.
- [x] Add a visible position indicator and reduced-motion behaviour.
- [x] Close the outer border of every commercial card grid that currently uses only top and bottom borders.
- [x] Re-crop the four attendee portraits and increase their visible size.
- [x] Remove defensive paragraph clipping and shorten source copy where required.
- [x] Give GDPR, EU AI Act, ISO 27001, SOC 2 and OWASP distinct visual framework marks.
- [x] Add source-linked trust signals without inventing third-party ratings or certifications.
- [x] Separate Blog and News into distinct SEO routes and editorial systems.
- [x] Add tests for stage assets, no percentages, carousel semantics, border closure, complete copy and portraits.
- [x] Validate typecheck, unit tests, production build, desktop/mobile browser behaviour, console and network.

## Boundaries

- This work does not mutate CEP code, runtime, data, containers or deployment.
- The shared setup registry is integration-ready; it does not claim that tenant provisioning or onboarding persistence is implemented.
- Governance marks are informational framework references, not certification claims.
- Client names remain text wordmarks because no verified customer-logo asset pack has been supplied.

# Akademate public CRO and international release

## Scope and boundary

- Service: `akademate-web` for `akademate.com` and `www.akademate.com` only.
- Excluded: CEP code, runtime, data, roles, finance, infrastructure and deployment.
- Commercial language stays affirmative and evidence-aware.
- Unverified customer, ROI, migration-time and support-response claims are not published.

## Visual thesis

Akademate is presented as a premium operational product for academy owners and teams: deep navy
for decisive product moments, electric blue for wayfinding, editorial photography for human
context, and concrete product previews for operational proof. Layouts are compact, image-led and
product-first; motion is slow, purposeful and disabled when reduced motion is requested.

## Content and interaction thesis

The public journey moves from product promise to operating proof: understand the platform, see the
roles and modules, recognise the academy model, compare commercial scope and book a relevant demo.
Locale selection is explicit and persistent. Existing public URLs remain valid while `/en` and
`/es` provide indexable international entry points.

## Solution Registry

| Approach                                                    | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision                                            |
| ----------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: | --------------------------------------------------- |
| Duplicate every locale route and page                       |           8 |               4 |           5 |          3 |          4 | Rejected: content drift and route duplication       |
| Native locale routing plus central copy and shared surfaces |           9 |               9 |           9 |          7 |          9 | Selected                                            |
| Client-side DOM translation                                 |           3 |               3 |           4 |          8 |          4 | Rejected: weak SEO and hydration/accessibility risk |

## Delivery checklist

- [x] Reconstruct public worktree and deployment authority.
- [x] Confirm CEP is outside the release boundary.
- [x] Add persistent English/Spanish locale routing and selector.
- [x] Add localized metadata, canonicals and `hreflang` entries.
- [x] Ensure every commercial, editorial and legal page has a clear hero.
- [x] Refine Home, Features, Solutions, Pricing and Contact CRO copy.
- [x] Replace example-customer claims with honest model coverage.
- [x] Keep pricing states explicit: Included, Paid extension, Enterprise scope, Not included.
- [x] Keep QR, NFC/RFID, physical access and Digital Signage as paid extensions.
- [x] Validate no marketing or analytics tracker runs before consent.
- [x] Run unit, adversarial, type, build, desktop/mobile, console and network checks.
- [ ] Commit, push and deploy only `akademate-web`.
- [ ] Verify the exact served artifact on `https://akademate.com`.

## Local release evidence

- Public web unit and adversarial tests: 109/109 passing across 18 test files.
- TypeScript: passing for `@akademate/web`.
- Next.js production build: passing, 80 generated pages.
- Playwright production-artifact suite: 70/70 passing in 37.4 seconds.
- Interaction coverage: pointer hover, keyboard focus, click/touch fallback and ARIA tab/panel
  semantics for role, distribution, application and feature-module explorers.
- Feature catalogue coverage: all 23 modules traversed in Spanish; fixed desktop grid verified
  without an internal vertical scrollbar.
- Browser coverage: desktop and mobile overflow, public links and fragments, image assets,
  console errors, failed network assets, tracker absence and consent fail-closed behaviour.
- Visual artifacts: `/tmp/akademate-es-desktop.png` and `/tmp/akademate-es-mobile.png`.
- Claim boundary: unsupported customer counts, ROI percentages, migration times and support-response
  guarantees from the source brief were not published.
- Broad monorepo suite: attempted separately and remains baseline-red in unrelated authenticated,
  database-backed and tenant application lanes; the scoped public web suite is green.

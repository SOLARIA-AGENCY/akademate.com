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
- [ ] Add persistent English/Spanish locale routing and selector.
- [ ] Add localized metadata, canonicals and `hreflang` entries.
- [ ] Ensure every commercial, editorial and legal page has a clear hero.
- [ ] Refine Home, Features, Solutions, Pricing and Contact CRO copy.
- [ ] Replace example-customer claims with honest model coverage.
- [ ] Keep pricing states explicit: Included, Paid extension, Enterprise scope, Not included.
- [ ] Keep QR, NFC/RFID, physical access and Digital Signage as paid extensions.
- [ ] Validate no marketing or analytics tracker runs before consent.
- [ ] Run unit, adversarial, type, build, desktop/mobile, console and network checks.
- [ ] Commit, push and deploy only `akademate-web`.
- [ ] Verify the exact served artifact on `https://akademate.com`.

# Akademate Next UI Audit and Migration Registry

Date: 2026-08-01
Preset: `saas-dashboard`
Evidence boundary: source inventory and local Campus build; authenticated visual QA remains pending.

## Inventory

- `apps/tenant-admin`: 177 page/layout files.
- `apps/admin-client`: 29 page/layout files.
- `apps/campus`: 12 page/layout files.
- `apps/ops`: 11 page/layout files.
- Total tracked surface for this audit: 229 files.
- Local primitive families exist in tenant-admin, admin-client, portal and web.
- Before this pass, `packages/ui` exposed tokens and one `Pill`; it was not a component authority.

## Baseline score

| Area | Score | Evidence |
|---|---:|---|
| Dashboard ergonomics | 3/5 | Functional screens, but shells and data states differ by app. |
| Layout and composition | 3/5 | Responsive fragments exist; no canonical workspace shell. |
| Interaction design | 3/5 | Strong local components, duplicated behavior and states. |
| Accessibility | 3/5 | Some focus/ARIA support; not governed across all families. |
| Frontend implementation | 2/5 | Four local primitive families and minimal shared package. |
| Design system consistency | 2/5 | Fonts, radii, sidebar and surface language drift by app. |
| Production polish | 2/5 | Visual QA and authenticated state matrix incomplete. |

Overall baseline: **2.6/5**. This is a structural baseline, not a visual certification.

## Solution Registry

| Approach | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision |
|---|---:|---:|---:|---:|---:|---|
| Central authority plus migration pilots | 9 | 9 | 9 | 7 | 9 | Selected |
| Restyle each app using its local primitives | 7 | 4 | 3 | 8 | 5 | Rejected: preserves drift |

The selected approach establishes tokens, primitives and composed workspace patterns in `packages/ui`, migrates one bounded workflow, verifies it, and then repeats by screen family.

## Migration checklist

- [x] Inventory page/layout surface and primitive families.
- [x] Define shared token authority and dark navy workspace sidebar.
- [x] Add shared Button, Badge, Card, Progress and Skeleton primitives.
- [x] Add shared WorkspaceShell, navigation, PageHeader, MetricCard and EmptyState patterns.
- [x] Migrate Campus dashboard to shared workspace/primitives.
- [x] Verify Campus desktop/mobile with synthetic authorized state; no overflow, console or request errors.
- [ ] Verify Campus against an isolated real authenticated runtime.
- [ ] Migrate Campus progress, attendance and certificates.
- [ ] Audit and migrate tenant-admin dashboard/navigation.
- [ ] Audit and migrate student/staff/course/course-run record views.
- [ ] Audit and migrate tables, filters, forms, dialogs and empty/error/loading states.
- [ ] Audit admin-client and ops.
- [ ] Remove local duplicates only after every consumer has migrated.
- [ ] Record per-batch before/after scores and visual evidence.

## Quality gates per batch

1. No hardcoded tenant identity in shared primitives.
2. Keyboard focus, semantic landmarks and AA-oriented tokens.
3. Mobile, tablet and desktop screenshots.
4. Loading, empty, error, long-text and unauthorized states.
5. Narrow tests, app typecheck/build, then the full Akademate Next loop.
6. Commit, push, deployment and live verification reported independently.

## Pilot re-audit: Campus dashboard

| Area | Before | After | Status |
|---|---:|---:|---|
| Dashboard ergonomics | 3/5 | 4/5 | Improved |
| Layout and composition | 3/5 | 4/5 | Improved |
| Interaction design | 3/5 | 4/5 | Improved |
| Accessibility | 3/5 | 4/5 | Improved |
| Frontend implementation | 2/5 | 4/5 | Improved |
| Production polish | 2/5 | 4/5 | Improved |

Pilot score: **4.0/5**. The full 229-screen programme remains at its structural baseline until further families migrate.

Visual evidence used a synthetic authorized browser state against the local production build. Desktop and mobile layouts had no horizontal overflow; the final console was empty and all observed network requests returned 200/304. This does not prove real authentication, data, socket or deployment behavior.

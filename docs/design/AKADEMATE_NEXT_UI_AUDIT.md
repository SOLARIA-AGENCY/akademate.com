# Akademate Next UI Audit and Migration Registry

Date: 2026-08-03
Preset: `saas-dashboard`
Evidence boundary: deterministic source inventory, synthetic Campus QA and an isolated authenticated
Akademate Next tenant-admin runtime. No production deployment or live-domain verification is implied.

## Inventory

- 240 App Router pages and 18 layouts are tracked across seven apps.
- `apps/tenant-admin` contains 171 pages; `admin-client` 27; `campus` 11; `ops` 10;
  `payload` 4; `portal` 4; and public `web` 13.
- 84 local primitive files remain across tenant-admin, admin-client, portal and web.
- The page layer contains 668 local primitive imports and 166 hardcoded colour utilities.
- Fifteen source consumers use the shared `@akademate/ui` authority; seven are page files.
- Five sidebar source files remain across admin-client and tenant-admin.

Authoritative inventory: [akademate-next-ui-inventory.json](./akademate-next-ui-inventory.json).
Human-reviewed exceptions and visual evidence:
[akademate-next-ui-audit-overrides.json](./akademate-next-ui-audit-overrides.json).

Regenerate only after reviewing the route delta:

```bash
corepack pnpm audit:ui:write
corepack pnpm audit:ui
```

The check is deterministic and fails when pages, layouts, primitives, sidebar files or measured
page-level design debt drift from the committed snapshot.

## Baseline score

| Area                      | Score | Evidence                                                      |
| ------------------------- | ----: | ------------------------------------------------------------- |
| Dashboard ergonomics      |   3/5 | Functional screens, but shells and data states differ by app. |
| Layout and composition    |   3/5 | Responsive fragments exist; no canonical workspace shell.     |
| Interaction design        |   3/5 | Strong local components, duplicated behavior and states.      |
| Accessibility             |   3/5 | Some focus/ARIA support; not governed across all families.    |
| Frontend implementation   |   2/5 | Four local primitive families and minimal shared package.     |
| Design system consistency |   2/5 | Fonts, radii, sidebar and surface language drift by app.      |
| Production polish         |   2/5 | Visual QA and authenticated state matrix incomplete.          |

Overall baseline: **2.6/5**. This is a structural baseline, not a visual certification.

## Solution Registry

| Approach                                    | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision                  |
| ------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: | ------------------------- |
| Central authority plus migration pilots     |           9 |               9 |           9 |          7 |          9 | Selected                  |
| Restyle each app using its local primitives |           7 |               4 |           3 |          8 |          5 | Rejected: preserves drift |

The selected approach establishes tokens, primitives and composed workspace patterns in `packages/ui`, migrates one bounded workflow, verifies it, and then repeats by screen family.

## Migration checklist

- [x] Inventory page/layout surface and primitive families.
- [x] Add deterministic per-route registry and a drift gate to Codex Loop.
- [x] Define shared token authority and dark navy workspace sidebar.
- [x] Add shared Button, Badge, Card, Progress and Skeleton primitives.
- [x] Add shared WorkspaceShell, navigation, PageHeader, MetricCard and EmptyState patterns.
- [x] Migrate Campus dashboard to shared workspace/primitives.
- [x] Migrate Campus progress, attendance and certificates to the shared workspace.
- [x] Verify Campus desktop/mobile with synthetic authorized state; no overflow, console or request errors.
- [ ] Verify Campus against an isolated real authenticated runtime.
- [x] Audit and migrate tenant-admin dashboard/navigation.
- [ ] Audit and migrate student/staff/course/course-run record views.
- [ ] Audit and migrate tables, filters, forms, dialogs and empty/error/loading states.
- [ ] Audit admin-client and ops.
- [ ] Remove local duplicates only after every consumer has migrated.
- [ ] Record per-batch before/after scores and visual evidence.

## Audit progress

| Evidence                                      | Verified | Total | Progress |
| --------------------------------------------- | -------: | ----: | -------: |
| Desktop                                       |        7 |   240 |     2.9% |
| Mobile                                        |        7 |   240 |     2.9% |
| Accessibility                                 |        7 |   240 |     2.9% |
| Loading, empty, error and long-content states |        4 |   240 |     1.7% |

`verified-synthetic` means the route was inspected using a controlled local state. It does not
prove real authentication, persisted data, sockets, external integrations or a deployed artifact.

## Quality gates per batch

1. No hardcoded tenant identity in shared primitives.
2. Keyboard focus, semantic landmarks and AA-oriented tokens.
3. Mobile, tablet and desktop screenshots.
4. Loading, empty, error, long-text and unauthorized states.
5. Narrow tests, app typecheck/build, then the full Akademate Next loop.
6. Commit, push, deployment and live verification reported independently.

## Pilot re-audit: Campus dashboard

| Area                    | Before | After | Status   |
| ----------------------- | -----: | ----: | -------- |
| Dashboard ergonomics    |    3/5 |   4/5 | Improved |
| Layout and composition  |    3/5 |   4/5 | Improved |
| Interaction design      |    3/5 |   4/5 | Improved |
| Accessibility           |    3/5 |   4/5 | Improved |
| Frontend implementation |    2/5 |   4/5 | Improved |
| Production polish       |    2/5 |   4/5 | Improved |

Pilot score: **4.0/5**. The full 240-screen programme remains at its structural baseline until further families migrate.

Visual evidence used a synthetic authorized browser state against the local production build. Desktop and mobile layouts had no horizontal overflow; the final console was empty and all observed network requests returned 200/304. This does not prove real authentication, data, socket or deployment behavior.

## Tenant-admin re-audit: Next operations dashboard and shell

| Area                    | Before | After | Status   |
| ----------------------- | -----: | ----: | -------- |
| Dashboard ergonomics    |    2/5 |   4/5 | Improved |
| Layout and composition  |    3/5 |   4/5 | Improved |
| Interaction design      |    2/5 |   4/5 | Improved |
| Accessibility           |    2/5 |   4/5 | Improved |
| Frontend implementation |    2/5 |   4/5 | Improved |
| Production polish       |    2/5 |   4/5 | Improved |

Batch score: **4.0/5**. The dashboard now consumes one Next-native, bounded projection; renders
summary, operational priorities, upcoming runs, recent admissions and quick actions through shared
`@akademate/ui` patterns; and uses the runtime-scoped navy sidebar requested for Akademate Next.
Legacy runtime tokens remain unchanged.

Authenticated browser evidence used a production Next build, PostgreSQL 16, an exact signed Next
session and two isolated tenants. The two tenants returned deliberately different metric sets
(`1|1|1` and `2|0|1` for active learners, teachers and courses). A learner role was rejected, and
the application role could not read `students` or `staff` directly after the append-only hardening
migration. Desktop and mobile returned zero console errors, failed HTTP responses, tracker requests
or horizontal overflow. Ninety-two aborted requests were browser-cancelled Next prefetches and are
reported separately rather than counted as successful or failed HTTP responses.

Visual evidence:

- `.codex-loop-runs/next-public-offer-browser/desktop-dashboard-baseline.png`
- `.codex-loop-runs/next-public-offer-browser/mobile-dashboard-baseline.png`
- `.codex-loop-runs/next-public-offer-browser/mobile-dashboard-priorities.png`
- `.codex-loop-runs/next-public-offer-browser/mobile-dashboard-programming.png`
- `.codex-loop-runs/next-public-offer-browser/mobile-dashboard-activity.png`
- `.codex-loop-runs/next-public-offer-browser/mobile-dashboard-footer.png`

This batch does not certify every tenant-admin screen, real external payment settlement, production
realtime delivery or a deployed artifact. Those remain separate gates.

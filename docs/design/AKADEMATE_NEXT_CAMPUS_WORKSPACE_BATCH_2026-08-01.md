# Akademate Next Campus Workspace Batch

Date: 2026-08-01

Scope: Campus dashboard, progress, attendance and certificates in the isolated Akademate Next
worktree. CEP runtime, data, configuration and deployment are excluded.

## Visual thesis

A calm operational workspace with a dark navy navigation anchor, neutral Shadcn surfaces, concise
utility copy and one blue action colour. Cards are used only for metrics, bounded records and state.

## Solution Registry

| Approach                                        | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision                                       |
| ----------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: | ---------------------------------------------- |
| Restyle each page locally                       |           6 |               4 |           4 |          8 |          5 | Rejected; preserves navigation and state drift |
| Shared package primitives plus one Campus frame |           9 |               9 |           9 |          7 |          9 | Selected                                       |
| Move every Campus route into a new route group  |           8 |               8 |           8 |          4 |          5 | Deferred; larger routing and auth blast radius |

## Changes

- Added shared `Alert`, `AlertTitle` and `AlertDescription` primitives using semantic tokens.
- Added one `CampusWorkspace` frame with dashboard, progress, attendance, certificates and logout.
- Replaced mobile horizontal navigation with a visible 2×2 navigation grid.
- Replaced static progress figures with values derived from the authenticated dashboard contract.
- Added loading, empty and error states using shared components.
- Validated certificate document URLs; only local paths and HTTP(S) targets are actionable.
- Disabled navigation prefetch to the server-rendered certificates route after browser QA exposed
  aborted background RSC requests.

## Authorization finding and boundary

The shadow QR endpoint accepted `userId` and `enrollmentId` from the browser, queried Payload
without forwarding a Campus session, inferred class times from the QR timestamp and exposed QR
generation without staff authorization. It has been replaced by a `503`, `private, no-store`
fail-closed boundary.

QR attendance remains pending until the canonical tenant-admin API can derive all of the following
server-side:

1. authenticated Campus student and tenant;
2. active enrollment belonging to that student;
3. persisted course-run session, start/end time and location;
4. non-replayable signed QR challenge;
5. idempotent attendance write and audit event.

The UI displays `Extensión no configurada` and no longer sends mock identities or shows a mock
attendance percentage.

## Visual evidence

- [Progress desktop](./evidence/2026-08-01-campus-workspace/progress-page-desktop.png)
- [Progress mobile](./evidence/2026-08-01-campus-workspace/progress-page-mobile.png)
- [Attendance desktop](./evidence/2026-08-01-campus-workspace/attendance-page-desktop.png)
- [Attendance mobile](./evidence/2026-08-01-campus-workspace/attendance-page-mobile.png)
- [Certificates desktop](./evidence/2026-08-01-campus-workspace/certificates-page-desktop.png)
- [Certificates mobile](./evidence/2026-08-01-campus-workspace/certificates-page-mobile.png)

The browser used a synthetic authenticated session and synthetic dashboard response. Certificates
kept the real unavailable-adapter error state. This proves layout and state presentation only; it
does not prove authenticated persistence or certificate retrieval.

## Validation

- 131 Campus unit/component tests passed.
- UI package build, Campus typecheck and Campus production build passed.
- Six Playwright cases passed across 1440×1000 and 390×844.
- Browser assertions covered navigation visibility, active state, horizontal overflow, console
  errors and failed browser requests.
- Three adversarial boundaries: manipulated QR identity, unsafe certificate URL and out-of-range
  progress data.

## Remaining gaps

- Implement the authenticated attendance write in tenant-admin after the Next attendance/session
  schema is authoritative.
- Replace the legacy certificate adapter with a Campus-session-aware endpoint.
- Verify all four routes against the isolated database and a real Campus session.
- Capture loading, empty, long-content and success certificate states before marking them complete.

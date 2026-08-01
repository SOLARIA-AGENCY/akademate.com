# Native apps public preview

Date: 2026-08-01

Scope: public `akademate.com` only.

Release boundary: this plan publishes product previews, not native binaries.

## Objective

Show how Akademate will extend from the responsive web workspace to focused Mac, iPhone and iPad experiences without creating a false download or availability claim.

## Solution Registry

| Approach                                                      | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision                                                             |
| ------------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: | -------------------------------------------------------------------- |
| Static store-style buttons with disabled links                |           4 |               5 |           5 |          9 |          5 | Reject: resembles a broken or unavailable download                   |
| Central device registry, reusable preview and dedicated route |           9 |               9 |           9 |          8 |          9 | Select: one source for status, copy, images and tests                |
| Build and distribute native shells now                        |           5 |               5 |           7 |          2 |          3 | Reject for this release: no signing, notarisation or store readiness |

## Public composition

- Home and Features reuse one `AppDownloadShowcase` component.
- `/download` introduces the device family, then offers accessible Mac, iPhone and iPad tabs.
- One combined visual and one image per device keep the story concrete without implying a released binary.
- Navigation and footer expose `/download` as a roadmap destination.

## Claim contract

- Every device is visibly labelled `Coming soon`.
- The page states that no application download is available yet.
- There are no App Store badges, package links, QR codes, fake progress states or disabled download buttons.
- Device imagery is an Akademate product concept, not evidence of Apple review or distribution.

## Future product phases

1. Responsive/PWA behavior and shared design tokens.
2. Native authentication, tenant selection and secure session storage.
3. Role-focused workflows for teams, teachers and learners.
4. Offline and notification contracts with explicit conflict handling.
5. macOS signing/notarisation and iOS/iPadOS TestFlight review.
6. Store release only after privacy declarations, support paths and release evidence are complete.

## Verification checklist

- [x] Device status and content centralized.
- [x] Distinct combined, Mac, iPhone and iPad visuals.
- [x] Keyboard-accessible tabs with associated panels.
- [x] Internal navigation and footer links resolve.
- [x] Desktop and mobile show no horizontal overflow.
- [x] No download/install/store link exists.
- [x] E2E verifies the honest `Coming soon` boundary.
- [ ] Native packages, signing and store availability are intentionally not claimed.

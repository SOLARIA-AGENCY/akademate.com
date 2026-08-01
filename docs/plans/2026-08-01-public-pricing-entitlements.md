# Public Pricing Entitlements

Status: deployed and live-verified

Scope: `akademate.com/pricing` and its centralized public pricing catalogue.

## Decision

Pricing separates four states:

1. **Included** — part of the stated plan scope.
2. **Paid extension** — enabled through an additional commercial module.
3. **Enterprise scope** — defined inside a tailored Enterprise agreement.
4. **Not included** — unavailable in that plan.

The phrase `Optional` is insufficient because it does not say whether a capability changes the commercial scope. Public pricing therefore uses `Paid extension` wherever an extra Akademate module is required.

## Solution Registry

| Approach                         | Core idea                                                                  | Correctness | Maintainability | Scalability | Simplicity | Pragmatism |
| -------------------------------- | -------------------------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: |
| A. Page-local comparison         | Expand the existing tuples directly inside Pricing                         |           7 |               5 |           5 |          8 |          6 |
| B. Central entitlement catalogue | Store plans, statuses, extensions and external costs in one typed registry |           9 |               9 |           9 |          7 |          9 |

Selected: **B. Central entitlement catalogue**.

## Paid-extension boundary

The following capabilities are never represented as included in Launch, Business or Enterprise base scope:

- QR attendance and mobile check-in.
- NFC and RFID identities.
- Physical access readers and sensors.
- Digital Signage.
- Advanced finance and accounting.
- HR and workforce management.
- Library, inventory and facilities.
- AI workspace and MCP.

## Separate external costs

The proposal must distinguish Akademate fees from:

- payment-provider transaction and account fees;
- advertising spend and external production;
- domains, messaging, video and third-party licences;
- access-control hardware, cards, readers, sensors and installation;
- Digital Signage screens, players, mounting and installation;
- migration, data remediation and bespoke integration work.

## Evidence

- [x] 50 comparison capabilities across seven categories.
- [x] Eight paid extensions with explicit included scope and extra costs.
- [x] QR, NFC, physical access and Digital Signage locked to `Paid extension` for all plans.
- [x] Desktop table and mobile accordion variants.
- [x] Unit, typecheck, build and responsive browser checks.
- [x] Commit and push (`1ce01ab86003b50ddfd21e48e60be49f4d97ca14`).
- [x] Public-web-only deployment.
- [x] Live artifact verification.

# ADR 0009: Connected Campus signage domain and adapter boundary

Status: Accepted

Date: 2026-08-02

## Context

Akademate Next needs to publish class calendars, room information, academy communications and
promotions to displays without coupling academy rules to a specific screen, player or provider.
The contract must remain tenant- and site-aware before persistence, device pairing or external
delivery is introduced. CEP runtime, data, configuration and deployment are excluded.

## Solution Registry

| Approach | Correctness | Maintainability | Scalability | Simplicity | Pragmatism | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Implement provider calls directly in tenant-admin | 6 | 4 | 5 | 8 | 5 | Rejected |
| Pure domain compiler plus provider adapter contract | 9 | 9 | 9 | 7 | 9 | Selected |

## Decision

1. `@akademate/signage-domain` owns playlist validation, local schedule evaluation, deterministic
   item ordering and manifest compilation.
2. `@akademate/signage-adapters` owns the provider boundary. Its gateway validates scope before
   dispatch and decodes the external receipt for that exact tenant, site, display and publication.
3. UI, Payload collections, jobs and providers consume these packages and use the validated
   publish/revoke gateway. They do not reimplement scheduling or scope checks locally.

## Domain contract

- A playlist and every item must match the requested `tenantId` and `siteId`; mismatches fail
  closed before a manifest is returned.
- Compilation receives an explicit canonical UTC instant. It never reads the system clock, so
  identical input produces structurally identical output within the same observed runtime. ICU and
  timezone database versions are not pinned, so cross-runtime equivalence is not claimed.
- Tenant, site, playlist, item and asset IDs use a bounded canonical ASCII grammar; separators,
  traversal tokens, whitespace and ambiguous URL-encoded forms fail closed.
- IANA timezones resolve the local weekday and minute at that instant, including repeated local
  time during a daylight-saving transition.
- Local windows are half-open: start is inclusive and end is exclusive.
- An overnight window belongs to its start day. The after-midnight portion checks the previous
  local day.
- Items are ordered by priority descending, position ascending and canonical ASCII identifier.
  Ordering does not depend on the host locale or ICU collation.
- Active items with the same priority and position remain deterministically ordered and emit an
  explicit collision diagnostic. Compilation does not silently discard either item.
- Invalid dates, timezones, duplicate item IDs, empty identifiers, non-increasing validity windows
  and ambiguous local windows fail closed.

## Adapter contract

- Manifest transport requires HTTPS without embedded credentials or fragments.
- The digest is a lowercase `sha256:` value with 64 hexadecimal characters.
- Expiration is a canonical ISO-8601 instant.
- Adapter receipts use `accepted`, `rejected` or `unavailable`.
- `accepted` requires a provider reference; `rejected` requires a reason; only `unavailable` can
  include a non-negative retry delay.
- A receipt that substitutes tenant, site, display or publication is rejected even if the provider
  reports success.
- Publish and revoke requests are validated before provider dispatch. External receipts are decoded
  from `unknown` and contradictory status fields fail closed.
- Provider credentials are constructor/runtime concerns and are never included in the canonical
  request or receipt types.

## Evidence

Twenty focused tests cover structural repeatability in one runtime, canonical identifiers
and instants, tenant/site substitution, temporal overlaps, position collisions, locale-independent
ASCII ordering, overnight schedules, DST fallback and spring-forward, provider unavailability,
pre-dispatch rejection, immutable scope snapshots, unsafe manifest transport and strict receipt
decoding. Both packages pass strict TypeScript checks.

This is local domain evidence. It does not prove persistence, RLS, signature verification, device
credentials, provider delivery, offline playback, hardware compatibility or production operation.

## Next gates

1. Append a monotonic Next-only migration for the signage schema and forced-RLS policies.
2. Add signed manifest creation and verification without changing the deterministic domain order.
3. Implement a reference player that preserves only the latest signed and unexpired manifest.
4. Add pairing, rotation, revocation and heartbeat after the device principal is authoritative.
5. Keep every release command outside the CEP task and runtime.

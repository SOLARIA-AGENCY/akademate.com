# Public Home Operating Narrative

Status: implementation in progress

Scope: `apps/web` and the public `akademate.com` deployment only

Excluded: CEP, tenant production data, permissions, financial configuration and authenticated apps

## Optimized implementation prompt

Restructure Home as a clear academy operating story: show how the management team runs the academy, how teachers deliver learning and how learners participate; replace the Home blueprint with a realistic management dashboard; simplify MCP into an optional “Connect your AI agent via MCP” integration; give every platform module a unique action-led visual; and add attendance, physical access and digital signage as connected campus capabilities. Use concise, affirmative SaaS marketing language and preserve honest implementation boundaries in Features and the roadmap.

## Solution Registry

| Approach                       | Core idea                                                       | Correctness | Maintainability | Scalability | Simplicity | Pragmatism |
| ------------------------------ | --------------------------------------------------------------- | ----------: | --------------: | ----------: | ---------: | ---------: |
| A. Central operating narrative | Shared data plus dedicated product-story components and visuals |           9 |               9 |           9 |          8 |          9 |
| B. Local card additions        | Add attendance and signage cards to the existing Home           |           6 |               6 |           6 |          9 |          6 |

Selected: **A. Central operating narrative**. It places the new capabilities inside the academy workflow, keeps the catalogue and roadmap aligned, and avoids isolated marketing promises.

## Public surface checklist

- [x] Management dashboard narrative with academy-team context.
- [x] Teacher and learner workspaces remain part of the primary story.
- [x] Eight platform pillars receive eight unique images.
- [x] Blueprint journey removed from Home.
- [x] MCP reduced to an optional three-step connection story.
- [x] Attendance and access shown through QR, NFC and RFID journeys.
- [x] Digital signage shown across academy displays and sites.
- [x] Home commercial copy uses affirmative language.
- [x] Unit, type, build and browser validation.
- [ ] Commit and push.
- [ ] Public-web-only deployment and served-artifact verification.

## Product roadmap additions

### Attendance and physical access

- QR check-in from responsive and future native apps.
- NFC and RFID cards associated with learner and staff identities.
- Provider adapters for readers, turnstiles, door controllers and attendance sensors.
- Tenant-, site- and course-scoped access policy.
- Idempotent arrival events, exception review and offline reconciliation.
- Attendance synchronized with sessions, rooms, cohorts and learner records.

### Digital signage

- Screen and player registry scoped by tenant, brand, site and zone.
- Content library for calendars, announcements, notices and promotions.
- Playlists, schedules, validity windows and emergency overrides.
- Live course, room and timetable data blocks.
- Publishing approval, audit trail and role-based control.
- Device heartbeat, playback status and 24/7 fleet visibility.
- Validated adapters for supported display players; compatibility is confirmed per provider.

## Adversarial validation

1. Missing or broken visual asset must fail the public-content test.
2. Feature and preview registries must remain one-to-one.
3. Home must reject the negative marketing patterns removed in this iteration.
4. Mobile must remain free of horizontal overflow.
5. Every generated image must load with a non-zero natural size.
6. CEP deployment and runtime are excluded from every release command.

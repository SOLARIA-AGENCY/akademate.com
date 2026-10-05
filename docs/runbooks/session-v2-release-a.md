# Session v2 Release A Runbook

## Scope

Release A introduces the signed `akademate_session_v2` cookie and keeps
`akademate_session` and `cep_session` only as inputs to `POST /api/auth/session`.
Privileged middleware and handlers accept only a cryptographically verified
Payload token or v2 session. Logout continues clearing all legacy names so the
release remains rollback-compatible.

For browser navigation, middleware may detect the presence of a legacy cookie
only to redirect to `/auth/session-exchange`. That page calls the POST exchange;
cookie presence never grants access or supplies identity claims.

## Required configuration

- `PAYLOAD_SECRET`: existing Payload JWT verification secret.
- `SESSION_SIGNING_SECRET_CURRENT`: independent random secret used to sign v2.
- `SESSION_SIGNING_SECRET_PREVIOUS`: optional former v2 secret during rotation.
- `IMPERSONATION_ENABLED`: defaults closed; set `true` only when impersonation is approved.
- `ALLOW_DEV_AUTO_LOGIN`: keep `false` outside local development.
- `TRUST_PROXY_HEADERS`: keep `false` unless every request reaches the app through a trusted proxy that overwrites forwarded headers.

Generate each signing secret independently with `openssl rand -base64 48`.
Never reuse `PAYLOAD_SECRET` as the session signing secret. Production must
terminate HTTPS because v2 cookies always carry `Secure`, `HttpOnly`, and
`SameSite=Lax`.

## Release A rollout

1. Install the same `SESSION_SIGNING_SECRET_CURRENT` on every tenant-admin instance.
2. Keep `SESSION_SIGNING_SECRET_PREVIOUS` unset on the first rollout.
3. Deploy Release A without deleting either legacy cookie name from logout.
4. Verify anonymous access, a normal login and `POST /api/auth/session` exchange.
5. Verify a valid legacy cookie exchanges to v2 and both legacy cookies are cleared.
6. Verify forged/malformed legacy values return `401 SESSION_REAUTH_REQUIRED`.
7. Count structured `[auth.session.legacy_exchange]` events for seven days.
8. Keep Release B removal blocked until legacy exchanges are negligible and rollback is rehearsed.

Compose treats `SESSION_SIGNING_SECRET_CURRENT` as required for both the
traffic-serving and candidate containers, so either profile fails closed during
environment interpolation when it is absent. The other four Task C variables
are declared explicitly in both profiles; production defaults keep proxy trust,
impersonation and development login disabled.

Apply the Users collection schema change before enabling Release A. The new
`session_version` field defaults to `1`; missing or null values on existing
rows are treated as `1`, so the rollout is backfill-compatible. The remaining
compatibility risk is configuration: missing or inconsistent v2 secrets make
middleware fail closed and redirect otherwise valid users to login.

## Session invalidation

Authenticated server handlers resolve the current Users record and reject a
session when the user is missing or inactive, or when its tenant, roles, or
`session_version` no longer match the signed principal. Middleware performs
only the cryptographic gate because it cannot query Payload.

To revoke all sessions for one user, increment that user's `session_version`.
New logins and exchanges sign the new value; every older Payload or v2 token
then fails server-side identity resolution. A future user-facing revoke-sessions
operation should perform this same atomic increment and record an audit event.

## Secret rotation

1. Move the existing current value to `SESSION_SIGNING_SECRET_PREVIOUS`.
2. Install a new random value in `SESSION_SIGNING_SECRET_CURRENT` on all instances.
3. Restart instances and verify tokens signed by both values.
4. Wait at least 12 hours, the maximum v2 lifetime.
5. Remove `SESSION_SIGNING_SECRET_PREVIOUS` and restart again.

Do not swap instances one at a time with different current/previous pairs. A
request routed between inconsistent instances will produce intermittent 401s.

## Impersonation controls

- Keep `IMPERSONATION_ENABLED=false` during rollout unless support requires it.
- Allowed actors are `admin` and `superadmin`; tenant admins remain tenant-bound.
- Chained impersonation is rejected.
- A reason of 8-500 characters is required.
- Issued tokens expire after at most 15 minutes.
- POST issues HttpOnly cookies directly and returns only a safe redirect path; impersonation tokens are never transported in URLs or response bodies.
- Token delivery fails if the audit record cannot be written.

Forwarded client IP data is recorded only when `TRUST_PROXY_HEADERS=true`.
Otherwise audit metadata records the address as unknown and marks the source
as untrusted; it never substitutes localhost.

## Rollback

Rollback to the previous application image without deleting cookies. The old
image can still clear `akademate_session` and `cep_session`; users holding only
v2 may need to authenticate again after rollback. Keep the Release A image and
both signing secrets available until the observation window closes.

# CEP Candidate 1A.1 — Production Deployment

Last updated: 2026-07-30

## Release identity

- Live base before switch: `0ca1b43ea229fc531dab79388925fc73e8077eab`.
- Candidate source: `9438253e9118ceca47c609f8280be331146dc470`.
- Branch: `codex/cep-candidate-1a-planning`.
- Image: `akademate-tenant:9438253e9118ceca47c609f8280be331146dc470`.
- Image ID: `sha256:e7ecd5b13ece840b2e597cda6b1d7905a3d865d8612436c1cd5f255b6b2e7660`.
- Live container: `akademate-tenant-candidate-9438253e`.
- Live route: Traefik `cep-formacion-tenant` to
  `http://akademate-tenant-candidate-9438253e:3009`.
- Previous live container `akademate-tenant-final` remains healthy and unrouted
  for immediate application rollback.

## Data protection evidence

- No schema migration, permission activation, finance integration or data
  backfill was included.
- A custom-format PostgreSQL backup was created with pipeline failure
  propagation and SHA-256 verification.
- Backup:
  `/opt/akademate/backups/pre-cep-1a1-20260730/akademate-pre-cep-1a1.dump`.
- Restore verification passed in the isolated temporary database
  `akademate_restore_verify_20260730_1a1`; the temporary database was removed
  after verification.
- Restored evidence: 1,018 archive entries, 82 tables, 143 staff records,
  32 course runs and 11 users.
- Post-switch counts remained exactly 82 tables, 143 staff records,
  32 course runs and 11 users.

## Verification

| Gate | Result |
| --- | --- |
| Exact scope verifier | 10/10 allowlisted paths |
| Focused Vitest | 38/38 pass |
| Affected ESLint | 0 errors, 0 warnings |
| Local Next production build | 59/59 pages |
| Docker frozen-lockfile build | pass |
| Candidate health before traffic | healthy |
| Active/candidate anonymous contract | 12/12 pass |
| Public post-switch smoke | health, login, home and convocations pass |
| Anonymous protected APIs | `401` as expected |
| Initial production observation | 3/3 SHA/health checks, zero restarts |
| Candidate/Traefik release errors | zero detected |
| Authenticated admin smoke | pending: no production smoke principal configured |
| Browser visual smoke | pending: available browser session was unauthenticated and later detached |

## Rollback

- Previous application image and healthy container remain available.
- Pre-switch Traefik configuration:
  `/opt/akademate/backups/cep-comunicacion.pre-9438253e.yml`.
- The release is code-only and uses the unchanged production database and media
  volume, so application rollback does not require a reverse migration.
- Roll back immediately for authentication regression, unexpected writes,
  served revision drift, health degradation, new 5xx errors or planning-flow
  regression.

## Residual gate

Do not treat anonymous smoke as authenticated proof. Configure a least-privilege
technical smoke account through the secret manager and run
`infrastructure/scripts/smoke-authenticated.sh` against the live service. Until
that passes, keep the previous container and image available.

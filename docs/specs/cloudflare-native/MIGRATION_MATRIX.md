# Migration matrix (Fase 0 living document)

Estado: snapshot 2026-08-29. Actualizar en el audit real (Fase 0), no inventar tablas.

Clasificación v2.0: `KEEP` | `EVOLVE` | `SPLIT` | `ADAPT` | `REPLACE` | `DEPRECATE` | `NEW`.  
`ADAPT` = el dominio es correcto; cambia el adapter de infraestructura.

| Artefacto | Decisión | Notas |
| --- | --- | --- |
| Worker `akademate-web` OpenNext | KEEP | Ya es Cloud. No Docker para www. |
| `apps/tenant-admin` Next+Payload | EVOLVE + ADAPT persistencia | No fork CEP |
| `apps/campus` scaffold | DEPRECATE path legado `/api/users` | Canon: tenant-admin `/campus` |
| `apps/admin-client` ops | EVOLVE | ops.akademate.com + Access |
| Postgres + Drizzle + RLS | KEEP On-Prem; ADAPT Cloud→D1 shards | Un Core, dos stores. RLS no se copia a SQLite |
| Payload CMS collections editoriales | KEEP | Frontera Master §16 |
| Payload como dominio (hooks matrícula/ledger) | SPLIT | Application Services |
| `students` / `staff` campus P1 | EVOLVE | No Person paralelo en P1 |
| `campus_session` host-only | KEEP | Cloud y On-Prem |
| Neon como SaaS default (ADR-0007) | REPLACE | Cloud = D1, no Neon |
| Redis/BullMQ Cloud | REPLACE | Queues + Workflows |
| R2/MinIO | EVOLVE | R2 Cloud; S3 On-Prem |
| Hyperdrive | NEW optional bridge | Solo migración, no destino |
| Control D1 | NEW | Platform plane |
| Tenant shard D1 | NEW V1 | Mapping en Control |
| D1 per tenant físico | NEW target | Tras attach dinámico verificado |
| Stream VideoAsset | NEW | VOD |
| BYO Meet/Zoom/Teams | NEW | No pagar seats del tenant |
| RealtimeKit | FUTURE | Akademate Live |
| AutonomousOps module | NEW | No Paperclip deploy |
| n8n, Linear, OpenMeter | DEPRECATE-as-plan | No introducir |
| Email Sending CF | NEW optional | Beta; EmailProvider fallback |
| Workers for Platforms | FUTURE | Extensiones tenant |
| Containers CF | FUTURE | Si Payload no cabe en Workers |
| Feature `if tenantId === CEP` | DEPRECATE | Blueprint/capability |

Prohibido: `StudentV2`, `TenantNew`, `CourseRun2`.

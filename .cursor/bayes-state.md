época: AKA-ARCH-SAAS-001 Rev D agent ingest | dirty: tenant-admin + official PDF | actualizado: 2026-08-30T10:14:00Z

| id | claim | prior | last_obs | posterior | next_probe |
|----|-------|-------|----------|-----------|------------|
| H5 | Fuente dominio = Master Spec | alto | user 1.1 | 90 | — |
| H6 | Cloud SaaS = CF Workers/D1, On-Prem = Postgres | alto | prompt v2 + ADR-0016 | 90 | Fase 0 schema |
| H7 | D1-per-tenant 1:1 no es V1 ejecutable | alto | limits 5k bindings, no getD1 uuid | 90 | re-verificar API attach |
| H8 | Email Sending / Secrets Store / D1 replicas no son path crítico | alto | docs BETA | 90 | — |
| H9 | Launchpad $250k no confirmado | alto | requires application | 90 | B-050 humano |
| H10 | Cuenta CF de akademate.com es producto aislado | medio | NAZCAMEDIA id en docs | 25 | B-000/B-040 owner |
| H11 | Workspace @akademate.com independiente existe | sin clase → cualitativo | no observable en git | incierto | B-000 humano |
| H12 | Brief SaaS UI (8 puntos) aplicado sin marca CEP | overlay CEP como clase | vitest 58/58 + grep hover/border/withCard | 90 | browser tenant-admin SaaS |

obs | user: apply SaaS-only UI brief, no CEP brand | encoded
obs | vitest 6 files 58 passed; no hoveredSection; no TableBody last-child border-0; withCard=false | ↑H12 | encoded
obs | no SaaS next-dev in this workspace (3009 is CEP overlay) | KEEP H12 cap 90 | encoded
obs | user: mermaid two-plane CF plan | DIAGRAMS.md split 13 views | encoded
obs | D1 1:1 vs ~5k bindings = EVOLVE shards | KEEP H7 | encoded
obs | user: affirmative CF-only doc, mermaid per page, no Hetzner/OVH | AKA-ARCH-SAAS-001 v1.1 41p PDF | encoded
obs | user: EN, ISO 7200+42010+arc42, type area, no meta copy | AKA-ARCH-SAAS-001 Rev B v2.0 | encoded
obs | user: agent ingest, mermaid as text, prompts/codes, no OCR | AKA-ARCH-SAAS-001 Rev D 53 sheets + ingest.json + AGENT.md | encoded

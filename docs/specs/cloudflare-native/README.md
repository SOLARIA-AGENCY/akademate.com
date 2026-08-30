# Akademate Cloud SaaS (Cloudflare-native)

Pack de especificación ejecutable. No sustituye el dominio académico.

**Contrato de ejecución (ingest v2.0):** [MASTER_EXECUTION_PROMPT_v2.0.md](./MASTER_EXECUTION_PROMPT_v2.0.md)  
Ejemplar imprimible: [AKA-ARCH-SAAS-001](../../architecture/official/README.md) (PDF A4 + HTML).  
Modo actual: `ARCHITECTURE_AUDIT` / PHASE 0 / WRITE AUTHORITY READ-ONLY.  
Control: [../../bootstrap/](../../bootstrap/) · [../../architecture/current-state.md](../../architecture/current-state.md)

| Documento | Rol |
| --- | --- |
| [../AKADEMATE_MASTER_ARCHITECTURE_SPEC.md](../AKADEMATE_MASTER_ARCHITECTURE_SPEC.md) | Dominio, blueprints, campus P1, finanzas, capabilities. Runtime On-Prem = Postgres. |
| [../AKADEMATE_CLOUDFLARE_NATIVE_SAAS.md](../AKADEMATE_CLOUDFLARE_NATIVE_SAAS.md) | Runtime Cloud SaaS, genesis BRIK64, datos D1/R2, AutonomousOps, bootstrap, migración. |
| [MASTER_EXECUTION_PROMPT_v2.0.md](./MASTER_EXECUTION_PROMPT_v2.0.md) | Wizard humano, modos, gates, first-response contract. |
| [DIAGRAMS.md](./DIAGRAMS.md) | Mermaid dos planos: edge, 7 Workers, D1, colas, perímetro, OAuth, escala. |
| [SOURCES.md](./SOURCES.md) | Docs oficiales, fechas, GA/BETA. |
| [HUMAN_BOOTSTRAP.md](./HUMAN_BOOTSTRAP.md) | Pasos humanos B-000…B-110. |
| [AGENT_CHECKLIST.md](./AGENT_CHECKLIST.md) | Lo que el agente puede hacer / preparar / no tocar. |
| [MIGRATION_MATRIX.md](./MIGRATION_MATRIX.md) | KEEP / EVOLVE / SPLIT / ADAPT / REPLACE / DEPRECATE / NEW. |
| [COST_MODEL.md](./COST_MODEL.md) | Costes CF verificados + sensibilidad. |
| [EVIDENCE_LEDGER.md](./EVIDENCE_LEDGER.md) | Plantilla BootstrapEvidence. |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Amenazas Cloud SaaS. |

Primera acción real: **PHASE 0 preflight + audit**, no implementar D1 ni cortar Postgres. Enterprise On-Prem sigue en Docker/Postgres (Master Spec §28).

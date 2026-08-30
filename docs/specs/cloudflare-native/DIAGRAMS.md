# Diagramas Cloudflare-native (Mermaid)

Canon de dominio: [AKADEMATE_CLOUDFLARE_NATIVE_SAAS.md](../AKADEMATE_CLOUDFLARE_NATIVE_SAAS.md).  
Plan de dos planos (interno + perímetro) documentado aquí para visualización. Abrir este archivo en preview Markdown de Cursor o GitHub para pintar los gráficos.

**Regla:** no dimensionamos CPU/RAM. Dimensionamos bases, storage, requests, colas, objetos, vídeo, workflows y límites de cuenta.

**Ajuste respecto al plan 1:1 D1-per-tenant:** un Worker admite ~5.000 bindings. V1 usa **Control D1 + shards D1** (`TenantDataContext`). 1 D1 por tenant es objetivo de cuenta, no binding estático en un solo script.

---

## 0. Dos planos

```mermaid
flowchart TB
  LEGAL[BRIK64 Inc]
  LEGAL --> PERIM[Plano 2 - Perimetro externo]
  LEGAL --> CF[Plano 1 - Cloudflare interno]

  PERIM --> WS[Workspace akademate.com]
  PERIM --> GH[GitHub org]
  PERIM --> GCP[GCP org]
  PERIM --> OP[1Password vaults]
  PERIM --> OAUTH[OAuth apps]
  PERIM --> BILL[Stripe + Mercury]

  CF --> EDGE[Edge + WAF]
  CF --> RUN[7 Workers]
  CF --> DATA[D1 + R2 + DO]
  CF --> ASYNC[Queues + Workflows]
```

---

## 1. Edge y 7 unidades de despliegue

```mermaid
flowchart TB
  NET[Internet]
  CUSTOM[campus.cliente.com]
  AKA["*.akademate.com"]

  subgraph EDGE["Edge / Security"]
    DNS[DNS]
    SAAS[Cloudflare for SaaS]
    WAF[WAF + DDoS + Rate limit]
    TURN[Turnstile]
    ACCESS[Access - solo Ops]
  end

  NET --> DNS
  CUSTOM --> SAAS
  AKA --> DNS
  DNS --> WAF
  SAAS --> WAF
  WAF --> TURN

  subgraph RUN["Runtime - 7 Workers"]
    APP[akademate-app]
    CTRL[akademate-control]
    INT[akademate-integrations]
    MEDIA[akademate-media]
    EVENTS[akademate-events]
    AUTO[akademate-automation]
    AGENTS[akademate-agents]
  end

  TURN --> APP
  ACCESS --> CTRL
  APP --> INT
  APP --> MEDIA
  APP --> CTRL
  APP --> EVENTS
  AUTO --> EVENTS
  AGENTS --> CTRL
```

Los dominios Students / Teachers / Campus / Finance / CRM son **módulos de software**, no Workers extra.

---

## 2. Identidad y datos transaccionales

```mermaid
flowchart LR
  APP[akademate-app]
  APP --> SESS[Session / Auth Context]
  SESS --> GID[GlobalIdentity]
  SESS --> MEM[Tenant Membership]
  MEM --> POL[RBAC + ABAC + capabilities]

  APP --> TDC[TenantDataContext]
  TDC --> CTRLDB[(D1 Control)]
  TDC --> SHARD[(D1 shard / tenant)]
  APP --> R2[(R2 prefixes tenant/id)]
  CTRL[akademate-control] --> CTRLDB
```

---

## 3. Resolución D1 (aislamiento)

```mermaid
flowchart LR
  REQ[Request] --> AUTH[Identity]
  AUTH --> TEN[Tenant Resolver]
  TEN --> CTX[TenantDataContext]
  CTX --> CTRL[(D1 Control - mapping)]
  CTX --> DB[(D1 tenant o shard)]
```

```text
1 x Control D1
+ shards D1  (V1: pool, no 50k bindings en un Worker)
+ 1 D1 por tenant  (objetivo de cuenta / provisioning API, no wrangler estático)
```

Tenant excepcional ~7-8 GB SQL: particionar `core / academic / finance / archive` **antes** de 10 GB.

---

## 4. Durable Objects (sin servidor WS central)

```mermaid
flowchart TB
  APP[akademate-app] --> TC[TenantCoordinator]
  APP --> LS[LiveClassSession]
  APP --> RH[RealtimeHub]
  TDC[TenantDataContext] --> LOCK[CriticalLock]
  AG[akademate-agents] --> AR[AgentRuntime]
```

Escala: una instancia `TenantCoordinator:{tenantId}` por tenant. Sesiones y agentes son objetos efímeros. Soft limit ~1.000 req/s **por objeto**; se reparte entre IDs, no se agranda un objeto.

---

## 5. Colas, DLQ y Workflows

```mermaid
flowchart TB
  APP[akademate-app] --> QD[domain-events]
  INT[akademate-integrations] --> QI[integrations]
  APP --> QM[notifications]
  APP --> QU[usage-metering]
  MEDIA[akademate-media] --> QV[media]
  AG[akademate-agents] --> QA[agent-jobs]

  QD --> EV[akademate-events]
  QI --> EV
  QM --> EV
  QU --> EV
  QV --> EV
  QA --> EV

  EV --> DLQ[Dead letter queues]
  EV --> WF[Workflow classes]

  WF --> W1[Tenant lifecycle]
  WF --> W2[Import / Export]
  WF --> W3[GDPR]
  WF --> W4[Billing]
  WF --> W5[Media ingest]
  WF --> W6[Incident]
```

Colas **por función**, no por tenant. A ~10.000 tenants: shard `domain-events-0..3` con `hash(tenantId) % 4`. Local Miniflare no reproduce concurrency de consumers.

---

## 6. Vídeo (Stream) e IA

```mermaid
flowchart LR
  UP[Profesor / Admin] --> MW[akademate-media]
  MW --> ST[Cloudflare Stream]
  ST --> TOK[Signed playback]
  TOK --> STU[Campus alumno]

  MEET[Meet] --> ING[Recording ingest]
  ZOOM[Zoom] --> ING
  TEAMS[Teams] --> ING
  ING --> ST
```

```mermaid
flowchart TB
  EVT[Evento] --> AR[Agent Runtime DO]
  AR --> PE[Policy Engine R0-R4]
  PE --> API[Control API / MCP]
  API --> SVC[Application Service]
  SVC --> DOM[Domain + TenantDataContext]

  AR --> GW[AI Gateway]
  GW --> WAI[Workers AI]
  GW --> EXT[Frontier models]
  AR --> CTR[Containers - jobs pesados]
```

Nunca: Agent → D1 directo.

---

## 7. Observabilidad y secretos

```mermaid
flowchart LR
  RUN[Workers] --> LOG[Workers Logs]
  RUN --> TR[Traces]
  RUN --> MET[Metrics]
  RUN --> AE[Analytics Engine]
  CTRL[akademate-control] --> AUD[Platform Audit]

  OP[1Password ROOT] --> WS[Workers Secrets GA]
  OP -.-> SS[Secrets Store beta]
  SS -.-> RUN
  WS --> RUN
```

Datasets AE globales (no uno por tenant): `platform_usage`, `tenant_usage`, `platform_health`, `business_events`, `ai_usage`, `media_usage`.

---

## 8. Perímetro externo (cuentas)

```mermaid
flowchart TB
  LEGAL[BRIK64 Inc]
  LEGAL --> DOMAIN[akademate.com]
  LEGAL --> WS[Google Workspace]
  LEGAL --> PASS[1Password]
  LEGAL --> CF[CF Account AKADEMATE]
  LEGAL --> GH[GitHub akademate]
  LEGAL --> GCP[GCP Organization]
  LEGAL --> MS[Entra app]
  LEGAL --> ZOOM[Zoom app]
  LEGAL --> AI[AI provider projects]
  LEGAL --> STRIPE[Stripe BRIK64]
  STRIPE --> MERCURY[Mercury]

  WS --> ADMIN[admin@]
  WS --> BREAK[breakglass@]
  WS --> INFRA[infra@]
  WS --> SEC[security@]

  ADMIN --> CF
  ADMIN --> GCP
  ADMIN --> GH
  ADMIN --> PASS
  BREAK -.-> CF
  BREAK -.-> GCP
```

Una cuenta Cloudflare. Una org GitHub. Una org GCP. **Cero cuentas admin por tenant.**

---

## 9. OAuth de clientes (no nuestras cuentas)

```mermaid
flowchart LR
  subgraph TENANT["Cuentas del cliente"]
    GW[Google Workspace]
    Z[Zoom]
    M365[Microsoft 365]
    PAY[Stripe / Redsys]
  end

  subgraph AKA["Connectors Akademate"]
    GO[Google OAuth app]
    ZO[Zoom OAuth app]
    MO[Entra multi-tenant]
    PO[Payment connectors]
  end

  GW -->|consent| GO
  Z -->|consent| ZO
  M365 -->|consent| MO
  PAY --> PO
  GO --> INT[akademate-integrations]
  ZO --> INT
  MO --> INT
  PO --> INT
```

---

## 10. Dos logins (no mezclar)

```mermaid
flowchart LR
  STU[Alumno] --> AID[Akademate Identity]
  TEA[Profesor] --> AID
  ADM[Tenant admin] --> AID
  AID --> APP[SaaS app / campus]

  STAFF[Staff Akademate] --> ACC[Cloudflare Access]
  ACC --> OPS[Platform Ops]
```

Access **no** autentica alumnos.

---

## 11. Billing de plataforma vs cobro del tenant

```mermaid
flowchart TB
  subgraph PLATFORM["Vender Akademate"]
    B64[BRIK64 Inc] --> ST[Stripe productos AKADEMATE]
    ST --> MER[Mercury]
  end

  subgraph LEARNER["Cobrar alumnos"]
    T[Tenant] --> TP[su Stripe / Redsys]
    TP --> AL[Alumnos]
  end
```

Nunca mezclar las dos cajas.

---

## 12. Dual runtime (Cloud vs On-Prem)

```mermaid
flowchart LR
  CORE[Canonical Core]
  CORE --> D1[D1TenantDataStore]
  CORE --> PG[PostgresTenantDataStore]
  D1 --> CLOUD[Cloud SaaS Workers]
  PG --> ONP[Enterprise Docker]
```

---

## 13. Mapa comprimido

```mermaid
flowchart TB
  B64[BRIK64 Inc] --> CORP[Corporate Stripe Mercury]
  B64 --> PROD[Product Workspace GCP GitHub CF]

  PROD --> EDGE[Cloudflare Edge]
  EDGE --> APP[app]
  EDGE --> OPS[ops]
  EDGE --> INT[integrations]
  APP --> TDC[TenantDataContext]
  TDC --> CD1[(Control D1)]
  TDC --> TD1[(Tenant D1 x N / shards)]
  APP --> R2[(R2)]
  APP --> ST[(Stream)]
  APP --> DO[Durable Objects]
  APP --> Q[Queues]
  Q --> WF[Workflows]
  WF --> AG[Agents]
  AG --> GW[AI Gateway]
```

---

## Dual runtime request (secuencia)

```mermaid
sequenceDiagram
  participant U as Client
  participant W as akademate-app
  participant C as Control D1
  participant S as Tenant D1 o shard
  U->>W: HTTPS
  W->>W: identity + tenant host/claim
  W->>C: mapping tenant to store
  W->>S: query con tenant_id
  S-->>W: rows
  W-->>U: response
```

---

## AutonomousOps loop

```mermaid
flowchart LR
  O[Observe] --> I[Interpret]
  I --> P[Plan]
  P --> E[Execute]
  E --> V[Verify]
  V --> R[Record]
  R --> L[Learn]
  L --> O
```

---

## Matriz de escala (misma arquitectura)

| Recurso | 10 | 100 | 1.000 | 10.000 |
| --- | ---: | ---: | ---: | ---: |
| Workers app | ~7 | ~7 | 7–9 | 8–12 |
| D1 Control | 1 | 1 | 1 | 1 |
| D1 tenant / shards | 10 / pool | 100 / pool | shards | shards + lift 1 TB |
| R2 buckets prod | 3–4 | 3–4 | 3–5 | 3–8 |
| Queues + DLQ | 6+6 | 6+6 | 6–10 | 12–24 shard |
| TenantCoordinator DO | ~10 | ~100 | ~1.000 | ~10.000 |
| Custom hostnames | 0–10 | ~100 | ~1.000 | ~10.000 |

Cambia volumen y shards, no el diseño. Vigilancia: **bindings por Worker**, **TB D1 agregado**, **msg/s por cola**.

# 0018 - BRIK64 Product Genesis + exit readiness

- Status: Accepted
- Date: 2026-08-29
- Context: BRIK64 Inc. (Delaware) incuba Akademate y otros SaaS. Compartir legal/Stripe al inicio es pragmático; compartir cloud, git secrets y datos de clientes impide vender o escindir el producto.
- Decision:
  - Shared corporate layer (legal, banking inicial) + isolated product infrastructure (CF, Workspace @akademate.com, GCP propio, vaults, CI, datos, P&L codes).
  - Identidades institucionales, no root en cuentas personales.
  - Exit package continuo: inventario, rotación, transfer de zona/git/workspace/OAuth/contratos.
- Consequences: Bootstrap humano (Workspace, CF account, 1P) antes de AutonomousOps. Cost center Akademate aunque Stripe sea BRIK64.

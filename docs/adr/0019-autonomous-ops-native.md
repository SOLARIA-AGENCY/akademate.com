# 0019 - AutonomousOps nativo (no Paperclip)

- Status: Accepted
- Date: 2026-08-29
- Context: Se necesita operación progresivamente autónoma. Paperclip aporta vocabulario (agent, budget, approval, heartbeat) pero otra UI/runtime.
- Decision:
  - Módulo `AutonomousOps` en Akademate. Concepts útiles sí; deploy de Paperclip no.
  - Agentes solo Control API/MCP. Sin D1 directo, sin vault root, sin auto-elevación.
  - R0–R1 automatable; R3 approval; R4 dual o never.
  - GitHub Issues como tracker V1 (no Linear).
- Consequences: Self-healing produce PRs, no writes prod R3. Loops OBSERVE→…→LEARN.

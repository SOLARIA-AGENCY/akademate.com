# @akademate/jobs

Base para procesadores BullMQ/Redis orientados a multi-tenant. Define contratos y helpers de encolado con `tenantId` obligatorio.

## Objetivos
- Unificar nombres de colas y convenciones de payload.
- Facilitar trazabilidad/auditoría de ejecuciones por tenant.
- Servir como punto de extensión para workers (ops, notificaciones, webhooks).

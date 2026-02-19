# @akademate/jobs

Base para procesadores BullMQ/Redis orientados a multi-tenant. Define contratos y helpers de encolado con `tenantId` obligatorio.

## Objetivos
- Unificar nombres de colas y convenciones de payload.
- Facilitar trazabilidad/auditoría de ejecuciones por tenant.
- Servir como punto de extensión para workers (ops, notificaciones, webhooks).

## Nota de diseño frontend compartido
- El monorepo incluye el sistema de diseño completo en `vendor/academate-ui`.
- Ver guía de adopción e integración: `docs/runbooks/frontend-design-integration.md`.

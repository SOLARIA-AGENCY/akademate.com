# @akademate/types

Tipos compartidos y contratos básicos para las apps y servicios de Akademate. Mantiene el scoping por `tenantId` y facilita que Payload/SDK y los frontends hablen el mismo idioma.

## Uso
- Importa tipos desde `@akademate/types` para modelos, contextos de autenticación y eventos.
- Evita duplicar contratos en apps individuales; centraliza validaciones y enums comunes.

## Nota de diseño frontend compartido
- El sistema de diseño completo está disponible en `vendor/academate-ui` para consumo por todas las apps.
- Ver runbook: `docs/runbooks/frontend-design-integration.md`.

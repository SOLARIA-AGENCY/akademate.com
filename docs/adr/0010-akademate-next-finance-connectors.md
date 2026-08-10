# ADR 0010: Finanzas conectadas en Akademate Next

- Estado: aceptado para implementación incremental, conexiones externas desactivadas por defecto.
- Fecha: 2026-08-10.
- Alcance: `akademate.com` SaaS general en Akademate Next. CEP queda fuera de esta implementación.

## Contexto

Akademate Next ya tiene órdenes y eventos de pago propios para ofertas públicas. El nuevo dominio financiero debe permitir que un tenant conecte Holded, Xero o QuickBooks Online sin convertir el proveedor externo en la fuente de verdad de matrícula, pago o aislamiento. Las conexiones requieren secretos, OAuth, webhooks y sincronización asíncrona; cualquier error de proveedor debe ser reversible y auditable.

## Decisión

1. La orden y el evento de pago de Akademate siguen siendo la autoridad canónica. Los proveedores son proyecciones externas y no pueden confirmar matrícula desde un redirect de navegador.
2. Todos los conectores implementan el mismo `FinanceProviderAdapter`; cada adaptador tiene capacidades explícitas y comienza como `coming_soon` hasta que exista evidencia de transporte, sandbox, pruebas adversariales y despliegue.
3. El runtime usa `disabled | scaffold | connected`. `disabled` no hace I/O; `scaffold` solo permite UI y contratos; `connected` exige explícitamente I/O externo y datos reales. Webhooks y writeback son flags independientes.
4. Las conexiones, cursores, sincronizaciones, eventos webhook, objetos externos y proyecciones tienen `tenant_id`, RLS forzado, claves compuestas tenant-entidad y políticas de rol. Los eventos de auditoría, items de sincronización y proyecciones son append-only; una corrección crea una nueva fila con `supersedes_id`.
5. Los secretos se almacenan cifrados con AES-256-GCM, clave versionada y AAD ligada a tenant, conexión, proveedor y propósito. OAuth persiste solo el digest del state; tokens/verifiers nunca se escriben en claro.
6. Las solicitudes de proveedores adicionales (Sage, Zoho, A3, Exact u otro) siguen un flujo de discovery y contrato Enterprise. No se anuncia disponibilidad hasta reunir evidencia y una prueba de aceptación del proveedor.

## Alternativas consideradas

### Agregador financiero único

Reduce conectores iniciales, pero introduce dependencia de un tercero, menor control sobre scopes y webhook semantics, y un coste de migración si un tenant necesita una capacidad no expuesta. Se descarta para el núcleo.

### Integraciones nativas sobre contrato común (seleccionada)

Mantiene el control del modelo, permite read-only-first, hace explícitas las diferencias OAuth/API y deja una ruta clara para extensiones a medida. Su coste inicial es mayor, pero reduce deuda y hace auditables los límites de cada proveedor.

### iPaaS configurable por tenant

Acelera conectores poco frecuentes, pero desplaza aislamiento, reintentos, secretos y observabilidad a configuraciones difíciles de probar. Se reserva para una extensión Enterprise posterior, no para la autoridad financiera.

## Consecuencias

- Positivas: aislamiento por tenant, claims públicos defendibles, rollback seguro, pagos y matrícula coherentes, y una ruta repetible para nuevos proveedores.
- Coste: migraciones y worker/drainer internos, matrices de scopes y pruebas específicas por proveedor.
- Límites actuales: los adaptadores Holded/Xero/QuickBooks permanecen en scaffold/coming-soon; no hay I/O externo, OAuth real ni writeback activado en esta entrega.

## Evidencia requerida antes de activar un proveedor

- documentación oficial y revisión de scopes/endpoints;
- prueba en sandbox o tenant de prueba y transporte con timeouts/reintentos;
- webhook con firma, replay e idempotencia;
- sincronización con cursor, rate-limit y recuperación;
- prueba de aislamiento, secretos, autorización y fallos;
- evidencia de despliegue y artefacto servido antes de cambiar el catálogo público a `available`.

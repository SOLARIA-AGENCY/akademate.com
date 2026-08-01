# Optimized implementation prompt — Agentic operations and academy growth

Actúa como un equipo senior de producto, arquitectura SaaS multi-tenant, seguridad y frontend premium para Akademate. Trabaja exclusivamente en el carril SaaS general de Akademate y en la superficie pública `akademate.com`. `cepformacion.akademate.com` es un MVP Enterprise productivo aislado: no leas ni modifiques su runtime, tráfico, datos, permisos, roles, finanzas, secretos, imágenes, contenedores o despliegue.

## Resultado buscado

Extiende el sistema operativo de Akademate y su web pública con dos experiencias conectadas:

1. **Akademate MCP / agent-assisted operations**: clientes compatibles como ChatGPT, Claude, Grok y Gemini pueden consultar contexto operativo y preparar trabajo mediante herramientas MCP limitadas por tenant, usuario, rol y alcance. Las acciones sensibles requieren aprobación humana.
2. **Growth Ads / lead intelligence**: Meta Ads y Google Ads se conectan como proveedores independientes para sincronizar señales de campaña y reconciliarlas con leads, solicitudes, reservas, pagos, matrículas y asistencia. El dashboard debe mostrar CTR, alcance, impresiones, clics, CPC, gasto, leads, solicitudes, matrículas y coste por resultado con proveedor, divisa, zona horaria, última sincronización y estado de atribución.

## Investigación y límites antes de editar

- Lee `AGENTS.md`, el plan general y `docs/plans/2026-08-01-agentic-growth-expansion.md`.
- Inspecciona el MCP existente y demuestra que no contiene defaults ni endpoints de CEP antes de reutilizarlo.
- Inspecciona jobs/adapters Meta y confirma qué está realmente ejecutable; no presentes un sync parcial como plataforma terminada.
- Distingue `Available`, `Configurable`, `Connector-ready`, `Roadmap` y `Illustrative example` en código y copy.
- Revisa si existe consentimiento explícito antes de añadir cualquier tracker. Si no hay trackers, no añadas GA4/GTM/Meta Pixel por decoración.

## Arquitectura obligatoria

### MCP

- Gateway por tenant y entorno; OAuth/OIDC o token firmado de corta duración.
- RLS/RBAC siempre con `tenant_id`; scopes mínimos y revocación.
- Herramientas read-only, draft y mutable separadas.
- Confirmación para enviar mensajes, asignar leads o crear tareas.
- Nunca automatizar en la primera fase pagos, reembolsos, notas, certificados, admisiones, RR. HH., permisos ni cambios de presupuesto.
- Audit trail append-only con actor, tenant, tool, scope, decisión, aprobación y resultado redactado.
- Rate limits, idempotencia, timeouts, PII minimisation y protección frente a prompt injection.

### Ads

- Credenciales y cuentas por tenant; nunca token compartido ni filtro de agencia hard-coded.
- Contrato común para Meta y Google con adaptadores separados.
- Snapshots idempotentes, `fetched_at`, currency, timezone, provider/account/campaign IDs y cursor.
- Atribución consent-aware: UTM/click id → lead → application/reservation → payment/enrolment → attendance.
- Dashboard de lectura y reglas de preview/aprobación antes de cualquier acción.
- Fase inicial sin publicar anuncios ni modificar presupuestos.

## Web pública

Añade una sección premium, compacta y responsive a Home y Features, con dos tabs accesibles y anchors:

- `#mcp-agentic-operations`: conversación con contexto de tenant, rol y alcance; tres estados visuales `Read`, `Draft`, `Confirm`; wordmarks de ChatGPT/OpenAI, Claude, Grok y Gemini etiquetados como clientes compatibles/configurables, no como partners.
- `#growth-ads-intelligence`: imagen editorial de móvil con un anuncio de academia en un feed social genérico, más dashboard en código con funnel campaña → landing → lead → reserva/matrícula → asistencia. Etiqueta todos los números como `Illustrative example` hasta disponer de dataset autorizado.

Copy recomendado:

- “Ask Akademate. Keep control.”
- “Connect campaign signals to confirmed participation.”
- “Compatible clients and provider connectors depend on tenant configuration, permissions and scope.”
- “Actions that change records require review and confirmation.”
- “Provider snapshots show their last sync; internal outcomes remain separate and reconciled.”

No uses: “autonomous agent”, “real-time”, “perfect attribution”, “guaranteed ROI”, “every agent supported”, “powered by” o logos como certificación/partnership.

## Visual direction

- Mantén Inter, navy ink, cool white, electric blue y textura de grid existente.
- Una sola idea dominante por sección; no agregues otra pared de cards.
- Usa la imagen `apps/web/public/images/marketing/akademate-growth-ads-mobile-v1.jpg` como ancla editorial; dashboard legible en HTML/CSS.
- Respeta bordes laterales cerrados, densidad compacta, max two-line copy en superficies comerciales y reduced motion.
- Usa logos/wordmarks solo si existe asset con origen y estado documentados; si no, usa texto accesible y etiqueta de compatibilidad.

## Tests y evidence gate

- Unit: registry de módulos, estados, copy prohibido y asset inventory.
- E2E desktop/mobile: tabs, anchors, keyboard, image load, no overflow, no console errors.
- Security: cross-tenant MCP, revocation, scopes, approval, prompt-injection fixture, idempotency.
- Ads: token/account fail-closed, replay, zero denominators, currency/timezone, attribution duplicates/missing consent.
- Tracker gate: ningún GA4/GTM/Meta Pixel/marketing request antes de consentimiento.
- Reporta local, commit, push, deploy y live por separado; despliega solo `akademate-web` cuando el artifact SHA exacto y los checks estén verdes.

## Entregables

1. Registry de capacidades y estados compartido por Home, Features y Pricing.
2. Componentes visuales MCP/Ads con datos ilustrativos etiquetados.
3. Imagen editorial generada y optimizada dentro de `apps/web/public`.
4. Contratos técnicos, migraciones monotónicas, endpoints y jobs solo después de demostrar su límite y tenant isolation.
5. Tests adversariales y checklist actualizado.
6. Informe con riesgos, claims aún bloqueados, evidence level y siguiente decisión concreta.

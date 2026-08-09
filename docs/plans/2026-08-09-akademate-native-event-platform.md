# Akademate Native Event Platform — Plan de implementación

**Fecha:** 2026-08-09
**Carril:** Akademate Next SaaS
**Estado:** Fase 0 cerrada; Fase 1 — tipos de ticket implementados y verificados; sesiones y registro pendientes
**CEP:** fuera de alcance, solo lectura y sin despliegue
**Referencia de código:** `853ee0765694ac164a2bea0a2552fd93631ef87c`

## Objetivo

Construir dentro de Akademate una experiencia nativa para cursos, talleres, jornadas,
convocatorias y eventos que cubra el flujo que el usuario esperaba de una plataforma como Luma:

```text
descubrimiento → página compartible → formulario → registro → pago opcional
→ confirmación → ticket/calendario → recordatorios → asistencia → analytics
```

Akademate no dependerá de Luma para el flujo principal. `external_link` se conserva como un
conector opcional para academias que ya operan con un tercero. No se implementará una integración
Luma API salvo que exista una decisión futura específica y separada.

## Límites de seguridad y producto

- Este plan solo modifica Akademate Next.
- No modifica `cepformacion.akademate.com`, sus datos, permisos, roles, finanzas ni despliegue.
- No reutiliza endpoints históricos de CEP como backend del flujo nativo.
- No convierte una solicitud en matrícula confirmada sin una transición explícita.
- No confirma un pago desde una redirección del navegador: solo desde evidencia verificada del proveedor.
- No publica claims de "integración Luma"; la posición correcta es "event registration built into Akademate".
- Toda nueva migración será append-only, tenant-scoped y con rollback guardado por evidencia.

## Estado de partida auditado

### Ya disponible

- Página pública `/o/[slug]` con host/slug tenant-scoped, SEO y tematización.
- Modos `information_only`, `interest_form`, `free_registration`, `approval_required`,
  `paid_registration` y `external_link`.
- Inbox de solicitudes con revisión, reapertura, rechazo, archivado y actor ledger.
- Conversión aprobada a matrícula con idempotencia y capacidad reservada.
- Lista de espera FIFO, cancelación y reconciliación de capacidad.
- Órdenes de pago con Stripe Checkout, PayPal Orders v2 y SEPA Debit vía Stripe.
- Webhooks verificados y reconciliación asíncrona.
- Dashboard Next tenant-safe y RLS específico.

### No disponible todavía

- Agregado nativo de evento/asistente/ticket.
- Tipos de entrada y variantes de precio.
- Constructor de formularios y versionado de respuestas.
- Registro autoservicio confirmado para el modo gratuito.
- Magic link o cuenta del participante.
- Confirmación email y centro de preferencias.
- `.ics`, Google Calendar, Apple Calendar y zona horaria de evento.
- Ticket QR, check-in móvil, invitados y acompañantes.
- Refunds, cupones, impuestos, facturación y conciliación comercial completa.
- Analytics específico de cada convocatoria.
- Prueba sandbox con credenciales reales.

### Slice implementado en esta iteración

- `event_offer_ticket_types` append-only, tenant-scoped, con variantes `free`, `paid` y `deposit`.
- Editor Shadcn autenticado para gestores en la configuración de una convocatoria.
- API Next-only GET/POST/DELETE con roles de gestión y errores fail-closed.
- Proyección pública read-only de tipos de ticket por host/slug; la página todavía no permite
  seleccionar un ticket ni crear un registro porque ese contrato se cierra en Fase 2.
- RLS `FORCE`, grants mínimos, política pública de lectura y función `SECURITY DEFINER` con
  restauración de contexto.
- Verificador PostgreSQL efímero que cubre aislamiento, proyección pública y rollback guardado.

## Solution Registry

| Enfoque                                                                         | Correctitud | Mantenibilidad | Escalabilidad | Simplicidad | Pragmatismo | Decisión                                                                    |
| ------------------------------------------------------------------------------- | ----------: | -------------: | ------------: | ----------: | ----------: | --------------------------------------------------------------------------- |
| Seguir usando `external_link` y documentarlo como solución principal            |           2 |              4 |             2 |           9 |           3 | Rechazado: no crea producto propio ni confirma estado interno               |
| Ampliar `offer_submissions` hasta convertirlo en asistentes, tickets y pagos    |           5 |              3 |             4 |           6 |           5 | Rechazado: mezcla lead, solicitud, registro y ticket en un agregado ambiguo |
| Dominio nativo de oferta/evento con proyecciones a matrícula y pagos existentes |           9 |              9 |             9 |           6 |           9 | Seleccionado                                                                |

### Razón de la selección

El tercer enfoque mantiene el trabajo ya verificado y evita duplicar pagos o matrículas. La
separación explícita permite que un lead, una solicitud, una inscripción, un asistente y un ticket
tengan estados y permisos diferentes sin perder trazabilidad.

## Modelo de dominio objetivo

```text
tenant
└── event_offer
    ├── public_page
    ├── event_sessions
    ├── ticket_types
    ├── form_definition_versions
    ├── registrations
    │   ├── attendee
    │   └── guests
    ├── paid_offer_order (reutiliza el ledger existente)
    ├── waitlist_entries
    ├── tickets
    ├── check_ins
    ├── notifications
    └── analytics_events
```

### Entidades y límites

| Entidad                   | Responsabilidad                        | No debe representar                        |
| ------------------------- | -------------------------------------- | ------------------------------------------ |
| `event_offer`             | Qué se publica y cómo se convierte     | Una matrícula académica completa           |
| `event_session`           | Cada sesión, horario, zona y enlace    | Una simple fecha textual                   |
| `ticket_type`             | Cupo, precio, reglas y ventana         | El estado de pago global                   |
| `form_definition_version` | Campos y consentimiento de una versión | Datos mutables del alumno                  |
| `registration`            | Intención/registro del visitante       | Un lead de marketing genérico              |
| `attendee`                | Persona confirmada que asiste          | Un usuario interno necesariamente          |
| `guest`                   | Acompañante asociado a un registro     | Otra matrícula académica                   |
| `ticket`                  | Credencial de acceso revocable         | Una URL pública reutilizable               |
| `check_in`                | Evidencia de entrada/salida            | Asistencia académica de una clase completa |
| `paid_offer_order`        | Evidencia financiera                   | Confirmación por navegador                 |

## Fases y checklist

### Fase 0 — Autoridad y contrato de dominio

- [x] Auditar el flujo actual y confirmar que no hay integración Luma.
- [x] Confirmar que `external_link` solo valida HTTPS y redirige.
- [x] Mantener CEP fuera del carril.
- [ ] Resolver la autoridad entre `apps/tenant-admin` Payload y `packages/db` Drizzle.
- [ ] Publicar ADR de `event_offer` y sus relaciones con `course_run`, `enrollment` y pagos.
- [ ] Corregir la checklist documental que todavía marca checkout como pendiente.

**Gate:** contrato aprobado en código/documentación; no se añaden tablas de eventos antes de cerrar
la autoridad de datos.

### Fase 1 — Modelo nativo de oferta/evento

- [ ] Crear migración append-only para `event_offers` o extensión equivalente de `course_runs`.
- [ ] Añadir `event_sessions` con fecha, hora, zona horaria, modalidad, sede y enlace online.
- [x] Añadir `ticket_types` con gratuidad, precio, depósito, cupo, ventanas y máximo por persona.
- [ ] Añadir estados de oferta: draft, published, unlisted, closed, cancelled, archived.
- [x] Añadir constraints tenant-scoped, RLS, grants mínimos e índices de lookup público para
      `ticket_types`.
- [ ] Mantener la compatibilidad con las seis modalidades actuales.
- [ ] Añadir invariantes de cupo:
      `confirmed + active_holds + reserved_waitlist <= capacity`.
- [x] Crear tests estructurales y de PostgreSQL para bypass, cross-tenant y rollback de `ticket_types`.

**Gate:** dos tenants pueden tener el mismo slug; nunca pueden compartir datos, tickets o cupos.

### Fase 2 — Formularios configurables y registro

- [ ] Crear constructor Shadcn de campos: texto, email, teléfono, selección, radio, checkbox,
      fecha, número y consentimiento.
- [ ] Versionar definiciones y congelar la versión utilizada por cada registro.
- [ ] Permitir campos obligatorios, límites y reglas condicionales.
- [ ] Separar lead, `registration` y `attendee`.
- [ ] Añadir idempotencia y fingerprint por tenant/oferta/email/ticket.
- [ ] Añadir registro gratuito inmediato configurable.
- [ ] Mantener registro con aprobación como modo independiente.
- [ ] Añadir magic link de acceso al registro sin exponer PII.
- [ ] Crear página de confirmación persistente y recuperable.
- [ ] Añadir cancelación del propio participante según política del tenant.

**Gate:** un registro repetido no genera duplicados; la respuesta usa exactamente la versión de
formulario publicada; una cancelación no altera el pago automáticamente.

### Fase 3 — Confirmaciones, email y calendario

- [ ] Crear templates versionados por tenant y evento.
- [ ] Enviar confirmación de registro, aprobación, pago, waitlist, cancelación y promoción.
- [ ] Implementar outbox idempotente y reintentos acotados.
- [ ] Generar `.ics` firmado y estable.
- [ ] Añadir enlaces para Google Calendar y Apple Calendar.
- [ ] Mostrar zona horaria explícita.
- [ ] Añadir recordatorios configurables.
- [ ] Añadir aviso de cambios de horario o ubicación.
- [ ] Separar consentimiento transaccional de marketing.

**Gate:** un evento de dominio produce como máximo un mensaje por tipo y destinatario; fallos de
email no alteran el estado de registro o pago.

### Fase 4 — Tickets, asistentes y check-in

- [ ] Generar ticket firmado por registro confirmado.
- [ ] Generar QR de un solo uso y revocable.
- [ ] Añadir invitados y acompañantes con límites configurables.
- [ ] Crear vista de asistentes para gestores.
- [ ] Crear escáner QR móvil.
- [ ] Registrar check-in/check-out con actor, hora y dispositivo.
- [ ] Prevenir doble check-in salvo acción explícita de corrección.
- [ ] Preparar adapter para NFC/RFID/QR sin acoplarlo al flujo académico.
- [ ] Añadir exportación CSV y evidencia de presencia.

**Gate:** un ticket cancelado, duplicado o de otro tenant nunca permite entrada.

### Fase 5 — Pagos comerciales completos

- [x] Mantener órdenes canónicas y reconciliación Stripe/PayPal/SEPA.
- [ ] Conectar `ticket_type` con el importe server-derived.
- [ ] Añadir refunds totales y parciales con ledger inmutable.
- [ ] Añadir cupones, descuentos y límites de uso.
- [ ] Añadir impuestos y moneda soportada por tenant.
- [ ] Añadir recibo/factura y referencia contable.
- [ ] Añadir política de cancelación y cálculo de reembolso.
- [ ] Ejecutar sandbox real con cuentas dedicadas.
- [ ] Probar delayed SEPA, refund, webhook duplicado y evento tardío.

**Gate:** ningún refund modifica artificialmente la evidencia original; toda corrección genera una
entrada nueva y reconciliable.

### Fase 6 — Sharing, analytics y growth

- [ ] Botones nativos de compartir para WhatsApp, email, X, Facebook e Instagram link flow.
- [ ] UTM persistente y atribución por oferta.
- [ ] Eventos de analytics: view, CTA, form_start, form_submit, payment_start, paid, confirmed,
      cancelled y checked_in.
- [ ] Dashboard de conversión por oferta y ticket.
- [ ] Exportación de leads, registros y asistentes con permisos.
- [ ] Integración con campañas de Meta/Google solo como capability separada y consent-first.
- [ ] No introducir trackers públicos antes del consentimiento correspondiente.

**Gate:** analytics no expone PII y los eventos de marketing no se emiten antes del consentimiento.

### Fase 7 — Localización, accesibilidad y release

- [ ] `lang` y copy derivados de locale del tenant/oferta.
- [ ] Fechas, horas, zona y moneda localizadas.
- [ ] Traducción de formularios, errores, emails y tickets.
- [ ] QA desktop/móvil de página, registro, pago, ticket y check-in.
- [ ] Revisión de teclado, foco, contraste, lectores y reduced motion.
- [ ] Build de producción y verificación del artefacto servido en staging.
- [ ] Commit/push separado por fase.
- [ ] Deploy solo tras autorización explícita y sin tocar CEP.

**Gate:** no se declara producción corregida sin comprobar el artefacto realmente servido.

## Plan de tests adversariales

Cada fase debe incluir como mínimo tres intentos de ruptura:

1. **Entrada límite:** campos, cupos, fechas, zonas, importes y listas vacías.
2. **Fail-closed:** tenant ausente, rol incorrecto, consentimiento ausente, firma inválida,
   ticket revocado o webhook falso.
3. **Variación no cubierta:** replay concurrente, evento duplicado, cambio de versión de formulario,
   pago tardío, cancelación durante hold o acompañante excediendo el límite.

Pruebas de integración obligatorias:

- dos tenants con el mismo slug;
- dos personas intentando la última plaza;
- pago exitoso dos veces;
- webhook duplicado y fuera de orden;
- refund después de check-in;
- promoción de waitlist;
- ticket cancelado usado en check-in;
- correo fallido sin rollback del registro;
- exportación sin PII de otro tenant;
- consentimiento de marketing ausente sin impedir email transaccional.

## Solution Registry de despliegue

| Opción                                          | Ventaja                             | Riesgo                                          | Decisión     |
| ----------------------------------------------- | ----------------------------------- | ----------------------------------------------- | ------------ |
| Activar directamente en producción              | Feedback rápido                     | Sin sandbox, tickets/email todavía incompletos  | Rechazada    |
| Staging Next aislado + datos sintéticos + gates | Evidencia reproducible y reversible | Requiere ciclo adicional                        | Seleccionada |
| Modificar CEP para validar paridad              | Datos parecidos                     | Rompe el límite de producción y mezcla carriles | Prohibida    |

## Evidencia y estados de entrega

En cada fase se registrará:

```text
auditado | implementado | probado | committed | pushed | desplegado | servido/verificado
```

La evidencia local y la evidencia live se mantendrán separadas. Los artefactos de QA del navegador
son evidencia operativa, no certificación ni prueba formal.

## Siguiente iteración autorizada

La siguiente implementación debe cerrar el resto de Fase 1: `event_sessions`, estados de publicación
y el contrato de cupos. Después se construirá Fase 2 sobre el ticket type ya verificado. `external_link`
permanecerá disponible como salida opcional durante la transición.

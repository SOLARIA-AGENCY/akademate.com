# CRM Leads v2 — Flujo completo de captacion y conversion

**Fecha:** 2026-04-07
**Estado:** Aprobado
**Scope:** cepformacion.akademate.com (tenant CEP Formacion)

## Contexto

El CRM de leads actual tiene tracking basico (flags booleanos en la tabla leads), estados inconsistentes entre DB y UI, KPIs placeholder, y no hay conexion lead-matricula. Esta mejora implementa trazabilidad completa, estados normalizados, flujo de conversion, y metricas reales.

Datos existentes son de prueba y descartables — migracion limpia sin riesgo.

## 1. Modelo de datos

### 1.1 Nueva tabla `lead_interactions` (append-only, inmutable)

```sql
CREATE TABLE lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  user_id INTEGER NOT NULL,
  channel VARCHAR(20) NOT NULL,       -- 'phone' | 'whatsapp' | 'email'
  result VARCHAR(30) NOT NULL,        -- 'no_answer' | 'positive' | 'negative' | 'callback' | 'wrong_number' | 'message_sent' | 'email_sent'
  note TEXT,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_tenant_id ON lead_interactions(tenant_id);
```

### 1.2 Nuevo enum de estados (reemplaza el actual)

```
new | contacted | following_up | interested | enrolling | enrolled | on_hold | not_interested | unreachable | discarded
```

Progresion logica:
1. `new` — recien llegado, sin atender
2. `contacted` — al menos 1 interaccion registrada
3. `following_up` — contacto establecido, pendiente de decision
4. `interested` — interes claro, candidato a matriculacion
5. `enrolling` — ficha de matricula abierta, pendiente pago
6. `enrolled` — pago efectuado, convertido en alumno (FINAL positivo)
7. `on_hold` — quiere info en el futuro
8. `not_interested` — descartado temporalmente
9. `unreachable` — numero/email invalido
10. `discarded` — definitivamente descartado

### 1.3 Campos nuevos en tabla `leads`

- `next_action_date` TIMESTAMP — proxima accion programada
- `next_action_note` TEXT — nota de la proxima accion
- `enrollment_id` INTEGER — referencia a ficha de matricula

### 1.4 Campos a derivar de `lead_interactions`

Los siguientes campos ya NO se almacenan en leads, se calculan:
- `contact_attempts` → `COUNT(*) FROM lead_interactions WHERE lead_id = ?`
- `last_contact_result` → ultima interaccion
- `contacted_phone/email/whatsapp` → `EXISTS` en interacciones
- Canales utilizados → `DISTINCT channel FROM lead_interactions`

## 2. API endpoints

### 2.1 Nuevos

| Metodo | Ruta | Funcion |
|--------|------|---------|
| `GET` | `/api/leads/[id]/interactions` | Historial de interacciones (paginado) |
| `POST` | `/api/leads/[id]/interactions` | Registrar interaccion + auto-update lead |
| `POST` | `/api/leads/[id]/enroll` | Iniciar matriculacion (transaccion atomica) |
| `GET` | `/api/leads/dashboard` | KPIs reales |

### 2.2 POST `/api/leads/[id]/interactions`

Request body:
```json
{
  "channel": "phone",
  "result": "no_answer",
  "note": "Llame a las 10am, no contesto"
}
```

Logica:
1. Insertar en `lead_interactions` con user_id del session y tenant_id
2. Actualizar `leads.last_contacted_at = NOW()`
3. Si es primer contacto (0 interacciones previas) → cambiar status a `contacted`
4. Retornar lead actualizado + interaccion creada

### 2.3 POST `/api/leads/[id]/enroll`

Precondicion: lead.status IN ('interested', 'following_up')

Transaccion atomica:
1. Crear enrollment con datos del lead (nombre, email, telefono, curso, campus)
2. Enrollment status = 'pending', payment_status = 'unpaid'
3. Actualizar lead.status → 'enrolling'
4. Actualizar lead.enrollment_id → nuevo enrollment.id
5. Registrar interaccion automatica (channel='system', result='enrollment_started')

Retorna enrollment creado para redirect.

### 2.4 GET `/api/leads/dashboard`

Metricas:
- `unattended`: leads con status='new' sin interacciones y created_at > 24h
- `conversionRate`: COUNT(enrolled) / COUNT(*) * 100
- `avgResponseTime`: media de (primera_interaccion.created_at - lead.created_at)
- `openEnrollments`: COUNT enrollments con status='pending'
- `followUpBreakdown`: { contacted: N, interested: N, on_hold: N }
- `totalLeads`, `newThisMonth`, `convertedThisMonth`

### 2.5 Modificaciones a endpoints existentes

**GET /api/leads:**
- Sort por defecto: new (oldest first) → contacted/following_up → interested → resto
- Incluir en respuesta: ultimo interactor (nombre + canal) via JOIN con lead_interactions
- Incluir: count de interacciones

**PATCH /api/leads/[id]:**
- Validar transiciones de estado permitidas
- Aceptar: assigned_to_id, next_action_date, next_action_note, status, priority

## 3. UI — Lista de leads

### 3.1 Dot de color por status

| Status | Color CSS | Clase |
|--------|-----------|-------|
| new | red-500 | `bg-red-500` |
| contacted | amber-500 | `bg-amber-500` |
| following_up | amber-500 | `bg-amber-500` |
| on_hold | amber-500 | `bg-amber-500` |
| interested | green-500 | `bg-green-500` |
| enrolling | blue-500 | `bg-blue-500` |
| enrolled | emerald-500 | `bg-emerald-500` |
| not_interested | gray-400 | `bg-gray-400` |
| unreachable | gray-400 | `bg-gray-400` |
| discarded | gray-400 | `bg-gray-400` |

### 3.2 Columnas de la tabla

1. Dot + Nombre completo
2. Email / Telefono
3. Tipo (badge)
4. Estado (badge con color)
5. Ultimo contacto: nombre asesor + icono canal (Phone/MessageCircle/Mail)
6. Intentos (count)
7. Hace (tiempo relativo)

### 3.3 KPIs (cards superiores)

- Total leads
- Sin atender (new >24h sin interaccion) — con indicador rojo si >0
- En seguimiento (tooltip: contactado X, interesado Y, en espera Z)
- Tasa de conversion (%)
- Fichas abiertas (pendientes pago)

## 4. UI — Ficha de lead

### 4.1 Historial de interacciones

Timeline vertical debajo de acciones:
- Cada entry: icono canal + nombre asesor + resultado (badge) + nota + fecha/hora
- Orden: mas reciente primero
- Append-only (no editable en UI)

### 4.2 Acciones de contacto

Al pulsar "Llamar", "WhatsApp" o "Email":
1. Se abre la accion (tel:, wa.me, mailto:)
2. Se muestra modal: "Registrar resultado del contacto"
   - Selector de resultado (Sin respuesta, Respondio positivo, etc.)
   - Nota opcional
   - Boton "Guardar" → POST /interactions
3. Al guardar, timeline se actualiza en tiempo real

### 4.3 Panel lateral mejorado

- Status (dropdown con los 10 estados)
- Prioridad
- Asesor asignado (dropdown de usuarios del tenant)
- Ultimo contacto: fecha + asesor + canal (derivado de interacciones)
- Proxima accion: date picker + nota
- Lead score

### 4.4 Boton "Iniciar Matriculacion"

- Visible solo si status IN (interested, following_up)
- Estilo: variant primary, icono GraduationCap
- Click → confirm dialog → POST /enroll → redirect /matriculaciones/[id]
- Si lead.enrollment_id existe → mostrar link "Ver ficha de matricula"

## 5. Fases de implementacion

### Fase 1: Backend (DB + API)
1.1 Migracion: nuevo enum, tabla lead_interactions, campos nuevos
1.2 API: POST/GET /leads/[id]/interactions
1.3 API: GET /leads/dashboard (KPIs reales)
1.4 API: POST /leads/[id]/enroll
1.5 Modificar GET /leads (sort, ultimo interactor)
1.6 Modificar PATCH /leads/[id] (validacion transiciones)

### Fase 2: UI Lista de leads
2.1 Dots de color + sort por defecto
2.2 Columna ultimo contacto (asesor + canal)
2.3 KPIs reales + tooltip desglose

### Fase 3: UI Ficha de lead
3.1 Historial de interacciones (timeline)
3.2 Modal de resultado al contactar
3.3 Panel lateral mejorado (asesor, proxima accion)
3.4 Boton "Iniciar Matriculacion"

### Fase 4: Dashboard
4.1 Sin atender, tasa conversion, tiempo medio respuesta
4.2 Fichas abiertas, desglose seguimiento

## Consideraciones tecnicas

- Todas las acciones registran: user_id, timestamp, tenant_id
- lead_interactions es INMUTABLE (INSERT only, no UPDATE/DELETE en API)
- Creacion de matricula es transaccion atomica (BEGIN/COMMIT/ROLLBACK)
- Colores de status via CSS classes (configurable por tenant en futuro)
- SSE existente se aprovecha para notificar leads nuevos

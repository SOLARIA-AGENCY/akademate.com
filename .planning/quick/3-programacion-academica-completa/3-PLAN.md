# Plan: Programación Académica Completa

## Fase 1 — Calendario Visual (HOY - demo CEP) ✅ IMPLEMENTADO
- [x] Vista anual Gantt con barras de convocatorias
- [x] Vista mes con grid de días y convocatorias
- [x] Vista semana con franjas horarias
- [x] Vista día con columnas por sede
- [x] Tabs de sede para filtrar
- [x] Navegación temporal (prev/next/hoy)
- [x] Festivos de Canarias 2026 marcados
- [x] KPIs (convocatorias, activas, plazas, ocupación)
- [x] Leyenda de estados con colores
- [x] Línea de "hoy" en Gantt anual

## Fase 2 — Modelo de Datos (próxima semana)

### 2.1 Tabla classrooms (independiente de campus JSON)
```sql
CREATE TABLE classrooms (
  id SERIAL PRIMARY KEY,
  campus_id INTEGER REFERENCES campuses(id),
  name VARCHAR(100),
  capacity INTEGER,
  floor VARCHAR(20),
  equipment TEXT[],
  active BOOLEAN DEFAULT true,
  tenant_id INTEGER DEFAULT 1
);
-- Migrar datos existentes del JSON campuses.classrooms
```

### 2.2 Tabla class_sessions (sesiones individuales)
```sql
CREATE TABLE class_sessions (
  id SERIAL PRIMARY KEY,
  course_run_id INTEGER REFERENCES course_runs(id),
  classroom_id INTEGER REFERENCES classrooms(id),
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  duration_minutes INTEGER,
  professor_id INTEGER,
  substitute_id INTEGER,
  status VARCHAR(20) DEFAULT 'planned',
  -- planned, confirmed, in_progress, completed, cancelled, substituted, rescheduled
  cancellation_reason TEXT,
  hours_planned DECIMAL(4,2),
  hours_taught DECIMAL(4,2),
  notes TEXT,
  tenant_id INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Tabla holidays
```sql
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(200),
  type VARCHAR(20), -- national, autonomous, local, center
  applies_to_campus INTEGER, -- NULL = all campuses
  tenant_id INTEGER DEFAULT 1
);
-- Seed: festivos España + Canarias + locales Santa Cruz
```

### 2.4 Auto-generación de sesiones
- Hook afterCreate en course_runs
- Genera sesiones desde start_date hasta end_date
- Respeta schedule_days (L,M,X,J,V)
- Excluye festivos
- Calcula hours_planned por sesión

## Fase 3 — Gestión Operativa

### 3.1 Asignación de aulas
- Selector de aula al crear/editar convocatoria
- Validación: no solapamiento en misma aula
- Vista de ocupación por aula

### 3.2 Cancelaciones y sustituciones
- Botón "Cancelar sesión" en vista día/semana
- Modal con motivo + opciones (reprogramar/sustituir/cancelar)
- Búsqueda de sustitutos disponibles
- Notificación automática (email)

### 3.3 Buffer inter-sede
```
travel_buffer_matrix:
  same_campus: 0
  SC_Norte: 120 min
  SC_Sur: 150 min
  Norte_Sur: 180 min
  any_Online: 0
```
- Validación al asignar profesor: verificar buffer con sesiones adyacentes en otra sede

### 3.4 Incidencias
- Registro de incidencias por día/aula/sede
- Tipos: avería, huelga, meteorología, otro
- Afecta a sesiones del día → auto-cancelación masiva

## Fase 4 — Tracking de Horas

### 4.1 Tabla professor_hours
```sql
CREATE TABLE professor_hours (
  id SERIAL PRIMARY KEY,
  professor_id INTEGER,
  session_id INTEGER REFERENCES class_sessions(id),
  course_run_id INTEGER REFERENCES course_runs(id),
  date DATE,
  hours_taught DECIMAL(4,2),
  hour_type VARCHAR(20), -- regular, substitute, overtime
  rate_per_hour DECIMAL(8,2),
  billable BOOLEAN DEFAULT true,
  billed BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  approved_by INTEGER,
  tenant_id INTEGER DEFAULT 1
);
```

### 4.2 Dashboard de horas
- Por curso: planificadas vs dictadas vs pendientes
- Por profesor: horas regulares + sustituciones + total facturable
- Exportación mensual para nóminas

### 4.3 Integración con Finanzas
- professor_hours → Nóminas y Costes
- Coste por convocatoria = SUM(professor_hours × rate)
- Rentabilidad = ingresos_matriculas - coste_profesores - coste_aula

## Fase 5 — Optimización (futuro)

### 5.1 Motor de conflictos
- Detectar solapamientos: aula, profesor, buffer inter-sede
- Alertas visuales en calendario (bordes rojos)
- Sugerencias automáticas de resolución

### 5.2 Drag-and-drop
- Mover bloques de sesión en vista semana/día
- Validación en tiempo real de conflictos
- Undo/redo

### 5.3 Algoritmo de optimización
- CSP (Constraint Satisfaction Problem)
- Variables: sesión × aula × horario
- Restricciones duras + blandas
- Solver greedy + local search

## Archivos por fase

| Fase | Archivos |
|------|----------|
| 1 ✅ | programacion/page.tsx (calendario visual) |
| 2 | migration SQL, collections/Classrooms, collections/ClassSessions, collections/Holidays |
| 3 | programacion/[id]/sesiones/page.tsx, api/sessions, api/substitutions |
| 4 | api/professor-hours, finanzas/nominas integration |
| 5 | lib/scheduler, components/DraggableSession |

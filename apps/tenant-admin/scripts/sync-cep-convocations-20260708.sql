-- CEP current convocation schedule sync.
-- Source of truth: user-provided updated schedule on 2026-07-08.
-- Scope: tenant 1 / cepformacion.akademate.com.

BEGIN;

INSERT INTO courses (
  codigo,
  slug,
  name,
  modality,
  course_type,
  area_formativa_id,
  active,
  operational_status,
  tenant_id,
  created_at,
  updated_at
)
SELECT
  'PRIV-GESTORVET',
  'seminario-gestorvet-priv',
  'Seminario de Gestorvet',
  'presencial',
  'privado',
  3,
  true,
  'active',
  1,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE slug = 'seminario-gestorvet-priv'
);

INSERT INTO courses (
  codigo,
  slug,
  name,
  modality,
  course_type,
  area_formativa_id,
  active,
  operational_status,
  tenant_id,
  created_at,
  updated_at
)
SELECT
  'PRIV-AUXFARM-PARA',
  'auxiliar-de-farmacia-y-parafarmacia-priv',
  'Auxiliar de Farmacia y Parafarmacia',
  'presencial',
  'privado',
  2,
  true,
  'active',
  1,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE slug = 'auxiliar-de-farmacia-y-parafarmacia-priv'
);

CREATE TEMP TABLE _cep_convocation_sync (
  codigo text PRIMARY KEY,
  course_slug text,
  cycle_slug text,
  campus_slug text NOT NULL,
  classroom_code text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days text[] NOT NULL,
  start_time text,
  end_time text,
  shift text NOT NULL,
  training_type text NOT NULL DEFAULT 'private',
  status text NOT NULL DEFAULT 'enrollment_open',
  enrollment_status text NOT NULL DEFAULT 'open',
  planning_status text NOT NULL DEFAULT 'published',
  max_students integer NOT NULL DEFAULT 18,
  instructor_id integer,
  instructor_ids integer[] NOT NULL DEFAULT '{}',
  notes text
);

INSERT INTO _cep_convocation_sync VALUES
  -- Santa Cruz / mañana
  ('SC-2026-017', 'ayudante-tecnico-veterinario-atv-priv', NULL, 'sede-santa-cruz', 'SC-AULA-2', '2026-11-10', '2027-05-10', ARRAY['tuesday'], '10:30:00', '13:30:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 18, 15, ARRAY[15], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: ATV mañana inicia 10/11/2026.'),

  -- Santa Cruz / tarde
  ('SC-2026-010', 'auxiliar-de-enfermeria-priv', NULL, 'sede-santa-cruz', 'SC-AULA-2', '2026-07-15', '2027-04-24', ARRAY['wednesday'], '16:30:00', '19:30:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 22, 16, ARRAY[16,25], 'Actualizada por sincronización CEP 2026-07-08. Fuente actualizada: Auxiliar de Enfermería tarde inicia 15/07/2026. Fin conservado por falta de fecha final nueva.'),
  ('SC-2026-018', 'auxiliar-clinico-veterinario-priv', NULL, 'sede-santa-cruz', 'SC-AULA-2', '2026-11-01', '2027-07-01', ARRAY['monday'], '16:00:00', '19:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'pending_validation', 18, 15, ARRAY[15], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada indica ACV tarde en noviembre 2026 sin día exacto; se registra 01/11/2026 como placeholder pendiente de validación.'),
  ('SC-2026-001', NULL, 'cfgm-farmacia-parafarmacia', 'sede-santa-cruz', 'SC-MAC', '2026-09-21', '2028-06-30', ARRAY['monday'], '17:00:00', '21:00:00', 'afternoon', 'cycle', 'enrollment_open', 'open', 'published', 18, NULL, ARRAY[]::integer[], 'Actualizada por sincronización CEP 2026-07-08. Fuente actualizada: CFGM Farmacia y Parafarmacia inicia 21/09/2026 en horario de tarde.'),
  ('SC-2026-002', NULL, 'cfgs-higiene-bucodental', 'sede-santa-cruz', 'SC-MAC', '2026-09-22', '2028-06-30', ARRAY['tuesday'], '17:00:00', '21:00:00', 'afternoon', 'cycle', 'enrollment_open', 'open', 'published', 18, NULL, ARRAY[]::integer[], 'Actualizada por sincronización CEP 2026-07-08. Fuente actualizada: CFGS Higiene Bucodental inicia 22/09/2026 en horario de tarde.'),

  -- CEP Norte / mañana
  ('NOR-2026-001', 'seminario-gestorvet-priv', NULL, 'sede-norte', 'N-AULA-2', '2026-08-10', '2026-08-13', ARRAY['monday','wednesday','thursday'], '10:00:00', '13:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 15, ARRAY[15], 'Creada por sincronización CEP 2026-07-08. Seminario de Gestorvet: sesiones 10, 12 y 13 de agosto de 2026.'),
  ('NOR-2026-002', 'nutricosmetica-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-09-10', '2026-11-26', ARRAY['thursday'], '10:00:00', '14:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 22, ARRAY[22], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Nutricosmética inicia 10/09/2026.'),
  ('NOR-2026-003', 'auxiliar-de-farmacia-y-parafarmacia-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-09-14', '2027-07-01', ARRAY['monday'], '10:00:00', '14:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 22, ARRAY[22], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Auxiliar de Farmacia y Parafarmacia inicia 14/09/2026.'),
  ('NOR-2026-004', 'quiromasaje-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-09-15', '2027-07-15', ARRAY['tuesday'], '10:00:00', '14:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 24, ARRAY[24], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Quiromasaje inicia 15/09/2026.'),
  ('NOR-2026-005', 'auxiliar-de-clinicas-esteticas-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-11-11', '2027-09-01', ARRAY['wednesday'], '10:00:00', '14:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 22, ARRAY[22,14,32], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Auxiliar en Clínicas Estéticas inicia 11/11/2026.'),
  ('NOR-2026-006', 'auxiliar-de-odontologia-e-higiene-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-11-26', '2027-07-01', ARRAY['thursday'], '10:00:00', '14:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 28, ARRAY[28], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Auxiliar de Odontología inicia 26/11/2026.'),
  ('NOR-2027-001', 'ayudante-tecnico-veterinario-atv-priv', NULL, 'sede-norte', 'N-AULA-5', '2027-03-05', '2028-05-01', ARRAY['friday'], '10:00:00', '13:00:00', 'morning', 'private', 'enrollment_open', 'open', 'published', 17, 15, ARRAY[15], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: ATV Norte mañana inicia 05/03/2027.'),

  -- CEP Norte / tarde
  ('NOR-2026-007', 'entrenamiento-personal-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-06-19', '2027-01-29', ARRAY['friday'], '17:00:00', '20:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 17, 18, ARRAY[18,6,22,10], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Entrenamiento Personal inicia 19/06/2026.'),
  ('NOR-2026-008', 'peluqueria-canina-y-felina-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-09-09', '2027-03-24', ARRAY['wednesday'], '16:00:00', '19:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 17, 30, ARRAY[30], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Peluquería Canina y Felina inicia 09/09/2026.'),
  ('NOR-2026-009', 'especializacion-clinica-avanzada-para-acv-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-09-10', '2027-06-24', ARRAY['thursday'], '17:00:00', '20:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 17, 15, ARRAY[15], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Urgencias, laboratorio y rehabilitación inicia 10/09/2026; curso mapeado a Especialización Clínica Avanzada para ACV.'),
  ('NOR-2026-010', 'adiestramiento-canino-i-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-09-16', '2027-08-27', ARRAY['wednesday'], '16:00:00', '19:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 17, 20, ARRAY[20], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Adiestramiento Profesional Canino Nivel 1 inicia 16/09/2026 en horario de tarde.'),
  ('NOR-2026-011', 'farmacia-y-dermocosmetica-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-10-26', '2027-08-30', ARRAY['monday'], '16:00:00', '20:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 17, 19, ARRAY[19], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Farmacia + Dermocosmética inicia 26/10/2026.'),
  ('NOR-2026-012', 'auxiliar-de-enfermeria-priv', NULL, 'sede-norte', 'N-AULA-5', '2026-10-27', '2027-08-01', ARRAY['tuesday'], '17:00:00', '20:00:00', 'afternoon', 'private', 'enrollment_open', 'open', 'published', 17, 9, ARRAY[9], 'Creada por sincronización CEP 2026-07-08. Fuente actualizada: Auxiliar de Enfermería inicia 27/10/2026.');

UPDATE course_runs cr
SET
  course_id = c.id,
  cycle_id = cy.id,
  campus_id = ca.id,
  classroom_id = cl.id,
  start_date = s.start_date::timestamp with time zone,
  end_date = s.end_date::timestamp with time zone,
  enrollment_deadline = (s.start_date - interval '1 day')::timestamp with time zone,
  schedule_time_start = s.start_time,
  schedule_time_end = s.end_time,
  shift = s.shift::enum_course_runs_shift,
  training_type = s.training_type::enum_course_runs_training_type,
  status = s.status::enum_course_runs_status,
  enrollment_status = s.enrollment_status::enum_course_runs_enrollment_status,
  planning_status = s.planning_status::enum_course_runs_planning_status,
  max_students = s.max_students,
  min_students = 1,
  instructor_id = s.instructor_id,
  notes = s.notes,
  updated_at = now()
FROM _cep_convocation_sync s
LEFT JOIN courses c ON c.slug = s.course_slug
LEFT JOIN cycles cy ON cy.slug = s.cycle_slug
JOIN campuses ca ON ca.slug = s.campus_slug AND ca.tenant_id = 1
LEFT JOIN classrooms cl ON cl.code = s.classroom_code AND cl.tenant_id = 1
WHERE cr.codigo = s.codigo;

INSERT INTO course_runs (
  course_id,
  cycle_id,
  campus_id,
  classroom_id,
  codigo,
  start_date,
  end_date,
  enrollment_deadline,
  schedule_time_start,
  schedule_time_end,
  shift,
  training_type,
  status,
  enrollment_status,
  planning_status,
  max_students,
  min_students,
  current_enrollments,
  instructor_id,
  notes,
  tenant_id,
  created_at,
  updated_at
)
SELECT
  c.id,
  cy.id,
  ca.id,
  cl.id,
  s.codigo,
  s.start_date::timestamp with time zone,
  s.end_date::timestamp with time zone,
  (s.start_date - interval '1 day')::timestamp with time zone,
  s.start_time,
  s.end_time,
  s.shift::enum_course_runs_shift,
  s.training_type::enum_course_runs_training_type,
  s.status::enum_course_runs_status,
  s.enrollment_status::enum_course_runs_enrollment_status,
  s.planning_status::enum_course_runs_planning_status,
  s.max_students,
  1,
  0,
  s.instructor_id,
  s.notes,
  1,
  now(),
  now()
FROM _cep_convocation_sync s
LEFT JOIN courses c ON c.slug = s.course_slug
LEFT JOIN cycles cy ON cy.slug = s.cycle_slug
JOIN campuses ca ON ca.slug = s.campus_slug AND ca.tenant_id = 1
LEFT JOIN classrooms cl ON cl.code = s.classroom_code AND cl.tenant_id = 1
WHERE NOT EXISTS (
  SELECT 1 FROM course_runs cr WHERE cr.codigo = s.codigo
);

DELETE FROM course_runs_schedule_days d
USING course_runs cr, _cep_convocation_sync s
WHERE d.parent_id = cr.id
  AND cr.codigo = s.codigo;

INSERT INTO course_runs_schedule_days ("order", parent_id, value)
SELECT
  ordinality::integer - 1,
  cr.id,
  day_value::enum_course_runs_schedule_days
FROM _cep_convocation_sync s
JOIN course_runs cr ON cr.codigo = s.codigo
CROSS JOIN LATERAL unnest(s.days) WITH ORDINALITY AS days(day_value, ordinality);

DELETE FROM course_runs_rels r
USING course_runs cr, _cep_convocation_sync s
WHERE r.parent_id = cr.id
  AND r.path = 'instructors'
  AND cr.codigo = s.codigo;

INSERT INTO course_runs_rels ("order", parent_id, path, staff_id)
SELECT
  ordinality::integer - 1,
  cr.id,
  'instructors',
  staff_id
FROM _cep_convocation_sync s
JOIN course_runs cr ON cr.codigo = s.codigo
CROSS JOIN LATERAL unnest(s.instructor_ids) WITH ORDINALITY AS instructors(staff_id, ordinality)
WHERE staff_id IS NOT NULL;

COMMIT;

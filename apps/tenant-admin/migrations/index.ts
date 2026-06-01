import * as migration_20251207_081627 from './20251207_081627';
import * as migration_20260417_073500 from './20260417_073500';
import * as migration_20260417_160200 from './20260417_160200';
import * as migration_20260421_121517 from './20260421_121517';
import * as migration_20260427_cep_planning_v1 from './20260427_cep_planning_v1';
import * as migration_20260428_students_tenant from './20260428_students_tenant';
import * as migration_20260507_course_landing_design from './20260507_course_landing_design';
import * as migration_20260513_lead_appointments from './20260513_lead_appointments';
import * as migration_20260526_staff_import_status from './20260526_staff_import_status';
import * as migration_20260527_course_run_enrollment_status from './20260527_course_run_enrollment_status';
import * as migration_20260601_course_run_sessions from './20260601_course_run_sessions';

export const migrations = [
  {
    up: migration_20251207_081627.up,
    down: migration_20251207_081627.down,
    name: '20251207_081627'
  },
  {
    up: migration_20260417_073500.up,
    down: migration_20260417_073500.down,
    name: '20260417_073500'
  },
  {
    up: migration_20260417_160200.up,
    down: migration_20260417_160200.down,
    name: '20260417_160200'
  },
  {
    up: migration_20260421_121517.up,
    down: migration_20260421_121517.down,
    name: '20260421_121517'
  },
  {
    up: migration_20260427_cep_planning_v1.up,
    down: migration_20260427_cep_planning_v1.down,
    name: '20260427_cep_planning_v1'
  },
  {
    up: migration_20260428_students_tenant.up,
    down: migration_20260428_students_tenant.down,
    name: '20260428_students_tenant'
  },
  {
    up: migration_20260507_course_landing_design.up,
    down: migration_20260507_course_landing_design.down,
    name: '20260507_course_landing_design'
  },
  {
    up: migration_20260513_lead_appointments.up,
    down: migration_20260513_lead_appointments.down,
    name: '20260513_lead_appointments'
  },
  {
    up: migration_20260526_staff_import_status.up,
    down: migration_20260526_staff_import_status.down,
    name: '20260526_staff_import_status'
  },
  {
    up: migration_20260527_course_run_enrollment_status.up,
    down: migration_20260527_course_run_enrollment_status.down,
    name: '20260527_course_run_enrollment_status'
  },
  {
    up: migration_20260601_course_run_sessions.up,
    down: migration_20260601_course_run_sessions.down,
    name: '20260601_course_run_sessions'
  },
];

import * as migration_20251207_081627 from './20251207_081627'
import * as migration_20260417_073500 from './20260417_073500'
import * as migration_20260417_160200 from './20260417_160200'
import * as migration_20260421_121517 from './20260421_121517'
import * as migration_20260422_create_classrooms_base from './20260422_create_classrooms_base'
import * as migration_20260427_cep_planning_v1 from './20260427_cep_planning_v1'
import * as migration_20260428_students_tenant from './20260428_students_tenant'
import * as migration_20260507_course_landing_design from './20260507_course_landing_design'
import * as migration_20260513_lead_appointments from './20260513_lead_appointments'
import * as migration_20260526_staff_import_status from './20260526_staff_import_status'
import * as migration_20260527_course_run_enrollment_status from './20260527_course_run_enrollment_status'
import * as migration_20260601_course_run_sessions from './20260601_course_run_sessions'
import * as migration_20260602_staff_qualified_areas from './20260602_staff_qualified_areas'
import * as migration_20260626_staff_general_regime_contract from './20260626_staff_general_regime_contract'
import * as migration_20260629_course_run_practice_certification from './20260629_course_run_practice_certification'
import * as migration_20260630_staff_profile_campuses from './20260630_staff_profile_campuses'
import * as migration_20260713_campus_virtual_internal from './20260713_campus_virtual_internal'
import * as migration_20260714_staging_tenant_schema_compat from './20260714_staging_tenant_schema_compat'
import * as migration_20260714_staging_users_auth_compat from './20260714_staging_users_auth_compat'
import * as migration_20260730_akademate_next_learning from './20260730_akademate_next_learning'
import * as migration_20260731_akademate_next_message_consistency from './20260731_akademate_next_message_consistency'
import * as migration_20260802_akademate_next_signage from './20260802_akademate_next_signage'
import * as migration_20260803_akademate_next_offer_conversion_modes from './20260803_akademate_next_offer_conversion_modes'
import * as migration_20260803_akademate_next_offer_runtime_access from './20260803_akademate_next_offer_runtime_access'
import * as migration_20260803_akademate_next_public_offer_projection from './20260803_akademate_next_public_offer_projection'
import * as migration_20260803_akademate_next_public_offer_submissions from './20260803_akademate_next_public_offer_submissions'
import * as migration_20260803_zz_akademate_next_offer_submission_review from './20260803_zz_akademate_next_offer_submission_review'
import * as migration_20260803_zzz_akademate_next_offer_enrollment_conversion from './20260803_zzz_akademate_next_offer_enrollment_conversion'
import { selectRuntimeMigrations } from '../src/runtime/select-runtime-migrations'

const legacyMigrations = [
  {
    up: migration_20251207_081627.up,
    down: migration_20251207_081627.down,
    name: '20251207_081627',
  },
  {
    up: migration_20260417_073500.up,
    down: migration_20260417_073500.down,
    name: '20260417_073500',
  },
  {
    up: migration_20260417_160200.up,
    down: migration_20260417_160200.down,
    name: '20260417_160200',
  },
  {
    up: migration_20260421_121517.up,
    down: migration_20260421_121517.down,
    name: '20260421_121517',
  },
  {
    up: migration_20260422_create_classrooms_base.up,
    down: migration_20260422_create_classrooms_base.down,
    name: '20260422_create_classrooms_base',
  },
  {
    up: migration_20260427_cep_planning_v1.up,
    down: migration_20260427_cep_planning_v1.down,
    name: '20260427_cep_planning_v1',
  },
  {
    up: migration_20260428_students_tenant.up,
    down: migration_20260428_students_tenant.down,
    name: '20260428_students_tenant',
  },
  {
    up: migration_20260507_course_landing_design.up,
    down: migration_20260507_course_landing_design.down,
    name: '20260507_course_landing_design',
  },
  {
    up: migration_20260513_lead_appointments.up,
    down: migration_20260513_lead_appointments.down,
    name: '20260513_lead_appointments',
  },
  {
    up: migration_20260526_staff_import_status.up,
    down: migration_20260526_staff_import_status.down,
    name: '20260526_staff_import_status',
  },
  {
    up: migration_20260527_course_run_enrollment_status.up,
    down: migration_20260527_course_run_enrollment_status.down,
    name: '20260527_course_run_enrollment_status',
  },
  {
    up: migration_20260601_course_run_sessions.up,
    down: migration_20260601_course_run_sessions.down,
    name: '20260601_course_run_sessions',
  },
  {
    up: migration_20260602_staff_qualified_areas.up,
    down: migration_20260602_staff_qualified_areas.down,
    name: '20260602_staff_qualified_areas',
  },
  {
    up: migration_20260626_staff_general_regime_contract.up,
    down: migration_20260626_staff_general_regime_contract.down,
    name: '20260626_staff_general_regime_contract',
  },
  {
    up: migration_20260629_course_run_practice_certification.up,
    down: migration_20260629_course_run_practice_certification.down,
    name: '20260629_course_run_practice_certification',
  },
  {
    up: migration_20260630_staff_profile_campuses.up,
    down: migration_20260630_staff_profile_campuses.down,
    name: '20260630_staff_profile_campuses',
  },
  {
    up: migration_20260713_campus_virtual_internal.up,
    down: migration_20260713_campus_virtual_internal.down,
    name: '20260713_campus_virtual_internal',
  },
  {
    up: migration_20260714_staging_tenant_schema_compat.up,
    down: migration_20260714_staging_tenant_schema_compat.down,
    name: '20260714_staging_tenant_schema_compat',
  },
  {
    up: migration_20260714_staging_users_auth_compat.up,
    down: migration_20260714_staging_users_auth_compat.down,
    name: '20260714_staging_users_auth_compat',
  },
]

const nextMigrations = [
  {
    up: migration_20251207_081627.up,
    down: migration_20251207_081627.down,
    name: '20251207_081627',
  },
  {
    up: migration_20260428_students_tenant.up,
    down: migration_20260428_students_tenant.down,
    name: '20260428_students_tenant',
  },
  {
    up: migration_20260730_akademate_next_learning.up,
    down: migration_20260730_akademate_next_learning.down,
    name: '20260730_akademate_next_learning',
  },
  {
    up: migration_20260731_akademate_next_message_consistency.up,
    down: migration_20260731_akademate_next_message_consistency.down,
    name: '20260731_akademate_next_message_consistency',
  },
  {
    up: migration_20260802_akademate_next_signage.up,
    down: migration_20260802_akademate_next_signage.down,
    name: '20260802_akademate_next_signage',
  },
  {
    up: migration_20260803_akademate_next_offer_conversion_modes.up,
    down: migration_20260803_akademate_next_offer_conversion_modes.down,
    name: '20260803_akademate_next_offer_conversion_modes',
  },
  {
    up: migration_20260803_akademate_next_offer_runtime_access.up,
    down: migration_20260803_akademate_next_offer_runtime_access.down,
    name: '20260803_akademate_next_offer_runtime_access',
  },
  {
    up: migration_20260803_akademate_next_public_offer_projection.up,
    down: migration_20260803_akademate_next_public_offer_projection.down,
    name: '20260803_akademate_next_public_offer_projection',
  },
  {
    up: migration_20260803_akademate_next_public_offer_submissions.up,
    down: migration_20260803_akademate_next_public_offer_submissions.down,
    name: '20260803_akademate_next_public_offer_submissions',
  },
  {
    up: migration_20260803_zz_akademate_next_offer_submission_review.up,
    down: migration_20260803_zz_akademate_next_offer_submission_review.down,
    name: '20260803_zz_akademate_next_offer_submission_review',
  },
  {
    up: migration_20260803_zzz_akademate_next_offer_enrollment_conversion.up,
    down: migration_20260803_zzz_akademate_next_offer_enrollment_conversion.down,
    name: '20260803_zzz_akademate_next_offer_enrollment_conversion',
  },
]

export const migrations = selectRuntimeMigrations(
  process.env.AKADEMATE_RUNTIME,
  legacyMigrations,
  nextMigrations,
)

import * as migration_20251207_081627 from './20251207_081627';
import * as migration_20260417_073500 from './20260417_073500';
import * as migration_20260417_160200 from './20260417_160200';
import * as migration_20260421_121517 from './20260421_121517';
import * as migration_20260427_cep_planning_v1 from './20260427_cep_planning_v1';
import * as migration_20260428_students_tenant from './20260428_students_tenant';
import * as migration_20260507_course_landing_design from './20260507_course_landing_design';

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
];

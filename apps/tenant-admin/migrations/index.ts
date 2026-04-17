import * as migration_20251207_081627 from './20251207_081627';
import * as migration_20260417_073500 from './20260417_073500';
import * as migration_20260417_160200 from './20260417_160200';

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
];

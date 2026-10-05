import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd())

describe('session_version expand migration', () => {
  it('is registered and remains nullable/default/backfill-compatible', () => {
    const migration = readFileSync(join(root, 'migrations/20260710_users_session_version_expand.ts'), 'utf8')
    const index = readFileSync(join(root, 'migrations/index.ts'), 'utf8')
    expect(index).toContain("name: '20260710_users_session_version_expand'")
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 1/)
    expect(migration).toMatch(/WHERE "session_version" IS NULL/)
    expect(migration).not.toMatch(/session_version[^;]*NOT NULL/i)
    expect(migration).not.toMatch(/DROP COLUMN/)
  })
})

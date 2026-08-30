import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const policiesSql = readFileSync(join(here, '../src/rls/policies.sql'), 'utf8')

describe('RLS policy catalog', () => {
  it('enables isolation on foundation tenant tables', () => {
    for (const table of ['legal_entities', 'campuses', 'tenant_capabilities', 'policies']) {
      expect(policiesSql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
      expect(policiesSql).toContain(`tenant_isolation_${table}`)
    }
  })

  it('keeps platform default policies visible when tenant_id is null', () => {
    expect(policiesSql).toContain('tenant_id IS NULL')
  })

  it('casts app.tenant_id to uuid, matching the Drizzle schema', () => {
    expect(policiesSql).toContain("current_setting('app.tenant_id', true)::uuid")
  })
})

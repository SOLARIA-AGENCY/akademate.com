import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dbMigrationsDirectory = fileURLToPath(new URL('../../db/migrations/', import.meta.url))
const drizzleJournalPath = fileURLToPath(
  new URL('../../db/migrations/meta/_journal.json', import.meta.url)
)
const payloadMigrationIndexPath = fileURLToPath(
  new URL('../../../apps/tenant-admin/migrations/index.ts', import.meta.url)
)
const payloadConfigPath = fileURLToPath(
  new URL('../../../apps/tenant-admin/src/payload.config.ts', import.meta.url)
)

const reservedMigrationPattern = /cep_(?:multi_entity|accounting)/i

describe('multi-entity production deployment guard', () => {
  it('does not register a CEP multi-entity migration in the automatic Drizzle journal', () => {
    const journal = readFileSync(drizzleJournalPath, 'utf8')
    const migrationFiles = readdirSync(dbMigrationsDirectory)

    expect(journal).not.toMatch(reservedMigrationPattern)
    expect(migrationFiles.filter((file) => reservedMigrationPattern.test(file))).toEqual([])
  })

  it('does not register a Payload multi-entity migration before schema authority is resolved', () => {
    const migrationIndex = readFileSync(payloadMigrationIndexPath, 'utf8')

    expect(migrationIndex).not.toMatch(/multi.?entity|legal.?entit|accounting.?connection/i)
  })

  it('wires the shadow schema through the fail-closed gate instead of registering it directly', () => {
    const payloadConfig = readFileSync(payloadConfigPath, 'utf8')

    expect(payloadConfig).toContain('...getMultiEntityShadowCollections()')
    expect(payloadConfig).not.toContain('...CEP_MULTI_ENTITY_SHADOW_COLLECTIONS')
  })
})

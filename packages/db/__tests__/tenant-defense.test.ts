import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { schema } from '../src/schema'
import inventory from '../tenant-defense/inventory.json'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inventoryByTable = new Map(inventory.tables.map((entry) => [entry.table, entry]))
const drizzleTables = Object.values(schema).map((table) => getTableConfig(table))

describe('REM-033 tenant inventory', () => {
  it('classifies every Drizzle table exactly once', () => {
    const names = drizzleTables.map((table) => table.name).sort()
    const classified = inventory.tables.filter((entry) => entry.schemaManaged).map((entry) => entry.table).sort()

    expect(new Set(inventory.tables.map((entry) => entry.table)).size).toBe(inventory.tables.length)
    expect(classified).toEqual(names)
  })

  it('matches tenant_id presence and nullability in Drizzle', () => {
    for (const table of drizzleTables) {
      const entry = inventoryByTable.get(table.name)
      const tenantColumn = table.columns.find((column) => column.name === 'tenant_id')
      const actual = tenantColumn ? (tenantColumn.notNull ? 'required' : 'nullable') : 'missing'
      expect(entry?.tenantId, table.name).toBe(actual)
    }
  })

  it('keeps the current nullable tenant-owned gap explicit and fail-closed', () => {
    expect(inventoryByTable.get('badge_definitions')).toMatchObject({
      classification: 'tenant-owned',
      tenantId: 'nullable',
    })

    let stdout = ''
    try {
      stdout = execFileSync(process.execPath, ['scripts/tenant-defense-audit.mjs'], {
        cwd: packageRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      stdout = (error as { stdout?: string }).stdout ?? ''
    }
    const report = JSON.parse(stdout)
    expect(report.verdict).toBe('FAIL')
    expect(report.errors).toEqual([
      'tenant-owned table is not fail-closed: badge_definitions tenant_id=nullable',
    ])
  })

  it('classifies every table created by migration SQL', () => {
    const migrationDir = resolve(packageRoot, 'migrations')
    const sql = readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => readFileSync(resolve(migrationDir, file), 'utf8'))
      .join('\n')
    const names = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?["']?([a-z0-9_]+)["']?/gi)]
      .map((match) => match[1])

    expect([...new Set(names)].filter((name) => !inventoryByTable.has(name))).toEqual([])
    expect(inventoryByTable.get('password_reset_tokens')?.schemaManaged).toBe(false)
    expect(inventoryByTable.get('login_attempts')?.schemaManaged).toBe(false)
  })
})

describe('REM-033 SQL safety boundaries', () => {
  const tenantDefenseRoot = resolve(packageRoot, 'tenant-defense')
  const templates = readdirSync(resolve(tenantDefenseRoot, 'templates')).map((file) => ({
    file,
    sql: readFileSync(resolve(tenantDefenseRoot, 'templates', file), 'utf8'),
  }))
  const stagingForward = ['01-observation-policies.sql', '02-comparison-queries.sql'].map((file) => ({
    file,
    sql: readFileSync(resolve(tenantDefenseRoot, 'staging', file), 'utf8'),
  }))
  const rollback = readFileSync(resolve(tenantDefenseRoot, 'staging/99-disable-observation-policies.sql'), 'utf8')

  it('contains no destructive DDL in forward preparation SQL', () => {
    for (const { file, sql } of [...templates, ...stagingForward]) {
      expect(sql, file).not.toMatch(/\bDROP\s+(TABLE|COLUMN|POLICY|CONSTRAINT|SCHEMA|TYPE)\b/i)
      expect(sql, file).not.toMatch(/\bTRUNCATE\b/i)
    }
  })

  it('does not enable or force RLS globally', () => {
    for (const { file, sql } of [...templates, ...stagingForward]) {
      expect(sql, file).not.toMatch(/\b(ENABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/i)
    }
  })

  it('limits rollback to REM-033 policy removal', () => {
    expect(rollback).toMatch(/policyname LIKE 'rem033_observe_%'/)
    expect(rollback).toMatch(/DROP POLICY/)
    expect(rollback).not.toMatch(/\bDROP\s+(TABLE|COLUMN|CONSTRAINT|SCHEMA|TYPE)\b/i)
    expect(rollback).not.toMatch(/\bALTER\s+TABLE\b/i)
    expect(rollback).not.toMatch(/\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i)
  })

  it('keeps expand, verify, and NOT NULL enforcement in separate files', () => {
    expect(templates[0]?.sql).toMatch(/ADD COLUMN IF NOT EXISTS tenant_id uuid/)
    expect(templates[0]?.sql).not.toMatch(/SET NOT NULL/)
    expect(templates[1]?.sql).toMatch(/tenant_id IS NULL/)
    expect(templates[1]?.sql).toMatch(/RAISE EXCEPTION/)
    expect(templates[2]?.sql).toMatch(/SET NOT NULL/)
  })
})

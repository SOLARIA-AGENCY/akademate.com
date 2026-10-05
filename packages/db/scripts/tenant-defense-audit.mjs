#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Map(process.argv.slice(2).map((arg, index, all) => [arg, all[index + 1]]))
const format = args.get('--format') ?? 'json'
const output = args.get('--output')

if (!['json', 'markdown'].includes(format)) {
  console.error('REM-033 audit: --format must be json or markdown')
  process.exit(2)
}

const inventory = JSON.parse(await readFile(resolve(root, 'tenant-defense/inventory.json'), 'utf8'))
const schemaSource = await readFile(resolve(root, 'src/schema.ts'), 'utf8')
const migrationDir = resolve(root, 'migrations')
const migrationFiles = (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort()
const migrationSql = (await Promise.all(migrationFiles.map((name) => readFile(resolve(migrationDir, name), 'utf8')))).join('\n')

const schemaTables = new Map()
const tablePattern = /export const \w+ = pgTable\(['"]([^'"]+)['"],\s*\{/g
for (const match of schemaSource.matchAll(tablePattern)) {
  const start = match.index + match[0].length
  let depth = 1
  let end = start
  for (; end < schemaSource.length && depth > 0; end += 1) {
    if (schemaSource[end] === '{') depth += 1
    if (schemaSource[end] === '}') depth -= 1
  }
  const body = schemaSource.slice(start, end - 1)
  const tenantColumn = /tenantId:\s*uuid\(['"]tenant_id['"]\)([\s\S]*?)(?=\n\s{2}\w+\s*:|$)/.exec(body)
  schemaTables.set(match[1], tenantColumn ? (tenantColumn[1].includes('.notNull()') ? 'required' : 'nullable') : 'missing')
}

const migrationTables = new Set([...migrationSql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?["']?([a-z0-9_]+)["']?/gi)].map((match) => match[1]))
const errors = []
const warnings = []
const inventoryByName = new Map()

for (const entry of inventory.tables) {
  if (inventoryByName.has(entry.table)) errors.push(`duplicate inventory entry: ${entry.table}`)
  inventoryByName.set(entry.table, entry)
  if (!['global', 'tenant-owned'].includes(entry.classification)) errors.push(`invalid classification: ${entry.table}`)
  if (entry.schemaManaged && !schemaTables.has(entry.table)) errors.push(`inventory table absent from Drizzle schema: ${entry.table}`)
  if (!entry.schemaManaged && schemaTables.has(entry.table)) errors.push(`migration-only table is now schema-managed: ${entry.table}`)
  if (!migrationTables.has(entry.table)) errors.push(`inventory table absent from migration SQL: ${entry.table}`)
  if (entry.schemaManaged && schemaTables.get(entry.table) !== entry.tenantId) {
    errors.push(`tenant_id state mismatch for ${entry.table}: inventory=${entry.tenantId}, schema=${schemaTables.get(entry.table)}`)
  }
  if (entry.classification === 'tenant-owned' && entry.tenantId !== 'required') {
    errors.push(`tenant-owned table is not fail-closed: ${entry.table} tenant_id=${entry.tenantId}`)
  }
}

for (const table of schemaTables.keys()) if (!inventoryByName.has(table)) errors.push(`unclassified Drizzle table: ${table}`)
for (const table of migrationTables) if (!inventoryByName.has(table)) errors.push(`unclassified migration table: ${table}`)

const legacySessions = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+sessions[\s\S]*?tenant_id/i.test(migrationSql)
if (legacySessions && schemaTables.get('sessions') === 'missing') {
  warnings.push('legacy 0002_add_sessions.sql defines tenant-scoped sessions with an incompatible shape; current Drizzle sessions is global')
}

const counts = {
  inventory: inventory.tables.length,
  schema: schemaTables.size,
  migration: migrationTables.size,
  tenantOwned: inventory.tables.filter((entry) => entry.classification === 'tenant-owned').length,
  global: inventory.tables.filter((entry) => entry.classification === 'global').length,
  missingTenantId: inventory.tables.filter((entry) => entry.tenantId === 'missing').length,
  nullableTenantId: inventory.tables.filter((entry) => entry.tenantId === 'nullable').length,
}
const report = { remediation: inventory.remediation, verdict: errors.length === 0 ? 'PASS' : 'FAIL', counts, errors, warnings, tables: inventory.tables }
const markdown = [
  '# REM-033 Tenant Defense Audit',
  '',
  `**Verdict:** ${report.verdict}`,
  '',
  `Inventory: ${counts.inventory}; Drizzle: ${counts.schema}; migration SQL: ${counts.migration}; tenant-owned: ${counts.tenantOwned}; global: ${counts.global}.`,
  '',
  '| Table | Classification | Source | tenant_id |',
  '|---|---|---|---|',
  ...inventory.tables.map((entry) => `| ${entry.table} | ${entry.classification} | ${entry.schemaManaged ? 'Drizzle' : 'migration-only'} | ${entry.tenantId} |`),
  '',
  '## Errors',
  '',
  ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None.']),
  '',
  '## Warnings',
  '',
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ['- None.']),
  '',
].join('\n')
const rendered = format === 'json' ? `${JSON.stringify(report, null, 2)}\n` : markdown
if (output) await writeFile(resolve(process.cwd(), output), rendered)
else process.stdout.write(rendered)
process.exitCode = errors.length === 0 ? 0 : 1

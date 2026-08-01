#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertInventorySnapshot,
  collectUiInventory,
  readUiAuditOverrides,
} from './lib/akademate-next-ui-inventory.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const snapshotPath = path.join(repoRoot, 'docs/design/akademate-next-ui-inventory.json')
const overridesPath = path.join(repoRoot, 'docs/design/akademate-next-ui-audit-overrides.json')
const mode = process.argv.includes('--write') ? 'write' : 'check'
const inventory = collectUiInventory(repoRoot, readUiAuditOverrides(overridesPath))

if (mode === 'write') {
  writeFileSync(snapshotPath, `${JSON.stringify(inventory, null, 2)}\n`)
  process.stdout.write(
    `Wrote Akademate Next UI inventory: ${inventory.totalPages} pages, ${inventory.totalLayouts} layouts\n`
  )
  process.exit(0)
}

if (!existsSync(snapshotPath)) {
  throw new Error(
    'UI inventory snapshot is missing. Review the inventory and run pnpm audit:ui:write'
  )
}

assertInventorySnapshot(inventory, JSON.parse(readFileSync(snapshotPath, 'utf8')))
process.stdout.write(
  `Akademate Next UI inventory verified: ${inventory.totalPages} pages, ${inventory.totalLayouts} layouts\n`
)

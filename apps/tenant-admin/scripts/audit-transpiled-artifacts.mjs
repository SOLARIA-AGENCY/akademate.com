#!/usr/bin/env node

import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo', '.git'])

const offenders = []

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue
      }
      walk(fullPath)
      continue
    }
    if (!entry.isFile()) {
      continue
    }

    const relPath = relative(ROOT, fullPath)

    if (entry.name.endsWith('.js.map') || entry.name.endsWith('.d.ts.map')) {
      offenders.push({ type: 'sourcemap', path: relPath })
      continue
    }

    if (entry.name.endsWith('.js')) {
      const basePath = fullPath.slice(0, -3)
      if (existsSync(`${basePath}.ts`) || existsSync(`${basePath}.tsx`)) {
        offenders.push({ type: 'js-duplicate', path: relPath })
      }
      continue
    }

    if (entry.name.endsWith('.d.ts')) {
      const basePath = fullPath.slice(0, -5)
      if (existsSync(`${basePath}.ts`) || existsSync(`${basePath}.tsx`)) {
        offenders.push({ type: 'dts-duplicate', path: relPath })
      }
    }
  }
}

if (!statSync(ROOT).isDirectory()) {
  console.error('Invalid working directory.')
  process.exit(2)
}

walk(ROOT)

if (offenders.length === 0) {
  console.log('OK: no transpiled artifacts or duplicate TS outputs found.')
  process.exit(0)
}

const byType = offenders.reduce((acc, item) => {
  acc[item.type] = (acc[item.type] || 0) + 1
  return acc
}, {})

console.error('FAILED: stale transpiled artifacts detected.')
console.error(`Total offenders: ${offenders.length}`)
for (const [type, count] of Object.entries(byType)) {
  console.error(`- ${type}: ${count}`)
}
console.error('Sample offenders:')
for (const item of offenders.slice(0, 80)) {
  console.error(`  - ${item.path}`)
}
process.exit(1)

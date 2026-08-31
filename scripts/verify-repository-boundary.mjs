#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function fail(message) {
  throw new Error(`SaaS repository boundary verification failed: ${message}`)
}

function gitNullSeparated(...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
}

const requiredPaths = [
  'apps/tenant-admin/package.json',
  'apps/tenant-admin/src/domain/organization-account.ts',
  'apps/tenant-admin/src/domain/campus-operating-model.ts',
  'apps/tenant-admin/src/collections/Locations/Locations.ts',
  'apps/tenant-admin/src/collections/LegalEntities/LegalEntities.ts',
  'pnpm-lock.yaml',
]

const tracked = gitNullSeparated('ls-files', '-z')
for (const requiredPath of requiredPaths) {
  if (!tracked.includes(requiredPath)) fail(`missing required path ${requiredPath}`)
}

const cepNeedles = ['B70729272', 'El Trompo', 'APROEM']
const templateFiles = tracked.filter((filePath) =>
  filePath.startsWith('apps/tenant-admin/src/collections/') ||
  filePath.startsWith('apps/tenant-admin/src/domain/') ||
  filePath === 'apps/tenant-admin/app/(app)/(dashboard)/sedes/nueva/page.tsx',
)

for (const filePath of templateFiles) {
  const contents = readFileSync(path.join(root, filePath), 'utf8')
  for (const needle of cepNeedles) {
    if (contents.includes(needle)) {
      fail(`CEP seed data leaked into SaaS template ${filePath}: ${needle}`)
    }
  }
}

console.log(`verify:boundary ok (${tracked.length} tracked files)`)

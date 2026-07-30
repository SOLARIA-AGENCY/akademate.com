#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baseline = '0ca1b43ea229fc531dab79388925fc73e8077eab'
const allowedPaths = [
  'apps/tenant-admin/__tests__/programacion-nueva.test.tsx',
  'apps/tenant-admin/app/(app)/(dashboard)/programacion/[id]/page.tsx',
  'apps/tenant-admin/app/(app)/(dashboard)/programacion/nueva/page.tsx',
  'apps/tenant-admin/app/lib/planning/__tests__/instructor-availability.test.ts',
  'apps/tenant-admin/app/lib/planning/instructor-availability.ts',
  'apps/tenant-admin/app/lib/server/__tests__/course-run-planning.test.ts',
  'apps/tenant-admin/app/lib/server/course-run-planning.ts',
  'infrastructure/docker/Dockerfile.tenant-admin',
  'infrastructure/scripts/backup.sh',
  'scripts/verify-cep-candidate-1a.mjs',
].sort()

function git(...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

function fail(message) {
  throw new Error(`CEP Candidate 1A scope verification failed: ${message}`)
}

if (git('merge-base', baseline, 'HEAD') !== baseline) fail('branch is not based on the live CEP revision')

const changedPaths = [...new Set([
  ...git('diff', '--name-only', baseline, '--').split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean))].sort()
if (JSON.stringify(changedPaths) !== JSON.stringify(allowedPaths)) {
  fail(`changed paths differ from allowlist\nexpected=${allowedPaths.join(',')}\nactual=${changedPaths.join(',')}`)
}

const newPage = readFileSync(path.join(root, allowedPaths[2]), 'utf8')
const detailPage = readFileSync(path.join(root, allowedPaths[1]), 'utf8')
const planning = readFileSync(path.join(root, allowedPaths[6]), 'utf8')

if (newPage.includes("params.set('qualifiedArea'")) fail('new-run screen still hides teachers through qualifiedArea filtering')
if (detailPage.includes("params.set('qualifiedArea'")) fail('detail screen still hides teachers through qualifiedArea filtering')
if (!newPage.includes('timeConflicts: availability?.unavailableInstructors ?? []')) fail('new-run screen is not bound to detailed conflict evidence')
if (!detailPage.includes('timeConflicts: instructorTimeConflicts')) fail('detail screen is not bound to detailed conflict evidence')
if (!planning.includes('unavailableInstructors')) fail('server availability does not expose detailed instructor conflicts')

const forbiddenPrefixes = [
  'apps/tenant-admin/app/api/staff/',
  'apps/tenant-admin/app/(public)/',
  'apps/tenant-admin/migrations/',
  'apps/tenant-admin/src/payload.config.ts',
]
if (changedPaths.some((filePath) => forbiddenPrefixes.some((prefix) => filePath.startsWith(prefix)))) {
  fail('candidate changes a forbidden API, public, schema or infrastructure path')
}

process.stdout.write(`CEP Candidate 1A scope verified: ${changedPaths.length} allowlisted files from ${baseline}\n`)

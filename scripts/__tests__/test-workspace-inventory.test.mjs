import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  collectWorkspaceManifests,
  createTestMatrix,
  validateWorkspaceInventory,
} from '../verify-test-workspace-inventory.mjs'

async function writeFileAt(rootDir, relativePath, contents = '') {
  const path = join(rootDir, relativePath)
  await mkdir(join(path, '..'), { recursive: true })
  await writeFile(path, contents)
}

async function writeManifest(rootDir, relativeDir, manifest) {
  await writeFileAt(rootDir, join(relativeDir, 'package.json'), JSON.stringify(manifest))
}

test('derives a deterministic matrix from every workspace manifest with a test script', async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), 'akademate-test-inventory-'))
  t.after(() => rm(rootDir, { recursive: true, force: true }))

  await writeManifest(rootDir, 'apps/web', {
    name: '@akademate/web',
    scripts: { test: 'vitest run' },
  })
  await writeFileAt(rootDir, 'apps/web/tests/platform.test.ts')
  await writeManifest(rootDir, 'packages/api', {
    name: '@akademate/api',
    scripts: { test: 'vitest run' },
  })
  await writeFileAt(rootDir, 'packages/api/__tests__/api.test.ts')
  await writeManifest(rootDir, 'packages/types', { name: '@akademate/types' })

  const workspaces = validateWorkspaceInventory(collectWorkspaceManifests(rootDir), [])

  assert.deepEqual(createTestMatrix(workspaces), {
    workspace: ['@akademate/api', '@akademate/web'],
  })
})

test('rejects a test-bearing workspace without a test script', async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), 'akademate-test-inventory-'))
  t.after(() => rm(rootDir, { recursive: true, force: true }))

  await writeManifest(rootDir, 'packages/jobs', { name: '@akademate/jobs' })
  await writeFileAt(rootDir, 'packages/jobs/__tests__/jobs.test.ts')

  assert.throws(
    () => validateWorkspaceInventory(collectWorkspaceManifests(rootDir), []),
    /has unit tests but no test script/
  )
})

test('rejects unclassified specs and wildcard allowlist paths', async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), 'akademate-test-inventory-'))
  t.after(() => rm(rootDir, { recursive: true, force: true }))

  await writeManifest(rootDir, 'apps/web', {
    name: '@akademate/web',
    scripts: { test: 'vitest run' },
  })
  await writeFileAt(rootDir, 'apps/web/e2e/home.spec.ts')
  const workspaces = collectWorkspaceManifests(rootDir)

  assert.throws(() => validateWorkspaceInventory(workspaces, []), /unclassified spec files/)
  assert.throws(
    () =>
      validateWorkspaceInventory(workspaces, [
        {
          workspace: '@akademate/web',
          path: 'e2e/*.spec.ts',
          classification: 'e2e',
          reason: 'Browser flow',
          issue: 'REM-012',
          owner: 'web',
        },
      ]),
    /Allowlist paths must be exact/
  )
})

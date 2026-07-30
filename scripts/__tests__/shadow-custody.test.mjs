import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { lstatSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createManifest, parseStatus, writeCustody } from '../create-shadow-custody.mjs'

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'akademate-custody-'))
  git(root, 'init', '-q')
  git(root, 'config', 'user.email', 'custody@example.invalid')
  git(root, 'config', 'user.name', 'Custody Test')
  mkdirSync(path.join(root, 'src'))
  writeFileSync(path.join(root, 'src', 'tracked.ts'), 'export const value = 1\n')
  writeFileSync(path.join(root, 'deleted.md'), 'baseline\n')
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'baseline')
  return root
}

test('produces deterministic sorted evidence for source changes', () => {
  const root = fixture()
  try {
    writeFileSync(path.join(root, 'src', 'tracked.ts'), 'export const value = 2\n')
    writeFileSync(path.join(root, 'src', 'z-last.ts'), 'export const z = true\n')
    writeFileSync(path.join(root, 'src', 'a-first.ts'), 'export const a = true\n')

    const first = createManifest('fixture', root)
    const second = createManifest('fixture', root)

    assert.equal(first.stateSha256, second.stateSha256)
    assert.deepEqual(first.entries.map((entry) => entry.path), [
      'src/a-first.ts',
      'src/tracked.ts',
      'src/z-last.ts',
    ])
    assert.ok(first.entries.every((entry) => entry.worktreeSha256?.length === 64))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('redacts sensitive paths and omits their content digest', () => {
  const root = fixture()
  try {
    writeFileSync(path.join(root, '.env.production'), 'TOKEN=do-not-record\n')
    mkdirSync(path.join(root, 'infrastructure'))
    writeFileSync(path.join(root, 'infrastructure', 'release.env.example'), 'TOKEN=placeholder\n')
    git(root, 'add', '.env.production', 'infrastructure/release.env.example')
    const manifest = createManifest('fixture', root)
    const entries = manifest.entries.filter((item) => item.redacted)

    assert.equal(manifest.redactedEntryCount, 2)
    assert.ok(entries.every((entry) => entry.path === undefined))
    assert.ok(entries.every((entry) => entry.worktreeSha256 === null))
    assert.ok(entries.every((entry) => entry.pathSha256.length === 64))
    assert.ok(entries.every((entry) => entry.headBlob === null))
    assert.ok(entries.every((entry) => entry.indexBlob === null))
    assert.equal(JSON.stringify(manifest).includes('do-not-record'), false)
    assert.equal(JSON.stringify(manifest).includes('.env.production'), false)
    assert.equal(JSON.stringify(manifest).includes('release.env.example'), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('records deletion with the committed blob and no worktree hash', () => {
  const root = fixture()
  try {
    rmSync(path.join(root, 'deleted.md'))
    const manifest = createManifest('fixture', root)
    const entry = manifest.entries.find((item) => item.path === 'deleted.md')

    assert.equal(entry.status, ' D')
    assert.equal(entry.exists, false)
    assert.equal(entry.worktreeSha256, null)
    assert.equal(entry.headBlob.length, 40)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('rejects labels that could escape the output namespace', () => {
  const root = fixture()
  try {
    assert.throws(() => createManifest('../escape', root), /Invalid source label/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('redacts both sides of a rename from a sensitive path', () => {
  const root = fixture()
  try {
    writeFileSync(path.join(root, '.env.previous'), 'TOKEN=tracked-secret\n')
    git(root, 'add', '.env.previous')
    git(root, 'commit', '-qm', 'add sensitive fixture')
    git(root, 'mv', '.env.previous', 'src/public.ts')

    const manifest = createManifest('fixture', root)
    const entry = manifest.entries.find((item) => item.redacted)
    const serialized = JSON.stringify(manifest)

    assert.equal(manifest.redactedEntryCount, 1)
    assert.equal(entry.path, undefined)
    assert.equal(entry.originalPath, undefined)
    assert.equal(serialized.includes('.env.previous'), false)
    assert.equal(serialized.includes('src/public.ts'), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('atomically replaces a target symlink without writing through it', () => {
  const root = fixture()
  const output = mkdtempSync(path.join(tmpdir(), 'akademate-custody-output-'))
  const outside = path.join(output, 'outside.txt')
  const target = path.join(output, 'fixture.json')
  try {
    writeFileSync(path.join(root, 'src', 'tracked.ts'), 'export const value = 3\n')
    writeFileSync(outside, 'must remain unchanged\n')
    symlinkSync(outside, target)

    writeCustody(output, [{ label: 'fixture', root }])

    assert.equal(readFileSync(outside, 'utf8'), 'must remain unchanged\n')
    assert.equal(lstatSync(target).isSymbolicLink(), false)
    assert.equal(JSON.parse(readFileSync(target, 'utf8')).label, 'fixture')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(output, { recursive: true, force: true })
  }
})

test('redacts common credential and vault path conventions', () => {
  const root = fixture()
  try {
    const sensitivePaths = ['.npmrc', '.netrc', 'id_rsa', 'api-keys.json', 'tokens/access.json', 'vault/config.json']
    for (const filePath of sensitivePaths) {
      mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true })
      writeFileSync(path.join(root, filePath), 'short-secret\n')
    }

    const manifest = createManifest('fixture', root)
    const serialized = JSON.stringify(manifest)

    assert.equal(manifest.redactedEntryCount, sensitivePaths.length)
    for (const filePath of sensitivePaths) assert.equal(serialized.includes(filePath), false)
    assert.ok(manifest.entries.every((entry) => entry.worktreeSha256 === null))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('binds state hash to HEAD while retaining a separate dirty-entry hash', () => {
  const root = fixture()
  try {
    writeFileSync(path.join(root, 'src', 'untracked.ts'), 'export const shadow = true\n')
    const before = createManifest('fixture', root)
    writeFileSync(path.join(root, 'src', 'tracked.ts'), 'export const value = 9\n')
    git(root, 'add', 'src/tracked.ts')
    git(root, 'commit', '-qm', 'advance clean base')
    const after = createManifest('fixture', root)

    assert.equal(before.dirtyEntriesSha256, after.dirtyEntriesSha256)
    assert.notEqual(before.stateSha256, after.stateSha256)
    assert.notEqual(before.head, after.head)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('fails closed for Git paths that are not valid UTF-8', () => {
  const invalidStatus = Buffer.concat([Buffer.from('?? src/'), Buffer.from([0xff]), Buffer.from('.ts\0')])
  assert.throws(() => parseStatus(invalidStatus), /non-UTF-8 path/)
})

test('rejects a symlink used as the output directory', () => {
  const root = fixture()
  const realOutput = mkdtempSync(path.join(tmpdir(), 'akademate-custody-real-output-'))
  const linkedOutput = `${realOutput}-link`
  try {
    symlinkSync(realOutput, linkedOutput)
    assert.throws(() => writeCustody(linkedOutput, [{ label: 'fixture', root }]), /must not be a symlink/)
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(linkedOutput, { force: true })
    rmSync(realOutput, { recursive: true, force: true })
  }
})

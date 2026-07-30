#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readlinkSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TextDecoder } from 'node:util'

const SENSITIVE_SEGMENT = /(^|\/)(?:[^/]*\.env(?:\.[^/]*)?|\.npmrc|\.netrc|id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?|api[-_.]?keys?(?:\.[^/]*)?|tokens?|vault|secrets?|credentials?|private[-_.]?keys?|uploads?|outputs?|deliverables?|entregables?|forms?)(?:\/|$)/i
const SENSITIVE_EXTENSION = /\.(?:csv|docx?|xlsx?|pdf|pem|p12|pfx|key|zip|tar|gz)$/i
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true })

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function git(root, args, options = {}) {
  const executionOptions = {
    stdio: ['ignore', 'pipe', 'ignore'],
  }
  if (!options.buffer) executionOptions.encoding = 'utf8'
  return execFileSync('git', ['-C', root, ...args], executionOptions)
}

function optionalGit(root, args) {
  try {
    return git(root, args).trim() || null
  } catch {
    return null
  }
}

function classify(filePath) {
  if (/(^|\/)(?:__tests__|tests?|e2e)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(filePath)) return 'test'
  if (/(^|\/)(?:migrations?)(?:\/|$)|\.sql$/.test(filePath)) return 'migration'
  if (/^(?:infrastructure|infra|\.github|docker)|(?:Dockerfile|docker-compose|compose\.ya?ml)/i.test(filePath)) return 'infrastructure'
  if (/(^|\/)docs?(?:\/|$)|\.md$/.test(filePath)) return 'documentation'
  if (/\.(?:ts|tsx|js|jsx|mjs|cjs|py|rs|go|css|scss)$/.test(filePath)) return 'source'
  if (/\.(?:json|ya?ml|toml|ini)$|(?:^|\/)(?:package\.json|pnpm-lock\.yaml|tsconfig[^/]*\.json)$/.test(filePath)) return 'configuration'
  if (SENSITIVE_EXTENSION.test(filePath)) return 'binary-or-data'
  return 'other'
}

export function parseStatus(buffer) {
  let decoded
  try {
    decoded = UTF8_DECODER.decode(buffer)
  } catch {
    throw new Error('Git status contains a non-UTF-8 path; custody capture failed closed')
  }
  const tokens = decoded.split('\0')
  const entries = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token) continue
    const status = token.slice(0, 2)
    const filePath = token.slice(3)
    const entry = { status, path: filePath }

    if (/[RC]/.test(status)) {
      entry.originalPath = tokens[index + 1]
      index += 1
    }
    entries.push(entry)
  }

  return entries.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
}

function stableStat(before, after) {
  return before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mtimeMs === after.mtimeMs
}

function fileEvidence(root, filePath) {
  const absolutePath = path.join(root, filePath)
  if (constants.O_NOFOLLOW === undefined) throw new Error('O_NOFOLLOW is required for custody capture')
  let descriptor
  try {
    descriptor = openSync(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile()) return { exists: true, kind: 'non-file', size: before.size, worktreeSha256: null }
    const content = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (!stableStat(before, after)) throw new Error(`File changed during custody capture: ${filePath}`)
    return { exists: true, kind: 'file', size: after.size, worktreeSha256: sha256(content) }
  } catch (error) {
    if (error?.code === 'ENOENT') return { exists: false, kind: 'missing', size: 0, worktreeSha256: null }
    if (error?.code === 'ELOOP' || error?.code === 'EMLINK') {
      const before = lstatSync(absolutePath)
      const target = readlinkSync(absolutePath)
      const after = lstatSync(absolutePath)
      if (!before.isSymbolicLink() || !stableStat(before, after)) throw new Error(`Symlink changed during custody capture: ${filePath}`)
      return { exists: true, kind: 'symlink', size: Buffer.byteLength(target), worktreeSha256: sha256(target) }
    }
    throw error
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

function redactEntry(entry) {
  const paths = [entry.path, entry.originalPath].filter(Boolean)
  const redacted = paths.some((candidate) => SENSITIVE_SEGMENT.test(candidate) || SENSITIVE_EXTENSION.test(candidate))
  if (!redacted) return entry

  return {
    status: entry.status,
    category: entry.category,
    redacted: true,
    pathSha256: sha256(entry.path),
    originalPathSha256: entry.originalPath ? sha256(entry.originalPath) : null,
    exists: entry.exists,
    kind: entry.kind,
    size: entry.size,
    headBlob: null,
    indexBlob: null,
    worktreeSha256: null,
  }
}

export function createManifest(label, root) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(label)) throw new Error(`Invalid source label: ${label}`)
  const topLevel = git(root, ['rev-parse', '--show-toplevel']).trim()
  if (realpathSync(topLevel) !== realpathSync(root)) throw new Error(`Source must be a Git worktree root: ${root}`)

  const head = git(root, ['rev-parse', 'HEAD']).trim()
  const initialStatus = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { buffer: true })
  const statusEntries = parseStatus(initialStatus)
  const entries = statusEntries.map((statusEntry) => {
    const evidence = fileEvidence(root, statusEntry.path)
    const enriched = {
      ...statusEntry,
      category: classify(statusEntry.path),
      ...evidence,
      headBlob: optionalGit(root, ['rev-parse', '--verify', `HEAD:${statusEntry.path}`]),
      indexBlob: optionalGit(root, ['rev-parse', '--verify', `:${statusEntry.path}`]),
    }
    return redactEntry(enriched)
  })

  const branch = optionalGit(root, ['branch', '--show-current'])
  const upstream = optionalGit(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
  const categoryCounts = Object.fromEntries(
    [...new Set(entries.map((entry) => entry.category))]
      .sort()
      .map((category) => [category, entries.filter((entry) => entry.category === category).length]),
  )
  const dirtyEntriesSha256 = sha256(JSON.stringify(entries))
  const stateSha256 = sha256(JSON.stringify({ schemaVersion: 1, label, repository: path.basename(root), head, branch, upstream, entries }))
  const finalStatus = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { buffer: true })
  const finalHead = git(root, ['rev-parse', 'HEAD']).trim()
  if (head !== finalHead || !initialStatus.equals(finalStatus)) {
    throw new Error(`Git state changed during custody capture: ${label}`)
  }

  return {
    schemaVersion: 1,
    label,
    repository: path.basename(root),
    head,
    branch,
    upstream,
    entryCount: entries.length,
    redactedEntryCount: entries.filter((entry) => entry.redacted).length,
    categoryCounts,
    dirtyEntriesSha256,
    stateSha256,
    entries,
  }
}

function atomicWrite(target, content) {
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`)
  let descriptor
  try {
    descriptor = openSync(temporary, 'wx', 0o600)
    writeFileSync(descriptor, content)
    closeSync(descriptor)
    descriptor = undefined
    renameSync(temporary, target)
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor)
    try {
      unlinkSync(temporary)
    } catch (cleanupError) {
      if (cleanupError?.code !== 'ENOENT') error.cleanupError = cleanupError
    }
    throw error
  }
}

export function writeCustody(outputDirectory, sources) {
  mkdirSync(outputDirectory, { recursive: true })
  if (lstatSync(outputDirectory).isSymbolicLink()) throw new Error(`Output directory must not be a symlink: ${outputDirectory}`)
  if (new Set(sources.map((source) => source.label)).size !== sources.length) throw new Error('Source labels must be unique')
  const manifests = sources.map(({ label, root }) => createManifest(label, root))

  for (const manifest of manifests) {
    atomicWrite(path.join(outputDirectory, `${manifest.label}.json`), `${JSON.stringify(manifest, null, 2)}\n`)
  }

  const rows = manifests.map((manifest) =>
    `| \`${manifest.label}\` | \`${manifest.head}\` | \`${manifest.branch ?? 'detached'}\` | ${manifest.entryCount} | ${manifest.redactedEntryCount} | \`${manifest.stateSha256}\` |`,
  )
  const index = [
    '# Shadow Custody Index',
    '',
    'Read-only inventory captured from stable Git state. Hashes identify local state; they are not signatures and do not prove runtime execution or deployment.',
    'Sensitive paths are represented only by a path digest and size. Their content hash is intentionally omitted.',
    '',
    '| Source | HEAD | Branch | Entries | Redacted | State SHA-256 |',
    '| --- | --- | --- | ---: | ---: | --- |',
    ...rows,
    '',
  ].join('\n')
  atomicWrite(path.join(outputDirectory, 'INDEX.md'), index)
  return manifests
}

function parseArguments(argv) {
  const sources = []
  let outputDirectory = null
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--output') outputDirectory = argv[++index]
    else if (argv[index] === '--source') {
      const value = argv[++index]
      const separator = value?.indexOf('=') ?? -1
      if (separator < 1) throw new Error('--source must use label=/absolute/worktree')
      sources.push({ label: value.slice(0, separator), root: value.slice(separator + 1) })
    } else throw new Error(`Unknown argument: ${argv[index]}`)
  }
  if (!outputDirectory || sources.length === 0) {
    throw new Error('Usage: create-shadow-custody.mjs --output DIR --source label=/absolute/worktree [...]')
  }
  return { outputDirectory, sources }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { outputDirectory, sources } = parseArguments(process.argv.slice(2))
  const manifests = writeCustody(outputDirectory, sources)
  process.stdout.write(`shadow custody captured: ${manifests.length} sources, ${manifests.reduce((sum, item) => sum + item.entryCount, 0)} entries\n`)
}

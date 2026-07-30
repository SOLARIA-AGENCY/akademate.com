#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evidenceRoot = path.join(root, 'docs/program/evidence/shadow-custody')
const labels = ['product-shadow', 'cep-local', 'release-a', 'clean-release-commits']

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function fail(message) {
  throw new Error(`shadow custody verification failed: ${message}`)
}

const index = readFileSync(path.join(evidenceRoot, 'INDEX.md'), 'utf8')
let totalEntries = 0

for (const label of labels) {
  const serialized = readFileSync(path.join(evidenceRoot, `${label}.json`), 'utf8')
  const manifest = JSON.parse(serialized)
  const stringValues = JSON.stringify(manifest).match(/"(?:\\.|[^"\\])*"/g)?.map((value) => JSON.parse(value)) ?? []
  if (stringValues.some((value) => value.startsWith('/Users/') || value.includes('TOKEN=') || value.includes('PASSWORD='))) {
    fail(`${label} contains an absolute local path or secret-like value`)
  }
  if (manifest.schemaVersion !== 1 || manifest.label !== label) fail(`${label} schema or label mismatch`)
  if (!Array.isArray(manifest.entries) || manifest.entryCount !== manifest.entries.length) fail(`${label} entry count mismatch`)
  if (manifest.redactedEntryCount !== manifest.entries.filter((entry) => entry.redacted).length) fail(`${label} redacted count mismatch`)

  for (const entry of manifest.entries.filter((item) => item.redacted)) {
    if (entry.path || entry.originalPath || entry.worktreeSha256 || entry.headBlob || entry.indexBlob) {
      fail(`${label} exposes evidence fields for a redacted entry`)
    }
    if (!/^[a-f0-9]{64}$/.test(entry.pathSha256 ?? '')) fail(`${label} has an invalid redacted path digest`)
  }

  const dirtyEntriesSha256 = sha256(JSON.stringify(manifest.entries))
  if (dirtyEntriesSha256 !== manifest.dirtyEntriesSha256) fail(`${label} dirty-entry digest mismatch`)
  const stateSha256 = sha256(JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    label: manifest.label,
    repository: manifest.repository,
    head: manifest.head,
    branch: manifest.branch,
    upstream: manifest.upstream,
    entries: manifest.entries,
  }))
  if (stateSha256 !== manifest.stateSha256) fail(`${label} state digest mismatch`)
  if (!index.includes(manifest.stateSha256)) fail(`${label} state digest missing from index`)
  totalEntries += manifest.entryCount
}

if (totalEntries !== 598) fail(`expected captured baseline of 598 entries, found ${totalEntries}`)
process.stdout.write(`shadow custody manifests verified: ${labels.length} sources, ${totalEntries} entries\n`)

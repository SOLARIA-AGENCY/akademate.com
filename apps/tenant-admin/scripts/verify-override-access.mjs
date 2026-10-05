import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(appRoot, '../..')
const manifestPath = path.join(appRoot, 'scripts/override-access-debt.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const tokenPattern = new RegExp('overrideAccess' + '\\s*:\\s*true', 'g')

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '__tests__') continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(fullPath))
    else if (/\.[cm]?tsx?$/.test(entry.name) && !/\.test\.[cm]?tsx?$/.test(entry.name)) files.push(fullPath)
  }
  return files
}

const expected = new Map()
for (const [file, count] of Object.entries(manifest.runtimePrimitives)) expected.set(file, count)
for (const [file, audit] of Object.entries(manifest.offlineAllowlist)) {
  if (!audit.owner || !audit.reason || !audit.issue) throw new Error(`Incomplete offline audit metadata: ${file}`)
  expected.set(file, audit.count)
}
for (const [file, debt] of Object.entries(manifest.debt)) {
  if (!debt.owner || !debt.reason || !debt.issue) throw new Error(`Incomplete debt metadata: ${file}`)
  expected.set(file, debt.count)
}

const actual = new Map()
for (const file of await sourceFiles(appRoot)) {
  const source = await readFile(file, 'utf8')
  const count = [...source.matchAll(tokenPattern)].length
  if (count > 0) actual.set(path.relative(repoRoot, file), count)
}

const errors = []
for (const [file, count] of actual) {
  if (!expected.has(file)) errors.push(`unmanifested direct bypass: ${file} (${count})`)
  else if (expected.get(file) !== count) errors.push(`count changed: ${file} expected ${expected.get(file)}, found ${count}`)
}
for (const [file, count] of expected) {
  if (!actual.has(file)) errors.push(`stale manifest entry: ${file} expected ${count}, found 0`)
}

if (errors.length > 0) {
  console.error(['overrideAccess source gate failed:', ...errors.map((error) => `- ${error}`)].join('\n'))
  process.exit(1)
}
console.log(`overrideAccess source gate passed: ${actual.size} exact files inventoried`)

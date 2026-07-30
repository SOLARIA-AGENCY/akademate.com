import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const programDir = resolve(root, 'docs/program')
const required = [
  'README.md',
  'AKADEMATE_MASTER_EXECUTION_PLAN.md',
  'CEP_SHADOW_RELEASE_CHECKLIST.md',
  'AKADEMATE_NEXT_BUILD_CHECKLIST.md',
  'DESIGN_SYSTEM_SCREEN_AUDIT.md',
  'SCREEN_INVENTORY.md',
  'DECISION_LOG.md',
  'STATUS.md',
]

const failures = []

for (const file of required) {
  const path = resolve(programDir, file)
  if (!existsSync(path)) {
    failures.push(`missing required program document: ${file}`)
    continue
  }
  const body = readFileSync(path, 'utf8')
  if (!body.includes('Last updated:')) failures.push(`${file}: missing Last updated marker`)
  if (!body.includes('- [') && !['DECISION_LOG.md'].includes(file)) {
    failures.push(`${file}: missing checklist markers`)
  }
}

const readme = existsSync(resolve(programDir, 'README.md'))
  ? readFileSync(resolve(programDir, 'README.md'), 'utf8')
  : ''
for (const target of required.filter((file) => file !== 'README.md')) {
  if (!readme.includes(`./${target}`)) failures.push(`README.md: missing link to ${target}`)
}

const pageFiles = execFileSync('git', ['ls-files'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter((file) => /^apps\/[^/]+\/app\/.*\/page\.tsx$/.test(file))
  .sort()

const inventoryPath = resolve(programDir, 'SCREEN_INVENTORY.md')
if (existsSync(inventoryPath)) {
  const inventory = readFileSync(inventoryPath, 'utf8')
  for (const page of pageFiles) {
    if (!inventory.includes(`\`${page}\``)) failures.push(`SCREEN_INVENTORY.md: missing ${page}`)
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exit(1)
}

console.log(`program docs verified; ${pageFiles.length} tracked screens inventoried`)

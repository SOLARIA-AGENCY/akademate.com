import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoots = ['apps', 'packages', 'infra']
const ignoredDirectories = new Set(['node_modules', '.next', 'dist', 'coverage'])
const testFilePattern = /\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/
const allowlistPath = join(repositoryRoot, 'scripts/test-file-allowlist.json')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readPackageManifest(packageDir) {
  const manifestPath = join(packageDir, 'package.json')
  return existsSync(manifestPath) ? readJson(manifestPath) : null
}

function scanTestFiles(packageDir, currentDir = packageDir) {
  const files = []

  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const path = join(currentDir, entry.name)

    if (entry.isDirectory()) {
      if (existsSync(join(path, 'package.json'))) continue
      files.push(...scanTestFiles(packageDir, path))
    } else if (testFilePattern.test(entry.name)) {
      files.push(relative(packageDir, path))
    }
  }

  return files.sort()
}

export function collectWorkspaceManifests(rootDir = repositoryRoot) {
  const workspaces = []

  for (const workspaceRoot of workspaceRoots) {
    const directory = join(rootDir, workspaceRoot)
    if (!existsSync(directory)) continue

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const packageDir = join(directory, entry.name)
      const manifest = readPackageManifest(packageDir)
      if (!manifest?.name) continue

      workspaces.push({
        name: manifest.name,
        packageDir,
        testScript: manifest.scripts?.test,
        testFiles: scanTestFiles(packageDir),
      })
    }
  }

  return workspaces.sort((left, right) => left.name.localeCompare(right.name))
}

export function validateWorkspaceInventory(workspaces, allowlistEntries) {
  const workspaceByName = new Map(workspaces.map((workspace) => [workspace.name, workspace]))
  const classified = new Set()

  for (const entry of allowlistEntries) {
    for (const field of ['workspace', 'path', 'classification', 'reason', 'issue', 'owner']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) {
        throw new Error(`Allowlist entry requires ${field}`)
      }
    }
    if (/[*?{}[\]]/.test(entry.path)) {
      throw new Error(`Allowlist paths must be exact: ${entry.path}`)
    }

    const workspace = workspaceByName.get(entry.workspace)
    if (!workspace) throw new Error(`Allowlist references unknown workspace ${entry.workspace}`)
    if (!workspace.testFiles.includes(entry.path)) {
      throw new Error(`Allowlist path does not exist: ${entry.workspace}/${entry.path}`)
    }

    const key = `${entry.workspace}:${entry.path}`
    if (classified.has(key)) throw new Error(`Duplicate allowlist entry: ${key}`)
    classified.add(key)
  }

  for (const workspace of workspaces) {
    const unitFiles = workspace.testFiles.filter(
      (path) => path.includes('.test.') && !classified.has(`${workspace.name}:${path}`)
    )
    const unclassifiedSpecs = workspace.testFiles.filter(
      (path) => path.includes('.spec.') && !classified.has(`${workspace.name}:${path}`)
    )

    if (unclassifiedSpecs.length > 0) {
      throw new Error(`${workspace.name} has unclassified spec files: ${unclassifiedSpecs.join(', ')}`)
    }
    if (unitFiles.length > 0 && (!workspace.testScript || !String(workspace.testScript).trim())) {
      throw new Error(`${workspace.name} has unit tests but no test script: ${unitFiles.join(', ')}`)
    }
    if (workspace.testScript !== undefined && typeof workspace.testScript !== 'string') {
      throw new Error(`${workspace.name} declares an invalid test script`)
    }
  }

  return workspaces.filter(
    (workspace) => typeof workspace.testScript === 'string' && workspace.testScript.trim()
  )
}

export function collectTestWorkspaces(rootDir = repositoryRoot) {
  const workspaces = collectWorkspaceManifests(rootDir)
  const allowlist = readJson(join(rootDir, 'scripts/test-file-allowlist.json')).entries
  return validateWorkspaceInventory(workspaces, allowlist)
}

export function createTestMatrix(workspaces) {
  return { workspace: workspaces.map((workspace) => workspace.name) }
}

function runWorkspaceTests(workspaces, rootDir) {
  const pnpmExecutable = process.env.npm_execpath
  const command = pnpmExecutable ? process.execPath : 'pnpm'
  const commandPrefix = pnpmExecutable ? [pnpmExecutable] : []

  for (const workspace of workspaces) {
    const result = spawnSync(command, [...commandPrefix, '--filter', workspace.name, 'run', 'test'], {
      cwd: rootDir,
      stdio: 'inherit',
    })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
}

function main() {
  const workspaces = collectTestWorkspaces()
  const matrix = createTestMatrix(workspaces)
  const matrixJson = JSON.stringify(matrix)
  const githubOutputIndex = process.argv.indexOf('--github-output')

  if (githubOutputIndex >= 0) {
    const outputPath = process.argv[githubOutputIndex + 1]
    if (!outputPath) throw new Error('--github-output requires a file path')
    appendFileSync(outputPath, `matrix=${matrixJson}\n`)
  } else {
    console.log(`Test workspace inventory: ${matrix.workspace.join(', ')}`)
  }

  if (process.argv.includes('--run')) runWorkspaceTests(workspaces, repositoryRoot)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()

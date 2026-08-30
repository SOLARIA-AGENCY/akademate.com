import { readdir, readFile, stat } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createMultiEntityRbacPolicyArtifact,
  isMultiEntityRbacPolicyAuthoritySource,
  type MultiEntityRbacPolicySource,
} from '../packages/tenant/src/multi-entity-rbac-policy-artifact.ts'

const SEARCH_ROOTS = [
  'apps/tenant-admin/app',
  'apps/tenant-admin/src',
  'apps/tenant-admin/lib',
] as const
const ROOT_AUTHORITIES = [
  'apps/tenant-admin/middleware.ts',
  'apps/tenant-admin/instrumentation.ts',
] as const

export async function discoverCepRbacPolicySources(
  workspaceRoot: string
): Promise<readonly MultiEntityRbacPolicySource[]> {
  const candidates: string[] = []
  for (const searchRoot of SEARCH_ROOTS) {
    const absoluteRoot = resolve(workspaceRoot, searchRoot)
    if (!(await exists(absoluteRoot))) continue
    await walkTypescriptFiles(absoluteRoot, candidates)
  }
  for (const rootAuthority of ROOT_AUTHORITIES) {
    const absolutePath = resolve(workspaceRoot, rootAuthority)
    if (await exists(absolutePath)) candidates.push(absolutePath)
  }

  const sources: MultiEntityRbacPolicySource[] = []
  for (const absolutePath of [...new Set(candidates)].sort()) {
    const path = relative(workspaceRoot, absolutePath).split(sep).join('/')
    const content = await readFile(absolutePath, 'utf8')
    if (isMultiEntityRbacPolicyAuthoritySource(path, content)) {
      sources.push(Object.freeze({ path, content }))
    }
  }
  return Object.freeze(sources)
}

async function walkTypescriptFiles(directory: string, result: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const absolutePath = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      await walkTypescriptFiles(absolutePath, result)
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      result.push(absolutePath)
    }
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    const entry = await stat(path)
    return entry.isFile() || entry.isDirectory()
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  const workspaceRoot = process.cwd()
  const sources = await discoverCepRbacPolicySources(workspaceRoot)
  const artifact = createMultiEntityRbacPolicyArtifact(sources)
  const output = process.argv.includes('--summary')
    ? {
        schemaVersion: artifact.schemaVersion,
        kind: artifact.kind,
        inventoryVersion: artifact.inventoryVersion,
        canChangePermissions: artifact.canChangePermissions,
        policyDigest: artifact.policyDigest,
        metrics: artifact.metrics,
      }
    : artifact
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.stderr.write('CEP_RBAC_POLICY_ARTIFACT_GENERATION_FAILED\n')
    process.exitCode = 1
  })
}

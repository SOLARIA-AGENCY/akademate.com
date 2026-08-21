import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CONSTRUCTION_TOOLS,
  ConstructionError,
  isConstructionEnabled,
  readConstructionEnv,
  resolveConstructionPath,
  runConstructionOp,
  type ConstructionEnv,
} from '../construction-mcp'
import { handleMcpJsonRpc } from '../academy-mcp'

const execFileAsync = promisify(execFile)

const originalEnv = {
  mode: process.env.AKADEMATE_CONSTRUCTION_MODE,
  surface: process.env.AKADEMATE_SURFACE,
  root: process.env.CONSTRUCTION_ROOT,
}

afterEach(() => {
  if (originalEnv.mode === undefined) delete process.env.AKADEMATE_CONSTRUCTION_MODE
  else process.env.AKADEMATE_CONSTRUCTION_MODE = originalEnv.mode
  if (originalEnv.surface === undefined) delete process.env.AKADEMATE_SURFACE
  else process.env.AKADEMATE_SURFACE = originalEnv.surface
  if (originalEnv.root === undefined) delete process.env.CONSTRUCTION_ROOT
  else process.env.CONSTRUCTION_ROOT = originalEnv.root
})

async function tempEnv(surface = 'ovh-preview'): Promise<ConstructionEnv> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'akad-construct-'))
  await mkdir(path.join(root, 'apps/tenant-admin/app/(dashboard)/finanzas'), { recursive: true })
  await writeFile(
    path.join(root, 'apps/tenant-admin/app/(dashboard)/finanzas/page.tsx'),
    'export default function Finanzas() { return null }\n',
    'utf8',
  )
  return { mode: true, surface, root }
}

describe('construction gates', () => {
  it('stays off unless AKADEMATE_CONSTRUCTION_MODE=1', () => {
    delete process.env.AKADEMATE_CONSTRUCTION_MODE
    expect(isConstructionEnabled(readConstructionEnv())).toBe(false)
  })

  it('refuses work when the flag is off', async () => {
    await expect(runConstructionOp('status', {}, {}, { mode: false, surface: 'ovh-preview', root: '/tmp' })).rejects.toMatchObject({
      status: 403,
      code: 'CONSTRUCTION_OFF',
    })
  })

  it('blocks writes outside ovh-preview', async () => {
    const env = await tempEnv('cep-production')
    await expect(
      runConstructionOp('write', { path: 'apps/tenant-admin/app/x.tsx', contents: 'x' }, {}, env),
    ).rejects.toBeInstanceOf(ConstructionError)
  })
})

describe('construction sandbox', () => {
  it('rejects traversal and secrets', async () => {
    const env = await tempEnv()
    expect(() => resolveConstructionPath('../.env', env)).toThrow(/allowlist|Invalid/)
    expect(() => resolveConstructionPath('apps/tenant-admin/app/../.env', env)).toThrow()
    expect(() => resolveConstructionPath('infrastructure/ovh/docker-compose.yml', env)).toThrow()
    expect(() => resolveConstructionPath('apps/tenant-admin/.env.local', env)).toThrow()
  })

  it('writes, reads and patches an allowlisted file', async () => {
    const env = await tempEnv()
    const target = 'apps/tenant-admin/app/(dashboard)/finanzas/page.tsx'
    const written = await runConstructionOp(
      'write',
      { path: target, contents: 'export const title = "Finanzas"\n' },
      { keyId: 'test-key' },
      env,
    )
    expect(written).toMatchObject({ path: target, written: true })

    const read = await runConstructionOp('read', { path: target }, {}, env) as { contents: string }
    expect(read.contents).toContain('Finanzas')

    await runConstructionOp(
      'apply_patch',
      { path: target, old_string: 'Finanzas', new_string: 'Informes' },
      { keyId: 'test-key' },
      env,
    )
    const patched = await readFile(path.join(env.root, target), 'utf8')
    expect(patched).toContain('Informes')
    const journal = await readFile(path.join(env.root, '.construction/journal.jsonl'), 'utf8')
    expect(journal).toContain('test-key')
    expect(journal).not.toMatch(/ak_|sk_|password/)
  })

  it('exports a git diff for downstream repos', async () => {
    const env = await tempEnv()
    await execFileAsync('git', ['init'], { cwd: env.root })
    await execFileAsync('git', ['add', '.'], { cwd: env.root })
    await execFileAsync('git', ['-c', 'user.email=ci@local', '-c', 'user.name=ci', 'commit', '-m', 'seed'], { cwd: env.root })
    await runConstructionOp(
      'write',
      {
        path: 'apps/tenant-admin/app/(dashboard)/finanzas/page.tsx',
        contents: 'export const title = " cons"\n',
      },
      {},
      env,
    )
    const exported = await runConstructionOp('export_patch', {}, {}, env) as { diff: string; downstream: string[] }
    expect(exported.diff).toContain('finanzas/page.tsx')
    expect(exported.downstream).toEqual(['cepformacion.akademate.com-platform', 'akademate.com'])
  })
})

describe('construction MCP advertisement', () => {
  it('does not list construct tools when the flag is off', async () => {
    expect(CONSTRUCTION_TOOLS.map((tool) => tool.name)).toContain('construct_write')
    const listed = await handleMcpJsonRpc(
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      {
        callApi: async () => ({}),
        readResource: async () => ({}),
        listTools: () => [],
      },
    )
    const names = ((listed?.result as { tools: { name: string }[] }).tools ?? []).map((tool) => tool.name)
    expect(names.some((name) => name.startsWith('construct_'))).toBe(false)
  })
})

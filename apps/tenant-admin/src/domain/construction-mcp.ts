import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
  appendFile,
} from 'node:fs/promises'
import path from 'node:path'

type ConstructionToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

const execFileAsync = promisify(execFile)

export const CONSTRUCTION_MAX_FILE_BYTES = 400 * 1024
export const OVH_PREVIEW_SURFACE = 'ovh-preview'

export type ConstructionEnv = {
  mode: boolean
  surface: string
  root: string
}

export type ConstructionActor = {
  keyId?: string
  tenantId?: string
}

export type ConstructionOp =
  | 'status'
  | 'list'
  | 'read'
  | 'write'
  | 'apply_patch'
  | 'export_patch'

export class ConstructionError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ConstructionError'
    this.status = status
    this.code = code
  }
}

const ALLOWED_PREFIXES = [
  'apps/tenant-admin/app/',
  'apps/tenant-admin/components/',
  'apps/tenant-admin/@payload-config/',
  'apps/tenant-admin/src/domain/',
  'apps/tenant-admin/tests/',
  'docs/design/',
] as const

const DENY_SEGMENTS = [
  '.env',
  '.git',
  'node_modules',
  '.next',
  'infrastructure',
  'docker',
] as const

const DENY_SUFFIXES = ['.pem', '.key', '.p12', '.pfx'] as const

export const CONSTRUCTION_TOOLS: ConstructionToolDefinition[] = [
  {
    name: 'construct_status',
    description: 'OVH construction surface status. No secrets.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'construct_list',
    description: 'List allowlisted files under the construction worktree.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Relative directory inside the worktree' } },
    },
  },
  {
    name: 'construct_read',
    description: 'Read one allowlisted source file from the construction worktree.',
    inputSchema: {
      type: 'object',
      required: ['path'],
      properties: { path: { type: 'string' } },
    },
  },
  {
    name: 'construct_write',
    description: 'Write one allowlisted source file. OVH preview only. Max 400KB.',
    inputSchema: {
      type: 'object',
      required: ['path', 'contents'],
      properties: { path: { type: 'string' }, contents: { type: 'string' } },
    },
  },
  {
    name: 'construct_apply_patch',
    description: 'Replace old_string with new_string in one allowlisted file.',
    inputSchema: {
      type: 'object',
      required: ['path', 'old_string', 'new_string'],
      properties: {
        path: { type: 'string' },
        old_string: { type: 'string' },
        new_string: { type: 'string' },
      },
    },
  },
  {
    name: 'construct_export_patch',
    description: 'Return git diff of the worktree for downstream CEP and akademate.com.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
    },
  },
]

export function readConstructionEnv(): ConstructionEnv {
  return {
    mode: process.env.AKADEMATE_CONSTRUCTION_MODE === '1',
    surface: String(process.env.AKADEMATE_SURFACE ?? '').trim(),
    root: path.resolve(process.env.CONSTRUCTION_ROOT || '/opt/cep/workspace'),
  }
}

export function isConstructionEnabled(env: ConstructionEnv = readConstructionEnv()): boolean {
  return env.mode
}

export function assertConstructionRead(env: ConstructionEnv = readConstructionEnv()): void {
  if (!env.mode) {
    throw new ConstructionError('Construction mode is off', 403, 'CONSTRUCTION_OFF')
  }
}

export function assertConstructionWrite(env: ConstructionEnv = readConstructionEnv()): void {
  assertConstructionRead(env)
  if (env.surface !== OVH_PREVIEW_SURFACE) {
    throw new ConstructionError('Construction writes are limited to ovh-preview', 403, 'CONSTRUCTION_SURFACE')
  }
}

function normalizeRel(input: string): string {
  const trimmed = String(input ?? '').trim().replace(/\\/g, '/')
  if (!trimmed || trimmed.startsWith('/') || trimmed.includes('\0')) {
    throw new ConstructionError('Invalid construction path', 403, 'CONSTRUCTION_PATH')
  }
  const rel = path.posix.normalize(trimmed).replace(/^(\.\.(\/|$))+/, '')
  if (rel === '.' || rel.startsWith('../') || path.posix.isAbsolute(rel)) {
    throw new ConstructionError('Invalid construction path', 403, 'CONSTRUCTION_PATH')
  }
  return rel
}

function isDenied(rel: string): boolean {
  const parts = rel.split('/')
  if (parts.some((part) => (DENY_SEGMENTS as readonly string[]).includes(part))) return true
  if (parts.some((part) => part.startsWith('.env'))) return true
  const base = parts[parts.length - 1] ?? ''
  return DENY_SUFFIXES.some((suffix) => base.endsWith(suffix))
}

function isAllowedFile(rel: string): boolean {
  if (isDenied(rel)) return false
  return ALLOWED_PREFIXES.some((prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix))
}

function isAllowedDir(rel: string): boolean {
  if (!rel) return true
  if (isDenied(rel)) return false
  return ALLOWED_PREFIXES.some((prefix) => {
    const dir = prefix.slice(0, -1)
    return rel === dir || rel.startsWith(`${dir}/`) || dir.startsWith(`${rel}/`)
  })
}

export function resolveConstructionPath(relInput: string, env: ConstructionEnv = readConstructionEnv()): {
  rel: string
  abs: string
} {
  const rel = normalizeRel(relInput)
  if (!isAllowedFile(rel) && !isAllowedDir(rel)) {
    throw new ConstructionError('Path is outside the construction allowlist', 403, 'CONSTRUCTION_PATH')
  }
  const abs = path.resolve(env.root, rel)
  const root = path.resolve(env.root)
  if (abs !== root && !abs.startsWith(`${root}${path.sep}`)) {
    throw new ConstructionError('Path escapes the construction root', 403, 'CONSTRUCTION_PATH')
  }
  return { rel, abs }
}

async function appendJournal(
  env: ConstructionEnv,
  actor: ConstructionActor,
  op: ConstructionOp,
  rel: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const journalDir = path.join(env.root, '.construction')
  await mkdir(journalDir, { recursive: true })
  const line = JSON.stringify({
    at: new Date().toISOString(),
    op,
    path: rel,
    keyId: actor.keyId ?? null,
    tenantId: actor.tenantId ?? null,
    ...extra,
  })
  await appendFile(path.join(journalDir, 'journal.jsonl'), `${line}\n`, 'utf8')
}

async function listDir(relInput: string, env: ConstructionEnv): Promise<unknown> {
  const rel = relInput.trim() ? normalizeRel(relInput) : ''
  if (rel && !isAllowedDir(rel)) {
    throw new ConstructionError('Path is outside the construction allowlist', 403, 'CONSTRUCTION_PATH')
  }
  const abs = rel ? path.resolve(env.root, rel) : path.resolve(env.root)
  const entries = await readdir(abs, { withFileTypes: true }).catch(() => {
    throw new ConstructionError('Directory not found', 404, 'CONSTRUCTION_NOT_FOUND')
  })
  return {
    path: rel || '.',
    entries: entries
      .filter((entry) => {
        const child = rel ? `${rel}/${entry.name}` : entry.name
        return entry.isDirectory() ? isAllowedDir(child) : isAllowedFile(child)
      })
      .map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'dir' : 'file',
        path: rel ? `${rel}/${entry.name}` : entry.name,
      })),
  }
}

async function readSource(relInput: string, env: ConstructionEnv): Promise<unknown> {
  const { rel, abs } = resolveConstructionPath(relInput, env)
  if (!isAllowedFile(rel)) {
    throw new ConstructionError('Path is outside the construction allowlist', 403, 'CONSTRUCTION_PATH')
  }
  const info = await stat(abs).catch(() => {
    throw new ConstructionError('File not found', 404, 'CONSTRUCTION_NOT_FOUND')
  })
  if (!info.isFile()) {
    throw new ConstructionError('Path is not a file', 400, 'CONSTRUCTION_NOT_FILE')
  }
  if (info.size > CONSTRUCTION_MAX_FILE_BYTES) {
    throw new ConstructionError('File exceeds 400KB construction limit', 413, 'CONSTRUCTION_TOO_LARGE')
  }
  const contents = await readFile(abs, 'utf8')
  return { path: rel, bytes: Buffer.byteLength(contents), sha256: createHash('sha256').update(contents).digest('hex'), contents }
}

async function writeSource(
  relInput: string,
  contents: string,
  env: ConstructionEnv,
  actor: ConstructionActor,
  op: ConstructionOp,
): Promise<unknown> {
  if (typeof contents !== 'string') {
    throw new ConstructionError('contents must be a string', 400, 'CONSTRUCTION_BAD_ARGS')
  }
  if (Buffer.byteLength(contents) > CONSTRUCTION_MAX_FILE_BYTES) {
    throw new ConstructionError('File exceeds 400KB construction limit', 413, 'CONSTRUCTION_TOO_LARGE')
  }
  const { rel, abs } = resolveConstructionPath(relInput, env)
  if (!isAllowedFile(rel)) {
    throw new ConstructionError('Path is outside the construction allowlist', 403, 'CONSTRUCTION_PATH')
  }
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, contents, 'utf8')
  const sha256 = createHash('sha256').update(contents).digest('hex')
  await appendJournal(env, actor, op, rel, { bytes: Buffer.byteLength(contents), sha256 })
  return { path: rel, bytes: Buffer.byteLength(contents), sha256, written: true }
}

async function exportPatch(relInput: string | undefined, env: ConstructionEnv): Promise<unknown> {
  const args = ['diff', '--no-color']
  if (relInput && relInput.trim()) {
    const { rel } = resolveConstructionPath(relInput, env)
    args.push('--', rel)
  }
  try {
    const { stdout } = await execFileAsync('git', args, { cwd: env.root, timeout: 15_000, maxBuffer: 2_000_000 })
    return {
      path: relInput || '.',
      diff: stdout,
      downstream: ['cepformacion.akademate.com-platform', 'akademate.com'],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new ConstructionError(`Unable to export git diff: ${message}`, 409, 'CONSTRUCTION_GIT')
  }
}

export async function runConstructionOp(
  op: ConstructionOp,
  args: Record<string, unknown> = {},
  actor: ConstructionActor = {},
  env: ConstructionEnv = readConstructionEnv(),
): Promise<unknown> {
  switch (op) {
    case 'status':
      assertConstructionRead(env)
      return {
        mode: env.mode,
        surface: env.surface,
        root: env.root,
        writable: env.surface === OVH_PREVIEW_SURFACE,
        preview: '/ovh-dev',
        allow: ALLOWED_PREFIXES,
      }
    case 'list':
      assertConstructionRead(env)
      return listDir(typeof args.path === 'string' ? args.path : '', env)
    case 'read':
      assertConstructionRead(env)
      return readSource(String(args.path ?? ''), env)
    case 'write':
      assertConstructionWrite(env)
      return writeSource(String(args.path ?? ''), String(args.contents ?? ''), env, actor, 'write')
    case 'apply_patch': {
      assertConstructionWrite(env)
      const current = await readSource(String(args.path ?? ''), env) as { path: string; contents: string }
      const oldString = String(args.old_string ?? '')
      const newString = String(args.new_string ?? '')
      if (!oldString) {
        throw new ConstructionError('old_string is required', 400, 'CONSTRUCTION_BAD_ARGS')
      }
      if (!current.contents.includes(oldString)) {
        throw new ConstructionError('old_string was not found in the file', 409, 'CONSTRUCTION_PATCH')
      }
      return writeSource(current.path, current.contents.replace(oldString, newString), env, actor, 'apply_patch')
    }
    case 'export_patch':
      assertConstructionRead(env)
      return exportPatch(typeof args.path === 'string' ? args.path : undefined, env)
    default: {
      const exhaustive: never = op
      throw new ConstructionError(`Unknown construction op: ${String(exhaustive)}`, 400, 'CONSTRUCTION_OP')
    }
  }
}

export function constructionOpFromTool(name: string): ConstructionOp | null {
  if (!name.startsWith('construct_')) return null
  const op = name.slice('construct_'.length) as ConstructionOp
  switch (op) {
    case 'status':
    case 'list':
    case 'read':
    case 'write':
    case 'apply_patch':
    case 'export_patch':
      return op
    default:
      return null
  }
}

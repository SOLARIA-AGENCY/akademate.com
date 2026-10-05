import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetPayload, mockExecute, mockQuery } = vi.hoisted(() => ({
  mockGetPayload: vi.fn(),
  mockExecute: vi.fn(),
  mockQuery: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: mockGetPayload }))
vi.mock('@payload-config', () => ({ default: {} }))

import { GET as live } from './live/route'
import { GET as ready } from './ready/route'
import { GET as technical } from './technical/route'

describe('health routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns liveness without initializing Payload', async () => {
    const response = await live()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
    expect(mockGetPayload).not.toHaveBeenCalled()
  })

  it('returns readiness after a database probe', async () => {
    mockGetPayload.mockResolvedValueOnce({ db: { drizzle: { execute: mockExecute } } })

    const response = await ready()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ready' })
    expect(mockExecute).toHaveBeenCalledWith('SELECT 1')
  })

  it('returns 503 when the database probe fails', async () => {
    mockExecute.mockRejectedValueOnce(new Error('connection refused'))
    mockGetPayload.mockResolvedValueOnce({ db: { drizzle: { execute: mockExecute } } })

    const response = await ready()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ status: 'not_ready' })
  })

  it('uses a query client when execute is unavailable', async () => {
    mockGetPayload.mockResolvedValueOnce({ db: { pool: { query: mockQuery } } })

    const response = await ready()

    expect(response.status).toBe(200)
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1')
  })

  it('requires the configured technical token and principal', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'akademate-health-'))
    const tokenFile = join(directory, 'token')
    writeFileSync(tokenFile, 'test-token', { mode: 0o600 })
    process.env.HEALTH_TECHNICAL_SMOKE_TOKEN_FILE = tokenFile
    process.env.HEALTH_TECHNICAL_SMOKE_PRINCIPAL = 'technical-release-smoke:test'
    const request = new Request('http://localhost/api/health/technical', {
      headers: { authorization: 'Bearer test-token', 'x-akademate-technical-principal': 'technical-release-smoke:test' },
    })

    const response = await technical(request as any)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'technical_ready', principal: 'technical-release-smoke:test' })
    rmSync(directory, { recursive: true, force: true })
  })

  it('rejects an incorrect technical credential', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'akademate-health-'))
    const tokenFile = join(directory, 'token')
    writeFileSync(tokenFile, 'test-token', { mode: 0o600 })
    process.env.HEALTH_TECHNICAL_SMOKE_TOKEN_FILE = tokenFile
    process.env.HEALTH_TECHNICAL_SMOKE_PRINCIPAL = 'technical-release-smoke:test'
    const response = await technical(new Request('http://localhost/api/health/technical') as any)

    expect(response.status).toBe(401)
    rmSync(directory, { recursive: true, force: true })
  })

  it('fails closed when only the obsolete smoke env name is configured', async () => {
    delete process.env.HEALTH_TECHNICAL_SMOKE_TOKEN_FILE
    process.env.TECHNICAL_SMOKE_TOKEN_FILE = '/tmp/obsolete-token-name'
    process.env.HEALTH_TECHNICAL_SMOKE_PRINCIPAL = 'technical-release-smoke:test'

    const response = await technical(new Request('http://localhost/api/health/technical') as any)

    expect(response.status).toBe(503)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}))

vi.mock('@/lib/v1Auth', () => ({
  requireV1Auth: authMock,
}))

import { GET, POST } from '../route'

describe('hosted MCP HTTP', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('GET is public discovery and names both CEP and akademate.com', async () => {
    const res = await GET(new NextRequest('https://app.akademate.com/mcp'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.transport.url).toBe('https://app.akademate.com/mcp')
    expect(body.hosts.cep).toBe('https://cepformacion.akademate.com')
    expect(authMock).not.toHaveBeenCalled()
  })

  it('POST without an API key is rejected', async () => {
    authMock.mockResolvedValueOnce({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Missing API key', code: 'MISSING_API_KEY' }), { status: 401 }),
    })
    const res = await POST(new NextRequest('https://app.akademate.com/mcp', {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    }))
    expect(res.status).toBe(401)
  })

  it('POST initialize with a valid key returns MCP capabilities', async () => {
    authMock.mockResolvedValueOnce({ ok: true, auth: { tenantId: '7', scopes: ['courses:read'] } })
    const res = await POST(new NextRequest('https://app.akademate.com/mcp', {
      method: 'POST',
      headers: { Authorization: 'Bearer ak_test_key' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.result.serverInfo.name).toBe('akademate')
    expect(body.result.capabilities.tools).toBeDefined()
  })
})

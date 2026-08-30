import { describe, expect, it } from 'vitest'
import {
  AKADEMATE_SAAS_ORIGIN,
  CEP_PUBLIC_ORIGIN,
  MCP_TOOLS,
  buildMcpDiscovery,
  handleMcpJsonRpc,
  resolveToolDispatch,
} from '../academy-mcp'

describe('academy MCP protocol', () => {
  it('advertises CEP now and akademate.com later on the same /mcp path', () => {
    const discovery = buildMcpDiscovery(CEP_PUBLIC_ORIGIN)
    expect(discovery.transport.url).toBe(`${CEP_PUBLIC_ORIGIN}/mcp`)
    expect(discovery.hosts.akademateSaas).toBe(AKADEMATE_SAAS_ORIGIN)
    expect(discovery.api.rest).toBe(`${CEP_PUBLIC_ORIGIN}/api/v1`)
  })

  it('maps agent tools onto the existing tenant-scoped v1 API', () => {
    expect(resolveToolDispatch('list_courses', { limit: 10 }).path).toContain('/api/v1/courses')
    expect(resolveToolDispatch('create_lead', { email: 'a@test.com' })).toMatchObject({
      kind: 'post',
      path: '/api/v1/leads',
    })
    expect(MCP_TOOLS.map((tool) => tool.name)).toContain('get_me')
    expect(resolveToolDispatch('get_compliance_policy', {}).path).toBe('/api/compliance/policy')
    expect(resolveToolDispatch('list_placement_agencies', {}).path).toBe('/api/compliance/agencies')
  })

  it('handles initialize and tools/list without leaking secrets', async () => {
    const init = await handleMcpJsonRpc(
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      { callApi: async () => ({}), readResource: async () => ({}) },
    )
    expect(init?.result).toMatchObject({
      serverInfo: { name: 'akademate' },
    })
    const listed = await handleMcpJsonRpc(
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      { callApi: async () => ({}), readResource: async () => ({}) },
    )
    expect(JSON.stringify(listed)).not.toMatch(/ak_|sk_|rk_|whsec_/)
    expect((listed?.result as { tools: unknown[] }).tools.length).toBeGreaterThan(10)
  })

  it('dispatches tools/call through the API adapter', async () => {
    const result = await handleMcpJsonRpc(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_analytics', arguments: {} } },
      {
        callApi: async (dispatch) => {
          expect(dispatch.path).toBe('/api/v1/analytics')
          return { students: 12 }
        },
        readResource: async () => ({}),
      },
    )
    expect(JSON.stringify(result)).toContain('students')
  })
})

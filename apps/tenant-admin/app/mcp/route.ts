import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireV1Auth } from '@/lib/v1Auth'
import {
  AKADEMATE_SAAS_ORIGIN,
  CEP_PUBLIC_ORIGIN,
  MCP_TOOLS,
  buildMcpDiscovery,
  handleMcpJsonRpc,
  type McpJsonRpcRequest,
  type McpToolDispatch,
} from '@/src/domain/academy-mcp'
import {
  CONSTRUCTION_TOOLS,
  ConstructionError,
  constructionOpFromTool,
  isConstructionEnabled,
  runConstructionOp,
} from '@/src/domain/construction-mcp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function publicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`
  }
  const host = request.headers.get('host')
  if (host && !host.startsWith('0.0.0.0')) {
    return `${request.nextUrl.protocol}//${host}`
  }
  return process.env.PAYLOAD_PUBLIC_SERVER_URL || AKADEMATE_SAAS_ORIGIN
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  }
}

async function proxyAcademyApi(
  request: NextRequest,
  dispatch: McpToolDispatch,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const url = new URL(dispatch.path, request.nextUrl.origin)
  const response = await fetch(url, {
    method: dispatch.kind === 'post' ? 'POST' : 'GET',
    headers: {
      Authorization: request.headers.get('authorization') ?? '',
      'Content-Type': 'application/json',
    },
    body: dispatch.kind === 'post' ? JSON.stringify(dispatch.body?.(args) ?? args) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `API ${response.status}`)
  }
  return data
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request)
  return NextResponse.json(
    {
      ...buildMcpDiscovery(origin),
      note: `Hosted MCP for this academy. Same /mcp and /api/v1 contract as ${CEP_PUBLIC_ORIGIN}.`,
    },
    { headers: corsHeaders(request.headers.get('origin')) },
  )
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'))
  const auth = await requireV1Auth(request, null)
  if (!auth.ok) {
    return NextResponse.json(await auth.response.json(), { status: auth.response.status, headers })
  }

  const rpc = (await request.json().catch(() => ({}))) as McpJsonRpcRequest
  const args = ((rpc.params?.arguments ?? {}) as Record<string, unknown>)
  const constructionOn = isConstructionEnabled()
  if (rpc.method === 'tools/call' && String(rpc.params?.name ?? '').startsWith('construct_')) {
    if (!constructionOn) {
      return NextResponse.json({ error: 'Construction mode is off', code: 'CONSTRUCTION_OFF' }, { status: 403, headers })
    }
    const scoped = await requireV1Auth(request, 'construction:write')
    if (!scoped.ok) {
      return NextResponse.json(await scoped.response.json(), { status: scoped.response.status, headers })
    }
  }

  const result = await handleMcpJsonRpc(rpc, {
    callApi: (dispatch) => proxyAcademyApi(request, dispatch, args),
    readResource: (path) => proxyAcademyApi(request, { kind: 'get', path }),
    listTools: () => (constructionOn ? [...MCP_TOOLS, ...CONSTRUCTION_TOOLS] : MCP_TOOLS),
    callConstruction: async (name, toolArgs) => {
      const op = constructionOpFromTool(name)
      if (!op) throw new ConstructionError(`Unknown construction tool: ${name}`, 400, 'CONSTRUCTION_OP')
      return runConstructionOp(op, toolArgs, {
        keyId: auth.ok ? auth.auth.keyId : undefined,
        tenantId: auth.ok ? auth.auth.tenantId : undefined,
      })
    },
  })

  if (result === null) {
    return new NextResponse(null, { status: 202, headers })
  }
  return NextResponse.json(result, { headers })
}

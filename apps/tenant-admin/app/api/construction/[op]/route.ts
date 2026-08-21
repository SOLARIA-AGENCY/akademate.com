import { NextRequest, NextResponse } from 'next/server'
import { requireV1Auth } from '@/lib/v1Auth'
import {
  ConstructionError,
  isConstructionEnabled,
  runConstructionOp,
  type ConstructionOp,
} from '@/src/domain/construction-mcp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const OPS: ConstructionOp[] = ['status', 'list', 'read', 'write', 'apply_patch', 'export_patch']

function isOp(value: string): value is ConstructionOp {
  return (OPS as string[]).includes(value)
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ConstructionError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Construction failed', code: 'CONSTRUCTION_ERROR' },
    { status: 500 },
  )
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ op: string }> },
) {
  const { op } = await context.params
  if (!isOp(op) || (op !== 'status' && op !== 'list' && op !== 'read' && op !== 'export_patch')) {
    return NextResponse.json({ error: 'Unknown construction op', code: 'CONSTRUCTION_OP' }, { status: 404 })
  }
  if (!isConstructionEnabled()) {
    return NextResponse.json({ error: 'Construction mode is off', code: 'CONSTRUCTION_OFF' }, { status: 403 })
  }
  const auth = await requireV1Auth(request, 'construction:write')
  if (!auth.ok) return auth.response

  const url = request.nextUrl
  try {
    const data = await runConstructionOp(
      op,
      { path: url.searchParams.get('path') ?? undefined },
      { keyId: auth.auth.keyId, tenantId: auth.auth.tenantId },
    )
    return NextResponse.json(data)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ op: string }> },
) {
  const { op } = await context.params
  if (!isOp(op)) {
    return NextResponse.json({ error: 'Unknown construction op', code: 'CONSTRUCTION_OP' }, { status: 404 })
  }
  if (!isConstructionEnabled()) {
    return NextResponse.json({ error: 'Construction mode is off', code: 'CONSTRUCTION_OFF' }, { status: 403 })
  }
  const auth = await requireV1Auth(request, 'construction:write')
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  try {
    const data = await runConstructionOp(op, body, {
      keyId: auth.auth.keyId,
      tenantId: auth.auth.tenantId,
    })
    return NextResponse.json(data)
  } catch (error) {
    return errorResponse(error)
  }
}

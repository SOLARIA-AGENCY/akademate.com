import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { normalizeAdPreflightBody, preflightMetaAd } from '../_workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = normalizeAdPreflightBody(await request.json())
    const result = await preflightMetaAd({ request, body })
    return NextResponse.json({
      success: true,
      preflight: result.preflight,
      source_health: result.ctx.health,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo verificar la configuracion Meta.'
    const health = error && typeof error === 'object' && 'health' in error ? (error as { health?: unknown }).health : undefined
    const status = message === 'UNAUTHORIZED' ? 401 : 400
    return NextResponse.json({ success: false, error: { message }, source_health: health }, { status })
  }
}

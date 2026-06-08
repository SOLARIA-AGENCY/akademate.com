import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildPreview, getConvocatoria, getWorkflowContext, normalizeAdWorkflowBody, resolveConvocatoriaPlan, upsertDraft } from '../_workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = normalizeAdWorkflowBody(await request.json())
    const ctx = await getWorkflowContext(request)
    const convocatoria = await getConvocatoria(ctx.payload, body.convocatoria_id)
    const plan = resolveConvocatoriaPlan({ request, body, convocatoria })
    const preview = buildPreview({ body, convocatoria, plan })
    const draftId = await upsertDraft({
      drizzle: ctx.drizzle,
      tenantId: ctx.metaContext.tenantId!,
      userId: ctx.metaContext.userId,
      body,
      plan,
      preview,
      status: 'draft',
    })
    return NextResponse.json({ success: true, draft_id: draftId, preview, source_health: ctx.health })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el borrador Meta.'
    const status = message === 'UNAUTHORIZED' ? 401 : 400
    return NextResponse.json({ success: false, error: { message } }, { status })
  }
}

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { normalizeMetaAdAccountId, resolveMetaRequestContext } from '../_lib/integrations'

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0'

type MetaAdAccountNode = {
  id?: string
  account_id?: string
  name?: string
  account_status?: number | string
}

function toAccountStatus(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export async function GET(request: NextRequest) {
  const context = await resolveMetaRequestContext(request, request.nextUrl.searchParams.get('tenantId'))

  if (!context.authenticated) {
    return NextResponse.json(
      { docs: [], totalDocs: 0, error: { code: 'UNAUTHORIZED', message: 'Sesión no autenticada' } },
      { status: 401 },
    )
  }

  if (!context.tenantId) {
    return NextResponse.json(
      { docs: [], totalDocs: 0, error: { code: 'MISCONFIGURED', message: 'No se pudo resolver el tenant actual.' } },
      { status: 400 },
    )
  }

  if (!context.meta.marketingApiToken) {
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        error: { code: 'MISCONFIGURED', message: 'Meta Marketing API token no configurado.' },
      },
      { status: 200 },
    )
  }

  const includeInactive = ['1', 'true', 'yes'].includes(
    (request.nextUrl.searchParams.get('include_inactive') || '').toLowerCase(),
  )

  const graphUrl = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/adaccounts`)
  graphUrl.searchParams.set('fields', 'id,account_id,name,account_status')
  graphUrl.searchParams.set('limit', '200')
  graphUrl.searchParams.set('access_token', context.meta.marketingApiToken)

  const res = await fetch(graphUrl.toString(), { cache: 'no-store' })
  const payload = (await res.json()) as { data?: MetaAdAccountNode[]; error?: { message?: string } }

  if (!res.ok || payload?.error) {
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        error: {
          code: 'META_API_ERROR',
          message: payload?.error?.message || 'No se pudieron recuperar las cuentas publicitarias.',
        },
      },
      { status: 200 },
    )
  }

  const docs = (Array.isArray(payload.data) ? payload.data : [])
    .map((item) => {
      const accountIdRaw = String(item.account_id || item.id || '').trim()
      const accountId = normalizeMetaAdAccountId(accountIdRaw)
      const accountStatus = toAccountStatus(item.account_status)
      return {
        id: accountId,
        meta_id: String(item.id || ''),
        account_id: accountId,
        name: String(item.name || `Ad Account ${accountId || 'N/D'}`),
        account_status: accountStatus,
        active: accountStatus === 1,
      }
    })
    .filter((item) => item.id)
    .filter((item) => includeInactive || item.active)

  return NextResponse.json({
    docs,
    totalDocs: docs.length,
  })
}

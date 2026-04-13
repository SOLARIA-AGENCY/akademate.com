import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { listCampaigns } from '../../../../src/lib/meta-marketing'
import { getAuthenticatedUserContext } from '../../leads/_lib/auth'

type UiCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'
const SOLARIA_PREFIX = 'SOLARIA AGENCY'

interface MetaCampaign {
  id?: string
  name?: string
  status?: string
  objective?: string
  daily_budget?: string
}

function mapMetaStatus(status?: string): UiCampaignStatus {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'ACTIVE') return 'active'
  if (normalized === 'PAUSED') return 'paused'
  if (normalized === 'DELETED' || normalized === 'ARCHIVED') return 'archived'
  return 'draft'
}

function asRows(result: unknown): any[] {
  if (Array.isArray(result)) return result
  const typed = result as { rows?: any[] }
  return Array.isArray(typed?.rows) ? typed.rows : []
}

/**
 * GET /api/meta/campaigns
 * Read-only listing from Meta Marketing API.
 * Uses tenant integrations token/adAccount and returns data normalized
 * to the dashboard campaigns table shape.
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    const authSession = await getAuthenticatedUserContext(request, payload)
    const tenantId = authSession?.tenantId ?? null
    if (tenantId === null) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 },
      )
    }

    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) {
      return NextResponse.json(
        { docs: [], source: 'meta', configured: false, error: 'Database unavailable' },
        { status: 500 },
      )
    }

    const tenantRes = await drizzle.execute(`
      SELECT
        id,
        integrations_meta_ad_account_id,
        integrations_meta_marketing_api_token
      FROM tenants
      WHERE id = ${tenantId}
      LIMIT 1
    `)

    const rows = asRows(tenantRes)
    const tenant = rows[0] ?? null
    const accessToken = String(tenant?.integrations_meta_marketing_api_token || '').trim()
    const adAccountId = String(tenant?.integrations_meta_ad_account_id || '').trim()

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        {
          docs: [],
          source: 'meta',
          configured: false,
          error: 'Meta integration not configured for this tenant',
        },
        { status: 200 },
      )
    }

    const result = await listCampaigns(adAccountId, accessToken)
    if (!result.success) {
      return NextResponse.json(
        { docs: [], source: 'meta', configured: true, error: result.error || 'Meta API error' },
        { status: 502 },
      )
    }

    const campaignRows = Array.isArray((result.data as any)?.data)
      ? ((result.data as any).data as MetaCampaign[])
      : []

    const docs = campaignRows
      .filter((c) => String(c.name || '').toUpperCase().startsWith(SOLARIA_PREFIX))
      .map((c) => ({
        id: c.id || '',
        name: c.name || 'Campaña Meta',
        status: mapMetaStatus(c.status),
        campaign_type: 'meta_ads',
        budget: c.daily_budget ? Number(c.daily_budget) / 100 : undefined,
      }))

    return NextResponse.json({
      docs,
      source: 'meta',
      configured: true,
    })
  } catch (error) {
    console.error('[meta-campaigns] GET error:', error)
    return NextResponse.json(
      { docs: [], source: 'meta', configured: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '../../leads/_lib/auth'
import { getCampaignInsights, listCampaigns } from '../../../../src/lib/meta-marketing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RangeKey = '7d' | '30d' | '90d'

const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const SOLARIA_PREFIX = 'SOLARIA AGENCY'
const MIN_CAMPAIGN_YEAR = 2026

interface TrafficData {
  source: 'ga4' | 'internal'
  totalSessions: number
  series: Array<{
    date: string
    isoDate: string
    Organico: number
    'Facebook Ads': number
    'Google Ads': number
    Total: number
  }>
  topPages: Array<{ path: string; views: number; avgTime: string }>
  sourceMedium: Array<{ source: string; sessions: number; users: number; bounceRate: number }>
}

function pickRange(value: string | null): RangeKey {
  if (value === '7d' || value === '30d' || value === '90d') return value
  return '30d'
}

function asRows(result: unknown): any[] {
  if (Array.isArray(result)) return result
  const typed = result as { rows?: any[] }
  return Array.isArray(typed?.rows) ? typed.rows : []
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toDateLabel(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function parseGa4Date(raw: string): string {
  if (!/^\d{8}$/.test(raw)) return raw
  const y = raw.slice(0, 4)
  const m = raw.slice(4, 6)
  const d = raw.slice(6, 8)
  return `${y}-${m}-${d}`
}

async function getTrafficFromInternal(
  drizzle: any,
  tenantId: number,
  rangeDays: number,
): Promise<TrafficData> {
  const seriesRes = await drizzle.execute(`
    SELECT
      DATE(created_at) AS day,
      COUNT(*)::int AS total,
      SUM(CASE WHEN LOWER(COALESCE(utm_source, '')) LIKE 'facebook%' OR LOWER(COALESCE(utm_source, '')) LIKE 'instagram%' OR LOWER(COALESCE(utm_medium, '')) LIKE '%meta%' THEN 1 ELSE 0 END)::int AS facebook,
      SUM(CASE WHEN LOWER(COALESCE(utm_source, '')) LIKE 'google%' OR LOWER(COALESCE(utm_medium, '')) LIKE '%google%' THEN 1 ELSE 0 END)::int AS google
    FROM traffic_events
    WHERE tenant_id = ${tenantId}
      AND created_at >= NOW() - INTERVAL '${rangeDays} days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `)

  const pageRes = await drizzle.execute(`
    SELECT
      COALESCE(path, '/') AS path,
      COUNT(*)::int AS views
    FROM traffic_events
    WHERE tenant_id = ${tenantId}
      AND event_type = 'page_view'
      AND created_at >= NOW() - INTERVAL '${rangeDays} days'
    GROUP BY COALESCE(path, '/')
    ORDER BY views DESC
    LIMIT 10
  `)

  const sourceRes = await drizzle.execute(`
    SELECT
      COALESCE(NULLIF(utm_source, ''), 'direct') AS source,
      COALESCE(NULLIF(utm_medium, ''), '(none)') AS medium,
      COUNT(*)::int AS sessions
    FROM traffic_events
    WHERE tenant_id = ${tenantId}
      AND created_at >= NOW() - INTERVAL '${rangeDays} days'
    GROUP BY 1, 2
    ORDER BY sessions DESC
    LIMIT 10
  `)

  const seriesRows = asRows(seriesRes)
  const topPageRows = asRows(pageRes)
  const sourceRows = asRows(sourceRes)

  const series = seriesRows.map((row) => {
    const facebook = toNumber(row.facebook)
    const google = toNumber(row.google)
    const total = toNumber(row.total)
    return {
      date: toDateLabel(String(row.day)),
      isoDate: String(row.day),
      Organico: Math.max(total - facebook - google, 0),
      'Facebook Ads': facebook,
      'Google Ads': google,
      Total: total,
    }
  })

  const totalSessions = series.reduce((acc, item) => acc + item.Total, 0)

  return {
    source: 'internal' as const,
    totalSessions,
    series,
    topPages: topPageRows.map((row) => ({
      path: String(row.path ?? '/'),
      views: toNumber(row.views),
      avgTime: '—',
    })),
    sourceMedium: sourceRows.map((row) => ({
      source: `${row.source} / ${row.medium}`,
      sessions: toNumber(row.sessions),
      users: toNumber(row.sessions),
      bounceRate: 0,
    })),
  }
}

async function getTrafficFromGa4(
  propertyId: string,
  bearerToken: string,
  rangeDays: number,
): Promise<TrafficData> {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`

  const bodySeries = {
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'date' }, { name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    keepEmptyRows: false,
    limit: 10000,
  }

  const bodyPages = {
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  }

  const bodySource = {
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  }

  const [seriesRes, pagesRes, sourceRes] = await Promise.all([
    fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodySeries),
      cache: 'no-store',
    }),
    fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPages),
      cache: 'no-store',
    }),
    fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodySource),
      cache: 'no-store',
    }),
  ])

  if (!seriesRes.ok || !pagesRes.ok || !sourceRes.ok) {
    throw new Error('GA4 API unavailable')
  }

  const [seriesPayload, pagesPayload, sourcePayload] = await Promise.all([
    seriesRes.json() as Promise<any>,
    pagesRes.json() as Promise<any>,
    sourceRes.json() as Promise<any>,
  ])

  const byDate = new Map<string, { facebook: number; google: number; total: number }>()
  for (const row of seriesPayload?.rows ?? []) {
    const dateRaw = row?.dimensionValues?.[0]?.value || ''
    const source = String(row?.dimensionValues?.[1]?.value || '').toLowerCase()
    const sessions = toNumber(row?.metricValues?.[0]?.value)
    const dateIso = parseGa4Date(String(dateRaw))

    const current = byDate.get(dateIso) ?? { facebook: 0, google: 0, total: 0 }
    current.total += sessions
    if (source.includes('facebook') || source.includes('instagram')) current.facebook += sessions
    if (source.includes('google')) current.google += sessions
    byDate.set(dateIso, current)
  }

  const series = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateIso, values]) => ({
      date: toDateLabel(dateIso),
      isoDate: dateIso,
      Organico: Math.max(values.total - values.facebook - values.google, 0),
      'Facebook Ads': values.facebook,
      'Google Ads': values.google,
      Total: values.total,
    }))

  const totalSessions = series.reduce((acc, item) => acc + item.Total, 0)

  return {
    source: 'ga4' as const,
    totalSessions,
    series,
    topPages: (pagesPayload?.rows ?? []).map((row: any) => ({
      path: String(row?.dimensionValues?.[0]?.value || '/'),
      views: toNumber(row?.metricValues?.[0]?.value),
      avgTime: '—',
    })),
    sourceMedium: (sourcePayload?.rows ?? []).map((row: any) => {
      const sourceMedium = String(row?.dimensionValues?.[0]?.value || '(direct) / (none)')
      const sessions = toNumber(row?.metricValues?.[0]?.value)
      return {
        source: sourceMedium,
        sessions,
        users: sessions,
        bounceRate: 0,
      }
    }),
  }
}

function parseConversionsFromInsights(insightsRow: any): number {
  const actions = Array.isArray(insightsRow?.actions) ? insightsRow.actions : []
  let total = 0
  for (const action of actions) {
    const actionType = String(action?.action_type || '')
    if (
      actionType === 'lead' ||
      actionType === 'onsite_conversion.lead_grouped' ||
      actionType === 'offsite_conversion.fb_pixel_lead'
    ) {
      total += toNumber(action?.value)
    }
  }
  return total
}

function parseCampaignYear(campaign: any): number | null {
  const candidateDates = [campaign?.start_time, campaign?.created_time, campaign?.updated_time]
  for (const value of candidateDates) {
    if (!value) continue
    const parsed = new Date(String(value))
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getUTCFullYear()
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    const authSession = await getAuthenticatedUserContext(request, payload)
    const tenantId = authSession?.tenantId ?? null
    if (tenantId === null) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const range = pickRange(request.nextUrl.searchParams.get('range'))
    const rangeDays = RANGE_DAYS[range]

    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) {
      return NextResponse.json({ error: 'DB not available' }, { status: 500 })
    }

    await drizzle.execute(`
      CREATE TABLE IF NOT EXISTS traffic_events (
        id BIGSERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        event_id VARCHAR(191),
        path TEXT,
        referrer TEXT,
        user_agent_hash VARCHAR(64),
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const tenantRes = await drizzle.execute(`
      SELECT
        id,
        name,
        integrations_meta_ad_account_id,
        integrations_meta_marketing_api_token,
        integrations_ga4_measurement_id
      FROM tenants
      WHERE id = ${tenantId}
      LIMIT 1
    `)

    const tenant = asRows(tenantRes)[0] ?? null
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    const ga4PropertyId = process.env.GA4_PROPERTY_ID || ''
    const ga4BearerToken = process.env.GA4_API_BEARER_TOKEN || ''

    let traffic: TrafficData = await getTrafficFromInternal(drizzle, tenantId, rangeDays)
    if (ga4PropertyId && ga4BearerToken && tenant.integrations_ga4_measurement_id) {
      try {
        traffic = await getTrafficFromGa4(ga4PropertyId, ga4BearerToken, rangeDays)
      } catch {
        // Keep internal fallback.
      }
    }

    const campaignsResult = await payload.find({
      collection: 'campaigns',
      where: {
        tenant: { equals: tenantId },
      } as any,
      limit: 200,
      depth: 0,
      sort: '-createdAt',
    })

    const localCampaigns = (campaignsResult.docs as any[]).filter((c) =>
      String(c?.name || '').toUpperCase().startsWith(SOLARIA_PREFIX),
    )

    const linkedMetaIds = new Set(
      localCampaigns
        .map((c) => String(c?.meta_campaign_id || '').trim())
        .filter((id) => id.length > 0),
    )

    const adAccountId = String(tenant.integrations_meta_ad_account_id || '').trim()
    const accessToken = String(tenant.integrations_meta_marketing_api_token || '').trim()

    let detectedCampaigns: any[] = []
    let facebookSource: 'meta_api' | 'unavailable' = 'unavailable'

    if (adAccountId && accessToken) {
      const list = await listCampaigns(adAccountId, accessToken)
      if (list.success) {
        const rows = Array.isArray((list.data as any)?.data) ? (list.data as any).data : []
        detectedCampaigns = rows.filter((item: any) => {
          const hasPrefix = String(item?.name || '').toUpperCase().startsWith(SOLARIA_PREFIX)
          if (!hasPrefix) return false
          const campaignYear = parseCampaignYear(item)
          return campaignYear !== null && campaignYear >= MIN_CAMPAIGN_YEAR
        })
        facebookSource = 'meta_api'
      }
    }

    const detectedIds = new Set(detectedCampaigns.map((c: any) => String(c?.id || '')))

    const facebookCampaigns = await Promise.all(
      detectedCampaigns.slice(0, 25).map(async (campaign: any) => {
        const campaignId = String(campaign?.id || '')
        let impressions = 0
        let clicks = 0
        let spend = 0
        let conversions = 0
        let roas = 0

        try {
          const insights = await getCampaignInsights(adAccountId, accessToken, campaignId)
          const insightRow = Array.isArray((insights.data as any)?.data)
            ? (insights.data as any).data[0]
            : null
          if (insightRow) {
            impressions = toNumber(insightRow.impressions)
            clicks = toNumber(insightRow.clicks)
            spend = toNumber(insightRow.spend)
            conversions = parseConversionsFromInsights(insightRow)
            roas = toNumber(insightRow?.purchase_roas?.[0]?.value)
          }
        } catch {
          // Keep zeroes when insights call fails.
        }

        const dailyBudget = toNumber(campaign?.daily_budget) / 100
        return {
          id: campaignId,
          name: String(campaign?.name || 'Campaña Meta'),
          status: String(campaign?.status || 'PAUSED').toLowerCase() === 'active' ? 'active' : 'paused',
          budget: dailyBudget,
          impressions,
          clicks,
          cpc: clicks > 0 ? spend / clicks : 0,
          conversions,
          roas,
          linked: linkedMetaIds.has(campaignId),
        }
      }),
    )

    const totalFacebookSpend = facebookCampaigns.reduce((sum, item) => sum + item.budget, 0)
    const totalFacebookImpressions = facebookCampaigns.reduce((sum, item) => sum + item.impressions, 0)
    const totalFacebookClicks = facebookCampaigns.reduce((sum, item) => sum + item.clicks, 0)
    const totalFacebookConversions = facebookCampaigns.reduce((sum, item) => sum + item.conversions, 0)
    const totalRoasWeight = facebookCampaigns.reduce((sum, item) => sum + item.roas * (item.budget || 0), 0)
    const avgRoas = totalFacebookSpend > 0 ? totalRoasWeight / totalFacebookSpend : 0

    const linkedDetected = Array.from(linkedMetaIds).filter((id) => detectedIds.has(id)).length

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      range,
      source_health: {
        traffic: traffic.source,
        facebook: facebookSource,
      },
      overview: {
        total_sessions: traffic.totalSessions,
        total_ad_spend: totalFacebookSpend,
        total_conversions: totalFacebookConversions,
        global_roas: avgRoas,
      },
      traffic: {
        series: traffic.series,
        top_pages: traffic.topPages,
        source_medium: traffic.sourceMedium,
      },
      facebook: {
        spend: totalFacebookSpend,
        impressions: totalFacebookImpressions,
        clicks: totalFacebookClicks,
        ctr: totalFacebookImpressions > 0 ? (totalFacebookClicks / totalFacebookImpressions) * 100 : 0,
        conversions: totalFacebookConversions,
        roas: avgRoas,
        campaigns: facebookCampaigns,
        coverage: {
          linked: linkedDetected,
          detected: detectedCampaigns.length,
          not_linked: Math.max(detectedCampaigns.length - linkedDetected, 0),
        },
      },
      campaigns: {
        linked: linkedDetected,
        detected: detectedCampaigns.length,
        not_linked: Math.max(detectedCampaigns.length - linkedDetected, 0),
      },
      google: {
        status: 'pending_connection',
      },
    })
  } catch (error) {
    console.error('[analytics/dashboard] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

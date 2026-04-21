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
const SNAPSHOT_STALE_MINUTES = 180

type FacebookDataSource = 'snapshot' | 'meta_api_live' | 'unavailable'
type TrafficSource = 'ga4' | 'internal'
type Ga4FallbackReasonCode =
  | 'ga4_connected'
  | 'ga4_missing_measurement_id'
  | 'ga4_missing_property_id'
  | 'ga4_invalid_property_id'
  | 'ga4_missing_bearer_token'
  | 'ga4_http_400'
  | 'ga4_http_401'
  | 'ga4_http_403'
  | 'ga4_http_404'
  | 'ga4_http_429'
  | 'ga4_http_500'
  | 'ga4_http_503'
  | 'ga4_http_error'
  | 'ga4_runtime_error'

interface Ga4Health {
  provider: TrafficSource
  status: 'connected' | 'fallback'
  reason_code: Ga4FallbackReasonCode
  reason: string | null
  property_id: string | null
  measurement_id: string | null
  checked_at: string
}

interface TrafficData {
  source: TrafficSource
  totalSessions: number
  series: TrafficSeriesPoint[]
  seriesByGranularity: {
    day: TrafficSeriesPoint[]
    week: TrafficSeriesPoint[]
    month: TrafficSeriesPoint[]
  }
  topPages: Array<{ path: string; views: number; avgTime: string }>
  sourceMedium: Array<{ source: string; sessions: number; users: number; bounceRate: number }>
}

interface TrafficSeriesPoint {
  date: string
  isoDate: string
  Organico: number
  'Facebook Ads': number
  'Google Ads': number
  Total: number
}

interface FacebookCampaignMetrics {
  id: string
  name: string
  status: 'active' | 'paused'
  spend: number
  budget: number
  impressions: number
  clicks: number
  cpc: number
  conversions: number
  roas: number
  linked: boolean
}

function extractMetaCampaignIdTokens(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  const matches = raw.match(/\b\d{8,20}\b/g)
  if (!matches) return []
  return Array.from(new Set(matches.map((token) => token.trim()).filter(Boolean)))
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

function normalizeGa4PropertyId(rawPropertyId: string): string | null {
  const trimmed = rawPropertyId.trim()
  if (!trimmed) return null
  const withoutPrefix = trimmed.replace(/^properties\//i, '')
  return /^\d+$/.test(withoutPrefix) ? withoutPrefix : null
}

class Ga4ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'Ga4ApiError'
    this.status = status
    this.detail = detail ?? ''
  }
}

async function runGa4Report(endpoint: string, bearerToken: string, body: object): Promise<any> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!response.ok) {
    const responseText = await response.text().catch(() => '')
    const compactDetail = responseText.length > 400 ? `${responseText.slice(0, 397)}...` : responseText
    const message = compactDetail || `GA4 Data API responded with status ${response.status}`
    throw new Ga4ApiError(response.status, message, compactDetail)
  }

  return response.json()
}

function mapGa4FallbackReason(error: unknown): { code: Ga4FallbackReasonCode; reason: string } {
  if (error instanceof Ga4ApiError) {
    if (error.status === 400) return { code: 'ga4_http_400', reason: error.message }
    if (error.status === 401) return { code: 'ga4_http_401', reason: error.message }
    if (error.status === 403) return { code: 'ga4_http_403', reason: error.message }
    if (error.status === 404) return { code: 'ga4_http_404', reason: error.message }
    if (error.status === 429) return { code: 'ga4_http_429', reason: error.message }
    if (error.status === 500) return { code: 'ga4_http_500', reason: error.message }
    if (error.status === 503) return { code: 'ga4_http_503', reason: error.message }
    return {
      code: 'ga4_http_error',
      reason: `GA4 Data API error ${error.status}${error.detail ? `: ${error.detail}` : ''}`,
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return { code: 'ga4_runtime_error', reason: error.message }
  }

  return { code: 'ga4_runtime_error', reason: 'Error desconocido al consultar Google Analytics 4.' }
}

function getWeekStartIso(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  const day = date.getUTCDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  date.setUTCDate(date.getUTCDate() - diffToMonday)
  return date.toISOString().slice(0, 10)
}

function monthKeyFromIso(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return isoDate.slice(0, 7)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatWeekLabel(weekStartIso: string): string {
  const weekStart = new Date(`${weekStartIso}T00:00:00.000Z`)
  if (Number.isNaN(weekStart.getTime())) return weekStartIso
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  const startLabel = weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  const endLabel = weekEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  return `${startLabel} – ${endLabel}`
}

function formatMonthLabel(monthKey: string): string {
  const parsed = new Date(`${monthKey}-01T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return monthKey
  return parsed.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
}

function aggregateTrafficSeries(
  series: TrafficSeriesPoint[],
  granularity: 'day' | 'week' | 'month',
): TrafficSeriesPoint[] {
  if (granularity === 'day') {
    return [...series].sort((a, b) => a.isoDate.localeCompare(b.isoDate))
  }

  const grouped = new Map<string, TrafficSeriesPoint>()

  for (const point of series) {
    const key = granularity === 'week' ? getWeekStartIso(point.isoDate) : monthKeyFromIso(point.isoDate)
    const existing = grouped.get(key)
    if (existing) {
      existing.Organico += point.Organico
      existing['Facebook Ads'] += point['Facebook Ads']
      existing['Google Ads'] += point['Google Ads']
      existing.Total += point.Total
      continue
    }

    grouped.set(key, {
      date: granularity === 'week' ? formatWeekLabel(key) : formatMonthLabel(key),
      isoDate: key,
      Organico: point.Organico,
      'Facebook Ads': point['Facebook Ads'],
      'Google Ads': point['Google Ads'],
      Total: point.Total,
    })
  }

  return Array.from(grouped.values()).sort((a, b) => a.isoDate.localeCompare(b.isoDate))
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
    seriesByGranularity: {
      day: aggregateTrafficSeries(series, 'day'),
      week: aggregateTrafficSeries(series, 'week'),
      month: aggregateTrafficSeries(series, 'month'),
    },
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

  const [seriesPayload, pagesPayload, sourcePayload] = await Promise.all([
    runGa4Report(endpoint, bearerToken, bodySeries),
    runGa4Report(endpoint, bearerToken, bodyPages),
    runGa4Report(endpoint, bearerToken, bodySource),
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
    seriesByGranularity: {
      day: aggregateTrafficSeries(series, 'day'),
      week: aggregateTrafficSeries(series, 'week'),
      month: aggregateTrafficSeries(series, 'month'),
    },
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

function parseSnapshotCampaigns(raw: unknown): FacebookCampaignMetrics[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((campaign) => {
      const item = campaign as Record<string, unknown>
      const status = String(item.status || 'paused').toLowerCase() === 'active' ? 'active' : 'paused'
      const id = String(item.id || '').trim()
      const name = String(item.name || 'Campaña Meta')
      if (!id) return null
      const normalized: FacebookCampaignMetrics = {
        id,
        name,
        status,
        spend: toNumber(item.spend),
        budget: toNumber(item.budget),
        impressions: toNumber(item.impressions),
        clicks: toNumber(item.clicks),
        cpc: toNumber(item.cpc),
        conversions: toNumber(item.conversions),
        roas: toNumber(item.roas),
        linked: false,
      }
      return normalized
    })
    .filter((value): value is FacebookCampaignMetrics => Boolean(value))
}

async function resolveLinkedMetaCampaignIdsFromLeads(
  drizzle: any,
  tenantId: number,
  campaignIds: string[],
): Promise<Set<string>> {
  const linked = new Set<string>()
  if (!drizzle?.execute || campaignIds.length === 0) return linked

  const normalizedIds = Array.from(
    new Set(campaignIds.map((id) => String(id || '').trim()).filter(Boolean)),
  )
  if (normalizedIds.length === 0) return linked

  const rows = asRows(
    await drizzle.execute(`
      SELECT
        to_jsonb(l)->>'meta_campaign_id' AS meta_campaign_id,
        to_jsonb(l)->>'source_page' AS source_page,
        to_jsonb(l)->'source_details' AS source_details
      FROM leads l
      WHERE l.tenant_id = ${tenantId}
    `),
  )

  for (const row of rows) {
    const explicitMetaId = String(row.meta_campaign_id || '').trim()
    if (explicitMetaId) linked.add(explicitMetaId)

    const sourcePage = String(row.source_page || '').toLowerCase()
    const sourceDetails = JSON.stringify(row.source_details || {}).toLowerCase()

    for (const campaignId of normalizedIds) {
      const token = campaignId.toLowerCase()
      if (sourcePage.includes(token) || sourceDetails.includes(token)) {
        linked.add(campaignId)
      }
    }
  }

  return linked
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
        meta_campaign_id VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await drizzle.execute(`
      ALTER TABLE traffic_events
      ADD COLUMN IF NOT EXISTS meta_campaign_id VARCHAR(64)
    `)

    await drizzle.execute(`
      CREATE TABLE IF NOT EXISTS meta_analytics_snapshots (
        id BIGSERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        range_key VARCHAR(8) NOT NULL,
        source VARCHAR(32) NOT NULL DEFAULT 'meta_api_live',
        campaigns_json JSONB NOT NULL,
        snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await drizzle.execute(`
      CREATE INDEX IF NOT EXISTS idx_meta_analytics_snapshots_lookup
      ON meta_analytics_snapshots (tenant_id, range_key, snapshot_at DESC)
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

    const trafficEventsCount = toNumber(
      asRows(
        await drizzle.execute(`
          SELECT COUNT(*)::int AS count
          FROM traffic_events
          WHERE tenant_id = ${tenantId}
            AND created_at >= NOW() - INTERVAL '${rangeDays} days'
        `),
      )[0]?.count,
    )

    const ga4MeasurementId = String(tenant.integrations_ga4_measurement_id || '').trim()
    const ga4PropertyIdRaw = String(process.env.GA4_PROPERTY_ID || '').trim()
    const ga4PropertyId = normalizeGa4PropertyId(ga4PropertyIdRaw)
    const ga4BearerToken = String(process.env.GA4_API_BEARER_TOKEN || '').trim()
    let ga4Health: Ga4Health = {
      provider: 'internal',
      status: 'fallback',
      reason_code: 'ga4_missing_measurement_id',
      reason: 'El tenant no tiene configurado GA4 Measurement ID.',
      property_id: ga4PropertyId,
      measurement_id: ga4MeasurementId || null,
      checked_at: new Date().toISOString(),
    }

    let traffic: TrafficData = await getTrafficFromInternal(drizzle, tenantId, rangeDays)

    if (!ga4MeasurementId) {
      ga4Health = {
        ...ga4Health,
        reason_code: 'ga4_missing_measurement_id',
        reason: 'El tenant no tiene configurado GA4 Measurement ID.',
      }
    } else if (!ga4PropertyIdRaw) {
      ga4Health = {
        ...ga4Health,
        reason_code: 'ga4_missing_property_id',
        reason:
          'Falta GA4_PROPERTY_ID en entorno. Define el Property ID numérico de Google Analytics 4.',
      }
    } else if (!ga4PropertyId) {
      ga4Health = {
        ...ga4Health,
        reason_code: 'ga4_invalid_property_id',
        reason:
          'GA4_PROPERTY_ID no tiene formato válido. Usa un ID numérico o properties/{ID_NUMERICO}.',
      }
    } else if (!ga4BearerToken) {
      ga4Health = {
        ...ga4Health,
        reason_code: 'ga4_missing_bearer_token',
        reason: 'Falta GA4_API_BEARER_TOKEN en entorno para consultar GA4 Data API.',
      }
    } else {
      try {
        traffic = await getTrafficFromGa4(ga4PropertyId, ga4BearerToken, rangeDays)
        ga4Health = {
          provider: 'ga4',
          status: 'connected',
          reason_code: 'ga4_connected',
          reason: null,
          property_id: ga4PropertyId,
          measurement_id: ga4MeasurementId,
          checked_at: new Date().toISOString(),
        }
      } catch (error) {
        const mapped = mapGa4FallbackReason(error)
        ga4Health = {
          provider: 'internal',
          status: 'fallback',
          reason_code: mapped.code,
          reason: mapped.reason,
          property_id: ga4PropertyId,
          measurement_id: ga4MeasurementId,
          checked_at: new Date().toISOString(),
        }
      }
    }

    if (ga4Health.status === 'fallback') {
      console.error('[analytics/dashboard] GA4 fallback activado. Motivo:', {
        reason_code: ga4Health.reason_code,
        reason: ga4Health.reason,
        tenant_id: tenantId,
        property_id: ga4Health.property_id,
      })
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

    const linkedMetaIds = new Set<string>(
      localCampaigns
        .map((c) => String(c?.meta_campaign_id || '').trim())
        .filter((id) => id.length > 0),
    )

    for (const campaign of localCampaigns) {
      const localTokens = [
        ...extractMetaCampaignIdTokens(campaign?.utm_campaign),
        ...extractMetaCampaignIdTokens(campaign?.destination_url),
      ]
      for (const token of localTokens) {
        linkedMetaIds.add(token)
      }
    }

    const adAccountId = String(tenant.integrations_meta_ad_account_id || '').trim()
    const accessToken = String(tenant.integrations_meta_marketing_api_token || '').trim()

    const snapshotRows = asRows(
      await drizzle.execute(`
        SELECT snapshot_at, campaigns_json
        FROM meta_analytics_snapshots
        WHERE tenant_id = ${tenantId}
          AND range_key = '${range}'
        ORDER BY snapshot_at DESC
        LIMIT 1
      `),
    )

    const snapshotRow = snapshotRows[0] ?? null
    const snapshotCampaigns = parseSnapshotCampaigns(snapshotRow?.campaigns_json)
    const snapshotAt = snapshotRow?.snapshot_at ? new Date(String(snapshotRow.snapshot_at)) : null
    const isSnapshotFresh =
      snapshotAt !== null &&
      !Number.isNaN(snapshotAt.getTime()) &&
      Date.now() - snapshotAt.getTime() <= SNAPSHOT_STALE_MINUTES * 60 * 1000

    let detectedCampaigns: Array<{ id: string }> = []
    let facebookCampaigns: FacebookCampaignMetrics[] = []
    let facebookSource: 'meta_api' | 'unavailable' = 'unavailable'
    let facebookDataSource: FacebookDataSource = 'unavailable'

    if (snapshotCampaigns.length > 0 && isSnapshotFresh) {
      facebookCampaigns = snapshotCampaigns.map((campaign) => ({
        ...campaign,
        linked: linkedMetaIds.has(campaign.id),
      }))
      detectedCampaigns = facebookCampaigns.map((campaign) => ({ id: campaign.id }))
      facebookSource = 'meta_api'
      facebookDataSource = 'snapshot'
    } else if (adAccountId && accessToken) {
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
        facebookDataSource = 'meta_api_live'

        facebookCampaigns = await Promise.all(
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
              spend,
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

        try {
          const snapshotPayload = facebookCampaigns.map((campaign) => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: campaign.spend,
            budget: campaign.budget,
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            cpc: campaign.cpc,
            conversions: campaign.conversions,
            roas: campaign.roas,
          }))
          const snapshotJson = JSON.stringify(snapshotPayload).replace(/'/g, "''")

          await drizzle.execute(`
            INSERT INTO meta_analytics_snapshots (tenant_id, range_key, source, campaigns_json, snapshot_at)
            VALUES (${tenantId}, '${range}', 'meta_api_live', '${snapshotJson}'::jsonb, NOW())
          `)
        } catch {
          // Snapshot persistence is best-effort.
        }
      }
    }

    if (facebookCampaigns.length === 0 && snapshotCampaigns.length > 0) {
      facebookCampaigns = snapshotCampaigns.map((campaign) => ({
        ...campaign,
        linked: linkedMetaIds.has(campaign.id),
      }))
      detectedCampaigns = facebookCampaigns.map((campaign) => ({ id: campaign.id }))
      facebookDataSource = 'snapshot'
    }

    const detectedCampaignIds = facebookCampaigns.map((campaign) => campaign.id)
    const linkedFromLeads = await resolveLinkedMetaCampaignIdsFromLeads(drizzle, tenantId, detectedCampaignIds)
    for (const campaignId of linkedFromLeads) {
      linkedMetaIds.add(campaignId)
    }

    facebookCampaigns = facebookCampaigns.map((campaign) => ({
      ...campaign,
      linked: linkedMetaIds.has(campaign.id),
    }))

    const detectedIds = new Set(detectedCampaigns.map((c: any) => String(c?.id || '')))
    const activeFacebookCampaigns = facebookCampaigns.filter((campaign) => campaign.status === 'active')

    const totalFacebookSpend = activeFacebookCampaigns.reduce((sum, item) => sum + item.spend, 0)
    const totalFacebookImpressions = activeFacebookCampaigns.reduce((sum, item) => sum + item.impressions, 0)
    const totalFacebookClicks = activeFacebookCampaigns.reduce((sum, item) => sum + item.clicks, 0)
    const totalFacebookConversions = activeFacebookCampaigns.reduce((sum, item) => sum + item.conversions, 0)
    const totalRoasWeight = activeFacebookCampaigns.reduce((sum, item) => sum + item.roas * (item.spend || 0), 0)
    const avgRoas = totalFacebookSpend > 0 ? totalRoasWeight / totalFacebookSpend : 0

    const linkedDetected = Array.from(linkedMetaIds).filter((id) => detectedIds.has(id)).length

    const facebookTrafficRows = asRows(
      await drizzle.execute(`
        SELECT
          COALESCE(NULLIF(meta_campaign_id, ''), NULLIF(utm_campaign, ''), '(sin utm_campaign)') AS utm_campaign,
          SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END)::int AS page_views,
          SUM(CASE WHEN event_type = 'form_click' THEN 1 ELSE 0 END)::int AS form_clicks,
          SUM(CASE WHEN event_type IN ('form_submit', 'lead') THEN 1 ELSE 0 END)::int AS form_submits
        FROM traffic_events
        WHERE tenant_id = ${tenantId}
          AND created_at >= NOW() - INTERVAL '${rangeDays} days'
          AND (
            COALESCE(meta_campaign_id, '') <> ''
            OR
            LOWER(COALESCE(utm_source, '')) LIKE 'facebook%'
            OR LOWER(COALESCE(utm_source, '')) LIKE 'instagram%'
            OR LOWER(COALESCE(utm_medium, '')) LIKE '%meta%'
            OR LOWER(COALESCE(utm_medium, '')) LIKE '%facebook%'
          )
        GROUP BY 1
        ORDER BY page_views DESC
        LIMIT 30
      `),
    )

    const facebookTrafficByCampaign = facebookTrafficRows.map((row) => ({
      campaign: String(row.utm_campaign || '(sin utm_campaign)'),
      page_views: toNumber(row.page_views),
      form_clicks: toNumber(row.form_clicks),
      form_submits: toNumber(row.form_submits),
    }))

    const facebookTrafficTotals = facebookTrafficByCampaign.reduce(
      (acc, row) => {
        acc.page_views += row.page_views
        acc.form_clicks += row.form_clicks
        acc.form_submits += row.form_submits
        return acc
      },
      { page_views: 0, form_clicks: 0, form_submits: 0 },
    )

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      range,
      source_health: {
        traffic: traffic.source,
        traffic_provider: ga4Health.provider === 'ga4' ? 'google_analytics_4' : 'internal_fallback',
        traffic_reason_code: ga4Health.reason_code,
        traffic_reason: ga4Health.reason,
        ga4: ga4Health,
        traffic_events_count: trafficEventsCount,
        facebook: facebookSource,
        facebook_data_source: facebookDataSource,
      },
      overview: {
        total_sessions: traffic.totalSessions,
        total_ad_spend: totalFacebookSpend,
        total_conversions: totalFacebookConversions,
        global_roas: avgRoas,
      },
      traffic: {
        series: traffic.series,
        series_by_granularity: traffic.seriesByGranularity,
        top_pages: traffic.topPages,
        source_medium: traffic.sourceMedium,
        empty_reason:
          traffic.totalSessions === 0
            ? ga4Health.status === 'fallback' && ga4Health.reason
              ? `GA4 no disponible (${ga4Health.reason}). No se detectaron eventos internos para el rango seleccionado.`
              : 'No se detectaron eventos de tráfico web para el tenant y rango seleccionados.'
            : null,
      },
      facebook: {
        spend: totalFacebookSpend,
        impressions: totalFacebookImpressions,
        clicks: totalFacebookClicks,
        ctr: totalFacebookImpressions > 0 ? (totalFacebookClicks / totalFacebookImpressions) * 100 : 0,
        conversions: totalFacebookConversions,
        roas: avgRoas,
        campaigns: facebookCampaigns,
        active_campaigns: activeFacebookCampaigns.length,
        traffic_funnel: {
          page_views: facebookTrafficTotals.page_views,
          form_clicks: facebookTrafficTotals.form_clicks,
          form_submits: facebookTrafficTotals.form_submits,
          by_campaign: facebookTrafficByCampaign,
        },
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
      integrations_status: {
        ga4: {
          status: ga4Health.status === 'connected' ? 'connected' : 'error',
          provider: ga4Health.provider === 'ga4' ? 'google_analytics_4' : 'internal_fallback',
          reason_code: ga4Health.reason_code,
          reason: ga4Health.reason,
          checked_at: ga4Health.checked_at,
        },
        meta_ads: {
          status: facebookSource === 'meta_api' ? 'connected' : 'error',
          provider: facebookDataSource,
        },
        google_ads: {
          status: 'pending_connection',
        },
      },
    })
  } catch (error) {
    console.error('[analytics/dashboard] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

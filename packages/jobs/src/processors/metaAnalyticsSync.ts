import postgres from 'postgres'
import type { TenantJob } from '../index'
import type { TenantJobHandler } from '../workers'

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0'
const META_GRAPH_API = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`
const SOLARIA_PREFIX = 'SOLARIA AGENCY'
const MIN_CAMPAIGN_YEAR = 2026

export type MetaAnalyticsRange = '7d' | '30d' | '90d'

export type MetaAnalyticsSyncPayload = {
  ranges?: MetaAnalyticsRange[]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
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

async function metaGet(
  path: string,
  params: Record<string, string>,
  accessToken: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = new URL(`${META_GRAPH_API}${path}`)
    url.searchParams.set('access_token', accessToken)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

    const res = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok || data.error) {
      const msg = data.error?.message ?? JSON.stringify(data)
      return { success: false, error: msg }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function fetchCampaignInsights(
  campaignId: string,
  accessToken: string,
  range: MetaAnalyticsRange,
): Promise<any | null> {
  const now = new Date()
  const since = new Date(now)
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  since.setUTCDate(since.getUTCDate() - days)

  const response = await metaGet(
    `/${campaignId}/insights`,
    {
      fields: 'impressions,clicks,spend,cpc,cpm,actions,cost_per_action_type,purchase_roas',
      time_range: JSON.stringify({
        since: since.toISOString().slice(0, 10),
        until: now.toISOString().slice(0, 10),
      }),
    },
    accessToken,
  )

  if (!response.success) return null
  return Array.isArray(response.data?.data) ? response.data.data[0] ?? null : null
}

export const processMetaAnalyticsSync: TenantJobHandler<MetaAnalyticsSyncPayload> = async (
  job: TenantJob<MetaAnalyticsSyncPayload>,
) => {
  const dbUrl = process.env.DATABASE_URL ?? process.env.DATABASE_URI
  if (!dbUrl) {
    throw new Error('Meta analytics sync requires DATABASE_URL or DATABASE_URI')
  }

  const tenantId = Number(String(job.tenantId))
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    throw new Error(`Invalid tenantId for meta analytics sync: ${String(job.tenantId)}`)
  }

  const sql = postgres(dbUrl, { max: 1 })

  try {
    const ranges = (job.payload?.ranges?.length ? job.payload.ranges : ['7d', '30d', '90d']) as MetaAnalyticsRange[]

    await sql`
      CREATE TABLE IF NOT EXISTS meta_analytics_snapshots (
        id BIGSERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        range_key VARCHAR(8) NOT NULL,
        source VARCHAR(32) NOT NULL DEFAULT 'meta_api_live',
        campaigns_json JSONB NOT NULL,
        snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_meta_analytics_snapshots_lookup
      ON meta_analytics_snapshots (tenant_id, range_key, snapshot_at DESC)
    `

    const tenantRows = await sql`
      SELECT integrations_meta_ad_account_id, integrations_meta_marketing_api_token
      FROM tenants
      WHERE id = ${tenantId}
      LIMIT 1
    `
    const tenant = tenantRows[0]
    if (!tenant) {
      throw new Error(`Tenant not found: ${String(tenantId)}`)
    }

    const adAccountId = String(tenant.integrations_meta_ad_account_id || '').trim()
    const accessToken = String(tenant.integrations_meta_marketing_api_token || '').trim()

    if (!adAccountId || !accessToken) {
      throw new Error(`Tenant ${String(tenantId)} missing Meta credentials`)
    }

    const list = await metaGet(
      `/act_${adAccountId}/campaigns`,
      {
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,updated_time',
        limit: '50',
        filtering: JSON.stringify([{ field: 'name', operator: 'CONTAIN', value: 'SOLARIA AGENCY' }]),
      },
      accessToken,
    )

    if (!list.success) {
      throw new Error(`Meta listCampaigns failed: ${list.error ?? 'unknown error'}`)
    }

    const campaignRows = Array.isArray(list.data?.data) ? list.data.data : []
    const detectedCampaigns = campaignRows.filter((item: any) => {
      const hasPrefix = String(item?.name || '').toUpperCase().startsWith(SOLARIA_PREFIX)
      if (!hasPrefix) return false
      const campaignYear = parseCampaignYear(item)
      return campaignYear !== null && campaignYear >= MIN_CAMPAIGN_YEAR
    })

    for (const range of ranges) {
      const campaigns = await Promise.all(
        detectedCampaigns.slice(0, 25).map(async (campaign: any) => {
          const campaignId = String(campaign?.id || '')
          const insightRow = await fetchCampaignInsights(campaignId, accessToken, range)

          const impressions = toNumber(insightRow?.impressions)
          const clicks = toNumber(insightRow?.clicks)
          const spend = toNumber(insightRow?.spend)
          const conversions = parseConversionsFromInsights(insightRow)
          const roas = toNumber(insightRow?.purchase_roas?.[0]?.value)
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
          }
        }),
      )

      await sql`
        INSERT INTO meta_analytics_snapshots (tenant_id, range_key, source, campaigns_json, snapshot_at)
        VALUES (${tenantId}, ${range}, 'meta_api_live', ${sql.json(campaigns)}, NOW())
      `
    }
  } finally {
    await sql.end()
  }
}

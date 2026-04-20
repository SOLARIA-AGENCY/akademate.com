import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { normalizeMetaAdAccountId, resolveMetaRequestContext } from '../../_lib/integrations'
import {
  buildAdsManagerUrl,
  buildInsightsSummary,
  checkMetaHealth,
  fetchCampaignAdSets,
  fetchCampaignAds,
  fetchCampaignById,
  fetchCampaignInsights,
  parseBudget,
  resolveInsightsRange,
} from '../../_lib/meta-graph'

type UiCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

function normalizeStatus(statusRaw: string): UiCampaignStatus {
  const status = statusRaw.trim().toUpperCase()

  if (
    status === 'ACTIVE' ||
    status === 'IN_PROCESS' ||
    status === 'WITH_ISSUES' ||
    status === 'PENDING_REVIEW'
  ) {
    return 'active'
  }

  if (status === 'PAUSED' || status === 'CAMPAIGN_PAUSED') {
    return 'paused'
  }

  if (status === 'ARCHIVED' || status === 'DELETED') {
    return 'archived'
  }

  if (status === 'COMPLETED') {
    return 'completed'
  }

  return 'draft'
}

function sanitizeCampaignId(raw: string): string {
  return decodeURIComponent(raw || '').trim()
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

function escapeSqlLike(value: string): string {
  return escapeSql(value).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function enumerateDateRange(since: string, until: string): string[] {
  const start = new Date(`${since}T00:00:00.000Z`)
  const end = new Date(`${until}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const days: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function asRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>
  const typed = result as { rows?: Array<Record<string, unknown>> }
  return Array.isArray(typed?.rows) ? typed.rows : []
}

async function buildCampaignFunnel(input: {
  payload: any
  tenantId: string
  campaignId: string
  campaignName: string
  since: string
  until: string
  totalSpend: number
}) {
  const warnings: string[] = []
  const days = enumerateDateRange(input.since, input.until)
  const series = days.map((day) => ({
    date: day,
    label: day,
    form_page_views: 0,
    form_submissions: 0,
    crm_leads: 0,
  }))
  const byDay = new Map(series.map((point) => [point.date, point]))

  const fallback = {
    series,
    totals: {
      form_page_views: 0,
      form_submissions: 0,
      crm_leads: 0,
    },
    conversion: {
      view_to_submit_pct: 0,
      view_to_lead_pct: 0,
    },
    cpl: {
      using: 'crm_leads' as const,
      value: null as number | null,
    },
    source_map: {
      spend: 'meta_insights',
      form_page_views: 'traffic_events',
      form_submissions: 'traffic_events',
      crm_leads: 'leads',
    },
  }

  const drizzle = (input.payload as any).db?.drizzle || (input.payload as any).db?.pool
  if (!drizzle?.execute || days.length === 0) {
    warnings.push('No se pudo calcular el embudo: fuente de base de datos no disponible.')
    return { funnel: fallback, warnings }
  }

  const campaignIdToken = escapeSqlLike(input.campaignId.toLowerCase())
  const campaignNameToken = escapeSqlLike((input.campaignName || '').toLowerCase())

  const trafficColumnSet = new Set<string>()
  try {
    const trafficColumnRows = asRows(
      await drizzle.execute(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'traffic_events'
          AND column_name IN ('meta_campaign_id', 'utm_campaign', 'path', 'referrer')
      `),
    )
    for (const row of trafficColumnRows) {
      const columnName = String(row.column_name || '')
      if (columnName) trafficColumnSet.add(columnName)
    }
  } catch {
    warnings.push('No se pudo validar el esquema de tracking web para la campaña.')
  }

  const trafficMatchers: string[] = []
  if (trafficColumnSet.has('meta_campaign_id')) {
    trafficMatchers.push(`COALESCE(meta_campaign_id, '') = '${escapeSql(input.campaignId)}'`)
  }
  if (trafficColumnSet.has('utm_campaign')) {
    trafficMatchers.push(`LOWER(COALESCE(utm_campaign, '')) LIKE '%${campaignIdToken}%' ESCAPE '\\'`)
    if (campaignNameToken) {
      trafficMatchers.push(`LOWER(COALESCE(utm_campaign, '')) LIKE '%${campaignNameToken}%' ESCAPE '\\'`)
    }
  }
  if (trafficColumnSet.has('path')) {
    trafficMatchers.push(`LOWER(COALESCE(path, '')) LIKE '%${campaignIdToken}%' ESCAPE '\\'`)
  }
  if (trafficColumnSet.has('referrer')) {
    trafficMatchers.push(`LOWER(COALESCE(referrer, '')) LIKE '%${campaignIdToken}%' ESCAPE '\\'`)
  }

  const trafficMatchSql = trafficMatchers.join(' OR ')
  const tenantIdSql = escapeSql(input.tenantId)

  try {
    if (trafficMatchers.length === 0) {
      warnings.push('No hay columnas de atribución disponibles en traffic_events para esta campaña.')
    } else {
      const trafficRows = asRows(
        await drizzle.execute(`
          SELECT
            DATE(created_at) AS day,
            SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END)::int AS form_page_views,
            SUM(CASE WHEN event_type IN ('form_submit', 'lead') THEN 1 ELSE 0 END)::int AS form_submissions
          FROM traffic_events
          WHERE tenant_id::text = '${tenantIdSql}'
            AND created_at >= '${input.since}'::date
            AND created_at < ('${input.until}'::date + INTERVAL '1 day')
            AND (${trafficMatchSql})
          GROUP BY 1
          ORDER BY 1
        `),
      )

      for (const row of trafficRows) {
        const day = String(row.day || '').slice(0, 10)
        const current = byDay.get(day)
        if (!current) continue
        current.form_page_views = toNumber(row.form_page_views)
        current.form_submissions = toNumber(row.form_submissions)
      }
    }
  } catch {
    warnings.push('No hay eventos web suficientes para calcular vistas/envíos del formulario.')
  }

  try {
    const leadColumns = new Set(
      asRows(
        await drizzle.execute(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'leads'
            AND column_name IN ('meta_campaign_id', 'utm_campaign', 'source_details', 'is_test')
        `),
      ).map((row) => String(row.column_name || '')),
    )

    const leadMatchers: string[] = []
    if (leadColumns.has('meta_campaign_id')) {
      leadMatchers.push(`COALESCE(meta_campaign_id, '') = '${escapeSql(input.campaignId)}'`)
    }
    if (leadColumns.has('utm_campaign')) {
      leadMatchers.push(`LOWER(COALESCE(utm_campaign, '')) LIKE '%${campaignIdToken}%' ESCAPE '\\'`)
      if (campaignNameToken) {
        leadMatchers.push(`LOWER(COALESCE(utm_campaign, '')) LIKE '%${campaignNameToken}%' ESCAPE '\\'`)
      }
    }
    if (leadColumns.has('source_details')) {
      leadMatchers.push(`LOWER(COALESCE(source_details::text, '')) LIKE '%${campaignIdToken}%' ESCAPE '\\'`)
    }

    if (leadMatchers.length > 0) {
      const nonTestFilter = leadColumns.has('is_test') ? `AND COALESCE(is_test, false) = false` : ''
      const leadRows = asRows(
        await drizzle.execute(`
          SELECT DATE(created_at) AS day, COUNT(*)::int AS crm_leads
          FROM leads
          WHERE tenant_id::text = '${tenantIdSql}'
            AND created_at >= '${input.since}'::date
            AND created_at < ('${input.until}'::date + INTERVAL '1 day')
            ${nonTestFilter}
            AND (${leadMatchers.join(' OR ')})
          GROUP BY 1
          ORDER BY 1
        `),
      )

      for (const row of leadRows) {
        const day = String(row.day || '').slice(0, 10)
        const current = byDay.get(day)
        if (!current) continue
        current.crm_leads = toNumber(row.crm_leads)
      }
    }
  } catch {
    warnings.push('No se pudieron reconciliar leads CRM para esta campaña.')
  }

  const totals = series.reduce(
    (acc, item) => {
      acc.form_page_views += item.form_page_views
      acc.form_submissions += item.form_submissions
      acc.crm_leads += item.crm_leads
      return acc
    },
    { form_page_views: 0, form_submissions: 0, crm_leads: 0 },
  )

  const viewToSubmit = totals.form_page_views > 0 ? (totals.form_submissions / totals.form_page_views) * 100 : 0
  const viewToLead = totals.form_page_views > 0 ? (totals.crm_leads / totals.form_page_views) * 100 : 0
  const cplBase = totals.crm_leads > 0 ? totals.crm_leads : totals.form_submissions > 0 ? totals.form_submissions : 0

  return {
    funnel: {
      ...fallback,
      series,
      totals,
      conversion: {
        view_to_submit_pct: Number(viewToSubmit.toFixed(2)),
        view_to_lead_pct: Number(viewToLead.toFixed(2)),
      },
      cpl: {
        using: totals.crm_leads > 0 ? 'crm_leads' : totals.form_submissions > 0 ? 'form_submissions' : 'crm_leads',
        value: cplBase > 0 ? Number((input.totalSpend / cplBase).toFixed(2)) : null,
      },
    },
    warnings,
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  const generatedAt = new Date().toISOString()
  const requestId = crypto.randomUUID()
  const params = await context.params
  const campaignId = sanitizeCampaignId(params.campaignId)

  if (!campaignId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISCONFIGURED', message: 'campaignId es requerido' },
      },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const tenantContext = await resolveMetaRequestContext(request, searchParams.get('tenantId'))

  if (!tenantContext.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Sesión no autenticada' },
      },
      { status: 401 }
    )
  }

  if (!tenantContext.tenantId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISCONFIGURED', message: 'No se pudo resolver el tenant actual.' },
      },
      { status: 400 }
    )
  }

  if (tenantContext.source === 'env') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISCONFIGURED',
          message: 'La integración Meta debe configurarse por tenant; no se permite fallback global.',
        },
      },
      { status: 400 },
    )
  }

  const requestedAdAccount = normalizeMetaAdAccountId(searchParams.get('adAccount') || '')
  const effectiveAdAccountId = requestedAdAccount || tenantContext.meta.adAccountIdNormalized
  if (!effectiveAdAccountId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISCONFIGURED', message: 'No hay cuenta publicitaria Meta configurada para este tenant.' },
      },
      { status: 400 },
    )
  }

  const health = await checkMetaHealth({
    adAccountId: effectiveAdAccountId,
    accessToken: tenantContext.meta.marketingApiToken,
    requireAdsManagement: false,
  })

  if (health.status !== 'ok') {
    return NextResponse.json({
      success: false,
      source_health: health,
      diagnostics: {
        warnings: [],
        errors: health.error ? [health.error.message] : [],
      },
      error: health.error,
      generated_at: generatedAt,
    })
  }

  const { range, warnings: rangeWarnings } = resolveInsightsRange(searchParams)

  const campaignResult = await fetchCampaignById({
    campaignId,
    adAccountId: effectiveAdAccountId,
    accessToken: tenantContext.meta.marketingApiToken,
    requestId,
  })

  if (!campaignResult.ok || !campaignResult.data) {
    const error = campaignResult.error ?? {
      code: 'META_API_ERROR',
      message: 'No se pudo recuperar la campaña solicitada',
    }

    return NextResponse.json(
      {
        success: false,
        source_health: {
          ...health,
          status: 'degraded',
          error,
        },
        diagnostics: {
          warnings: rangeWarnings,
          errors: [error.message],
        },
        error,
        generated_at: generatedAt,
      },
      { status: 404 }
    )
  }

  const campaign = campaignResult.data

  if (!/SOLARIA AGENCY/i.test(campaign.name || '')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AD_ACCOUNT_ACCESS_DENIED',
          message: 'La campaña no pertenece al alcance SOLARIA permitido.',
        },
      },
      { status: 404 }
    )
  }

  const [insightsResult, adSetsResult, adsResult] = await Promise.all([
    fetchCampaignInsights({
      campaignId,
      adAccountId: effectiveAdAccountId,
      accessToken: tenantContext.meta.marketingApiToken,
      range,
      requestId,
    }),
    fetchCampaignAdSets({
      campaignId,
      adAccountId: effectiveAdAccountId,
      accessToken: tenantContext.meta.marketingApiToken,
      requestId,
    }),
    fetchCampaignAds({
      campaignId,
      adAccountId: effectiveAdAccountId,
      accessToken: tenantContext.meta.marketingApiToken,
      requestId,
    }),
  ])

  const diagnosticsErrors: string[] = []
  if (!insightsResult.ok && insightsResult.error) diagnosticsErrors.push(insightsResult.error.message)
  if (!adSetsResult.ok && adSetsResult.error) diagnosticsErrors.push(adSetsResult.error.message)
  if (!adsResult.ok && adsResult.error) diagnosticsErrors.push(adsResult.error.message)

  const effectiveStatus = (campaign.effective_status || campaign.status || 'DRAFT').trim()
  const metaStatus = (campaign.status || campaign.effective_status || 'DRAFT').trim()

  const adsets = (adSetsResult.ok ? adSetsResult.data?.data ?? [] : []).map((item) => ({
    id: item.id,
    name: item.name || `Ad Set ${item.id}`,
    status: item.status || 'UNKNOWN',
    effective_status: item.effective_status || item.status || 'UNKNOWN',
    optimization_goal: item.optimization_goal || null,
    billing_event: item.billing_event || null,
    budget: parseBudget(item.daily_budget, item.lifetime_budget),
    start_time: item.start_time ?? null,
    end_time: item.end_time ?? null,
    updated_time: item.updated_time ?? null,
  }))

  const ads = (adsResult.ok ? adsResult.data?.data ?? [] : []).map((item) => ({
    id: item.id,
    name: item.name || `Ad ${item.id}`,
    status: item.status || 'UNKNOWN',
    effective_status: item.effective_status || item.status || 'UNKNOWN',
    adset_id: item.adset_id || null,
    updated_time: item.updated_time ?? null,
    creative: {
      id: item.creative?.id || null,
      name: item.creative?.name || null,
      thumbnail_url: item.creative?.thumbnail_url || null,
      image_url: item.creative?.image_url || null,
      video_id: item.creative?.video_id || null,
      preview_state:
        item.creative?.thumbnail_url || item.creative?.image_url || item.creative?.video_id
          ? 'loaded'
          : 'not_available',
    },
  }))

  const creatives = Array.from(
    new Map(
      ads
        .filter((ad) => ad.creative.id)
        .map((ad) => [
          ad.creative.id,
          {
            id: ad.creative.id,
            name: ad.creative.name,
            thumbnail_url: ad.creative.thumbnail_url,
            image_url: ad.creative.image_url,
            video_id: ad.creative.video_id,
            preview_state: ad.creative.preview_state,
          },
        ])
    ).values()
  )

  const insightsSummary = buildInsightsSummary(
    range,
    insightsResult.ok ? insightsResult.data?.data?.[0] ?? null : null,
    insightsResult.ok ? null : insightsResult.error
  )

  const payload = await getPayloadHMR({ config: configPromise })
  const { funnel, warnings: funnelWarnings } = await buildCampaignFunnel({
    payload,
    tenantId: tenantContext.tenantId,
    campaignId,
    campaignName: campaign.name || '',
    since: range.since,
    until: range.until,
    totalSpend: insightsSummary.spend.value ?? 0,
  })

  const hasPartialErrors = diagnosticsErrors.length > 0

  return NextResponse.json({
    success: true,
    campaign: {
      id: campaign.id,
      meta_campaign_id: campaign.id,
      name: campaign.name || `Campaña ${campaign.id}`,
      status: normalizeStatus(metaStatus),
      meta_status: metaStatus,
      effective_status: effectiveStatus,
      objective: campaign.objective || 'OUTCOME_LEADS',
      campaign_type: 'meta_ads',
      budget: parseBudget(campaign.daily_budget, campaign.lifetime_budget),
      created_time: campaign.created_time ?? null,
      updated_time: campaign.updated_time ?? null,
      start_time: campaign.start_time ?? null,
      stop_time: campaign.stop_time ?? null,
      ads_manager_url: buildAdsManagerUrl(effectiveAdAccountId, campaign.id),
    },
    insights_summary: insightsSummary,
    funnel,
    adsets,
    ads,
    creatives,
    source_health: hasPartialErrors
      ? {
          ...health,
          status: 'degraded',
        }
      : health,
    sync_status: {
      last_synced_at: generatedAt,
      stale: false,
      source: 'meta_live',
    },
    diagnostics: {
      warnings: [...rangeWarnings, ...funnelWarnings],
      errors: diagnosticsErrors,
      request_id: requestId,
    },
    generated_at: generatedAt,
  })
}

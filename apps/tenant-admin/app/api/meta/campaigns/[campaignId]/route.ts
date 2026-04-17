import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
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
      warnings: rangeWarnings,
      errors: diagnosticsErrors,
      request_id: requestId,
    },
    generated_at: generatedAt,
  })
}

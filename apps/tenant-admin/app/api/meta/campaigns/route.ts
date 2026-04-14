import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveMetaRequestContext } from '../_lib/integrations'
import { checkMetaHealth, fetchSolariaCampaigns } from '../_lib/meta-graph'

type UiCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

interface UiCampaign {
  id: string
  meta_campaign_id: string
  name: string
  status: UiCampaignStatus
  meta_status: string
  objective: string
  campaign_type: 'meta_ads'
  total_leads: number
  total_conversions: number
  budget: number
  cost_per_lead: number | null
  created_time: string | null
  start_time: string | null
  stop_time: string | null
  ads_manager_url: string
}

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

function parseBudget(dailyBudget?: string, lifetimeBudget?: string): number {
  const centsCandidate = dailyBudget || lifetimeBudget || ''
  const cents = Number(centsCandidate)
  if (!Number.isFinite(cents) || cents <= 0) return 0
  return cents / 100
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const context = await resolveMetaRequestContext(request, searchParams.get('tenantId'))

  if (!context.authenticated) {
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        error: { code: 'UNAUTHORIZED', message: 'Sesión no autenticada' },
      },
      { status: 401 }
    )
  }

  if (!context.tenantId) {
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        error: { code: 'MISCONFIGURED', message: 'No se pudo resolver el tenant actual.' },
      },
      { status: 400 }
    )
  }

  const health = await checkMetaHealth({
    adAccountId: context.meta.adAccountIdNormalized,
    accessToken: context.meta.marketingApiToken,
    requireAdsManagement: false,
  })

  if (health.status !== 'ok') {
    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      source_health: health,
      error: health.error,
      generated_at: new Date().toISOString(),
    })
  }

  const campaignsResult = await fetchSolariaCampaigns({
    adAccountId: context.meta.adAccountIdNormalized,
    accessToken: context.meta.marketingApiToken,
  })

  if (!campaignsResult.ok) {
    const error = campaignsResult.error ?? {
      code: 'META_API_ERROR',
      message: 'No se pudieron recuperar campañas de Meta',
    }

    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      source_health: {
        ...health,
        status: 'degraded',
        error,
      },
      error,
      generated_at: new Date().toISOString(),
    })
  }

  const docs: UiCampaign[] = (campaignsResult.data?.data ?? []).map((campaign) => {
    const rawStatus = campaign.status || campaign.effective_status || 'DRAFT'
    return {
      id: campaign.id,
      meta_campaign_id: campaign.id,
      name: campaign.name || `Campaña ${campaign.id}`,
      status: normalizeStatus(rawStatus),
      meta_status: rawStatus,
      objective: campaign.objective || 'OUTCOME_LEADS',
      campaign_type: 'meta_ads',
      total_leads: 0,
      total_conversions: 0,
      budget: parseBudget(campaign.daily_budget, campaign.lifetime_budget),
      cost_per_lead: null,
      created_time: campaign.created_time ?? null,
      start_time: campaign.start_time ?? null,
      stop_time: campaign.stop_time ?? null,
      ads_manager_url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${context.meta.adAccountIdNormalized}&campaign_ids=${campaign.id}`,
    }
  })

  return NextResponse.json({
    docs,
    totalDocs: docs.length,
    source_health: health,
    generated_at: new Date().toISOString(),
  })
}

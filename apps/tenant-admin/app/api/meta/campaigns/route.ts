import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { normalizeMetaAdAccountId, resolveMetaRequestContext } from '../_lib/integrations'
import {
  buildAdsManagerUrl,
  buildInsightsSummary,
  checkMetaHealth,
  fetchCampaignAds,
  fetchCampaignInsights,
  fetchSolariaCampaigns,
  getPrimaryPreviewFromAds,
  parseBudget,
  resolveInsightsRange,
  type MetaInsightsSummary,
  type MetaMetricState,
} from '../_lib/meta-graph'

type UiCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

type SortField = 'updated_time' | 'created_time' | 'start_time' | 'stop_time' | 'spend' | 'results'
type SortOrder = 'asc' | 'desc'

type PreviewState = 'loaded' | 'not_available'

interface CampaignListItem {
  campaign: {
    id: string
    meta_campaign_id: string
    name: string
    status: UiCampaignStatus
    meta_status: string
    effective_status: string
    objective: string
    campaign_type: 'meta_ads'
    budget: number | null
    created_time: string | null
    updated_time: string | null
    start_time: string | null
    stop_time: string | null
    ads_manager_url: string
  }
  insights_summary: MetaInsightsSummary
  preview: {
    thumbnail_url: string | null
    image_url: string | null
    preview_state: PreviewState
  }
  sync_status: {
    last_synced_at: string
    stale: boolean
    source: 'meta_live' | 'cache_stale'
  }
  diagnostics: {
    warnings: string[]
    errors: string[]
  }
}

interface CampaignsApiResponse {
  docs: CampaignListItem[]
  totalDocs: number
  page: number
  limit: number
  sort: SortField
  order: SortOrder
  stale: boolean
  source_health?: Awaited<ReturnType<typeof checkMetaHealth>>
  diagnostics: {
    warnings: string[]
    errors: string[]
  }
  error?: {
    code: string
    message: string
    token_expires_at?: string | null
  }
  generated_at: string
}

interface CacheEntry {
  expiresAt: number
  payload: CampaignsApiResponse
}

const CACHE_TTL_MS = 180_000
const LIST_CACHE = new Map<string, CacheEntry>()

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

function parseSort(raw: string | null): SortField {
  if (
    raw === 'updated_time' ||
    raw === 'created_time' ||
    raw === 'start_time' ||
    raw === 'stop_time' ||
    raw === 'spend' ||
    raw === 'results'
  ) {
    return raw
  }
  return 'updated_time'
}

function parseOrder(raw: string | null): SortOrder {
  return raw === 'asc' ? 'asc' : 'desc'
}

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback
  return Math.min(Math.floor(numeric), max)
}

function parseDateValue(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = new Date(value).getTime()
  if (Number.isNaN(parsed)) return null
  return parsed
}

function metricSortableValue(value: number | null, state: MetaMetricState): number | null {
  if (value === null) return null
  if (state === 'not_available' || state === 'api_error') return null
  return value
}

function statusMatchesFilter(item: CampaignListItem, statusFilter: Set<string>): boolean {
  if (statusFilter.size === 0) return true

  const candidates = [
    item.campaign.status,
    item.campaign.meta_status.toLowerCase(),
    item.campaign.effective_status.toLowerCase(),
  ]

  return candidates.some((candidate) => statusFilter.has(candidate))
}

function bySortField(sort: SortField, order: SortOrder) {
  const direction = order === 'asc' ? 1 : -1

  return (left: CampaignListItem, right: CampaignListItem): number => {
    let leftValue: number | null
    let rightValue: number | null

    if (sort === 'spend') {
      leftValue = metricSortableValue(left.insights_summary.spend.value, left.insights_summary.spend.state)
      rightValue = metricSortableValue(right.insights_summary.spend.value, right.insights_summary.spend.state)
    } else if (sort === 'results') {
      leftValue = metricSortableValue(left.insights_summary.results.value, left.insights_summary.results.state)
      rightValue = metricSortableValue(right.insights_summary.results.value, right.insights_summary.results.state)
    } else {
      leftValue = parseDateValue(left.campaign[sort])
      rightValue = parseDateValue(right.campaign[sort])
    }

    if (leftValue === null && rightValue === null) {
      return left.campaign.name.localeCompare(right.campaign.name)
    }

    if (leftValue === null) return 1
    if (rightValue === null) return -1

    if (leftValue === rightValue) {
      return left.campaign.name.localeCompare(right.campaign.name)
    }

    return leftValue > rightValue ? direction : -direction
  }
}

function buildCacheKey(input: {
  tenantId: string
  adAccountId: string
  rangeKey: string
  sort: SortField
  order: SortOrder
  status: string
  q: string
  page: number
  limit: number
}): string {
  return [
    'meta-campaigns-live',
    input.tenantId,
    input.adAccountId,
    input.rangeKey,
    input.sort,
    input.order,
    input.status,
    input.q,
    String(input.page),
    String(input.limit),
  ].join('|')
}

function readCache(cacheKey: string): CacheEntry | null {
  const entry = LIST_CACHE.get(cacheKey)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    LIST_CACHE.delete(cacheKey)
    return null
  }
  return entry
}

function writeCache(cacheKey: string, payload: CampaignsApiResponse): void {
  LIST_CACHE.set(cacheKey, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

export async function GET(request: NextRequest) {
  const generatedAt = new Date().toISOString()
  const { searchParams } = new URL(request.url)
  const requestId = crypto.randomUUID()

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

  if (context.source === 'env') {
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        error: {
          code: 'MISCONFIGURED',
          message: 'La integración Meta debe configurarse por tenant; no se permite fallback global.',
        },
      },
      { status: 400 },
    )
  }

  const requestedAdAccount = normalizeMetaAdAccountId(searchParams.get('adAccount') || '')
  const effectiveAdAccountId = requestedAdAccount || context.meta.adAccountIdNormalized
  if (!effectiveAdAccountId) {
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        error: {
          code: 'MISCONFIGURED',
          message: 'No hay cuenta publicitaria Meta configurada para este tenant.',
        },
      },
      { status: 400 },
    )
  }

  const health = await checkMetaHealth({
    adAccountId: effectiveAdAccountId,
    accessToken: context.meta.marketingApiToken,
    requireAdsManagement: false,
  })

  if (health.status !== 'ok') {
    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      page: 1,
      limit: 20,
      sort: 'updated_time',
      order: 'desc',
      stale: false,
      source_health: health,
      diagnostics: {
        warnings: [],
        errors: health.error ? [health.error.message] : [],
      },
      error: health.error,
      generated_at: generatedAt,
    })
  }

  const sort = parseSort(searchParams.get('sort'))
  const order = parseOrder(searchParams.get('order'))
  const page = parsePositiveInt(searchParams.get('page'), 1, 10_000)
  const limit = parsePositiveInt(searchParams.get('limit'), 20, 100)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const rawStatusFilter = (searchParams.get('status') || '').trim().toLowerCase()
  const statusFilter = new Set(rawStatusFilter.split(',').map((item) => item.trim()).filter(Boolean))
  const forceRefresh = ['1', 'true', 'yes'].includes((searchParams.get('force_refresh') || '').toLowerCase())

  const { range, warnings: rangeWarnings } = resolveInsightsRange(searchParams)

  const cacheKey = buildCacheKey({
    tenantId: context.tenantId,
    adAccountId: effectiveAdAccountId,
    rangeKey: range.key,
    sort,
    order,
    status: rawStatusFilter,
    q,
    page,
    limit,
  })

  const cached = readCache(cacheKey)
  if (cached && !forceRefresh) {
    return NextResponse.json({
      ...cached.payload,
      generated_at: generatedAt,
    })
  }

  const campaignsResult = await fetchSolariaCampaigns({
    adAccountId: effectiveAdAccountId,
    accessToken: context.meta.marketingApiToken,
    requestId,
  })

  if (!campaignsResult.ok) {
    const error = campaignsResult.error ?? {
      code: 'META_API_ERROR',
      message: 'No se pudieron recuperar campañas de Meta',
    }

    if (cached) {
      return NextResponse.json({
        ...cached.payload,
        stale: true,
        diagnostics: {
          warnings: [...cached.payload.diagnostics.warnings, 'Se muestra caché por fallo temporal en Meta API.'],
          errors: [...cached.payload.diagnostics.errors, error.message],
        },
        source_health: {
          ...health,
          status: 'degraded',
          error,
        },
        generated_at: generatedAt,
      })
    }

    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      page,
      limit,
      sort,
      order,
      stale: false,
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
    })
  }

  const rawCampaigns = campaignsResult.data?.data ?? []

  const items = await Promise.all(
    rawCampaigns.map(async (campaign) => {
      const metaStatus = (campaign.status || campaign.effective_status || 'DRAFT').trim()
      const effectiveStatus = (campaign.effective_status || campaign.status || 'DRAFT').trim()
      const normalizedStatus = normalizeStatus(metaStatus)

      const insightsResult = await fetchCampaignInsights({
        campaignId: campaign.id,
        adAccountId: effectiveAdAccountId,
        accessToken: context.meta.marketingApiToken,
        range,
        requestId,
      })

      const adsPreviewResult = await fetchCampaignAds({
        campaignId: campaign.id,
        adAccountId: effectiveAdAccountId,
        accessToken: context.meta.marketingApiToken,
        limit: 1,
        requestId,
      })

      const diagnosticsErrors: string[] = []
      if (!insightsResult.ok && insightsResult.error) diagnosticsErrors.push(insightsResult.error.message)
      if (!adsPreviewResult.ok && adsPreviewResult.error) diagnosticsErrors.push(adsPreviewResult.error.message)

      const insightsSummary = buildInsightsSummary(
        range,
        insightsResult.ok ? insightsResult.data?.data?.[0] ?? null : null,
        insightsResult.ok ? null : insightsResult.error
      )

      const preview = adsPreviewResult.ok
        ? getPrimaryPreviewFromAds(adsPreviewResult.data?.data ?? [])
        : {
            thumbnail_url: null,
            image_url: null,
            preview_state: 'not_available' as const,
          }

      return {
        campaign: {
          id: campaign.id,
          meta_campaign_id: campaign.id,
          name: campaign.name || `Campaña ${campaign.id}`,
          status: normalizedStatus,
          meta_status: metaStatus,
          effective_status: effectiveStatus,
          objective: campaign.objective || 'OUTCOME_LEADS',
          campaign_type: 'meta_ads' as const,
          budget: parseBudget(campaign.daily_budget, campaign.lifetime_budget),
          created_time: campaign.created_time ?? null,
          updated_time: campaign.updated_time ?? null,
          start_time: campaign.start_time ?? null,
          stop_time: campaign.stop_time ?? null,
          ads_manager_url: buildAdsManagerUrl(effectiveAdAccountId, campaign.id),
        },
        insights_summary: insightsSummary,
        preview,
        sync_status: {
          last_synced_at: generatedAt,
          stale: false,
          source: 'meta_live' as const,
        },
        diagnostics: {
          warnings: [],
          errors: diagnosticsErrors,
        },
      }
    })
  )

  const filteredBySearch = q
    ? items.filter((item) => {
        const byName = item.campaign.name.toLowerCase().includes(q)
        const byId = item.campaign.id.toLowerCase().includes(q)
        return byName || byId
      })
    : items

  const filtered = filteredBySearch.filter((item) => statusMatchesFilter(item, statusFilter))

  const sorted = [...filtered].sort(bySortField(sort, order))

  const totalDocs = sorted.length
  const offset = (page - 1) * limit
  const docs = sorted.slice(offset, offset + limit)

  const hasPartialErrors = docs.some((item) => item.diagnostics.errors.length > 0)

  const responsePayload: CampaignsApiResponse = {
    docs,
    totalDocs,
    page,
    limit,
    sort,
    order,
    stale: false,
    source_health: hasPartialErrors
      ? {
          ...health,
          status: 'degraded',
        }
      : health,
    diagnostics: {
      warnings: rangeWarnings,
      errors: hasPartialErrors ? ['Algunas campañas tienen datos parciales o no disponibles.'] : [],
    },
    generated_at: generatedAt,
  }

  writeCache(cacheKey, responsePayload)

  return NextResponse.json(responsePayload)
}

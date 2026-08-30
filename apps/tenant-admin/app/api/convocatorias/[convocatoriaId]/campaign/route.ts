import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { authenticateRequest } from '../../route'
import {
  resolveConvocatoriaCampaign,
  type ConvocatoriaCampaignDraft,
  type ConvocatoriaCampaignCandidate,
  type ConvocatoriaCampaignResolution,
} from '@/app/lib/programacion/convocatoria-campaign-resolver'
import {
  buildAdsManagerUrl,
  buildInsightsSummary,
  checkMetaHealth,
  fetchCampaignAds,
  fetchCampaignById,
  fetchCampaignInsights,
  resolveInsightsRange,
} from '../../../meta/_lib/meta-graph'
import { resolveMetaRequestContext } from '../../../meta/_lib/integrations'

const READ_FLAG = 'AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED'
const MULTI_ENTITY_ENVIRONMENT = 'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'
const MAX_DRAFT_ROWS = 50
const MAX_CANDIDATES = 50

interface RawDraftRow {
  id?: unknown
  status?: unknown
  meta_campaign_id?: unknown
  campaign_id?: unknown
  meta_adset_id?: unknown
  adset_id?: unknown
  meta_ad_id?: unknown
  meta_ads?: unknown
  created_at?: unknown
  updated_at?: unknown
}

interface CampaignResponseMetrics {
  spend: number | null
  impressions: number | null
  reach: number | null
  clicks: number | null
  ctr: number | null
  cpc: number | null
  leads: number | null
  cpl: number | null
  conversions: number | null
  roas: number | null
}

function isEnabled(): boolean {
  return process.env[READ_FLAG] === 'true' && process.env[MULTI_ENTITY_ENVIRONMENT] === 'staging'
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function relationId(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null
  }
  return null
}

function text(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function rowsFromResult(result: unknown): RawDraftRow[] {
  if (Array.isArray(result)) return result as RawDraftRow[]
  if (!result || typeof result !== 'object') return []
  const rows = (result as { rows?: unknown }).rows
  return Array.isArray(rows) ? (rows as RawDraftRow[]) : []
}

function parseMetaAds(value: unknown): ConvocatoriaCampaignDraft['metaAds'] {
  if (typeof value === 'string') {
    try {
      return parseMetaAds(JSON.parse(value))
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      metaAdId: text(item.meta_ad_id ?? item.metaAdId ?? item.id),
      metaAdSetId: text(item.meta_adset_id ?? item.metaAdSetId ?? item.adset_id),
    }))
}

function mapDraftRow(row: RawDraftRow): ConvocatoriaCampaignDraft | null {
  const id = text(row.id)
  const metaCampaignId = text(row.meta_campaign_id ?? row.campaign_id)
  if (!id || !metaCampaignId) return null
  return {
    id,
    status: text(row.status),
    metaCampaignId,
    metaAdSetId: text(row.meta_adset_id ?? row.adset_id),
    metaAdId: text(row.meta_ad_id),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    metaAds: parseMetaAds(row.meta_ads),
  }
}

async function readDrafts(
  payload: Awaited<ReturnType<typeof getPayload>>,
  tenantId: number,
  convocatoriaId: number
): Promise<{ available: boolean; drafts: ConvocatoriaCampaignDraft[] }> {
  const drizzle = (payload.db as any)?.drizzle || (payload.db as any)?.pool
  if (!drizzle?.execute) return { available: false, drafts: [] }

  const base = `
    SELECT id, status,
      COALESCE(NULLIF(meta_campaign_id, ''), NULLIF(campaign_id, '')) AS meta_campaign_id,
      COALESCE(NULLIF(meta_adset_id, ''), NULLIF(adset_id, '')) AS meta_adset_id,
      meta_ad_id, created_at, updated_at
    FROM meta_ad_drafts
    WHERE tenant_id = ${tenantId} AND convocatoria_id = ${convocatoriaId}
    ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
    LIMIT ${MAX_DRAFT_ROWS}
  `

  try {
    const result = await drizzle.execute(`
      SELECT id, status,
        COALESCE(NULLIF(meta_campaign_id, ''), NULLIF(campaign_id, '')) AS meta_campaign_id,
        COALESCE(NULLIF(meta_adset_id, ''), NULLIF(adset_id, '')) AS meta_adset_id,
        meta_ad_id, meta_ads, created_at, updated_at
      FROM meta_ad_drafts
      WHERE tenant_id = ${tenantId} AND convocatoria_id = ${convocatoriaId}
      ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
      LIMIT ${MAX_DRAFT_ROWS}
    `)
    return {
      available: true,
      drafts: rowsFromResult(result)
        .map(mapDraftRow)
        .filter((row): row is ConvocatoriaCampaignDraft => Boolean(row)),
    }
  } catch {
    // Older installations may not yet have the optional JSONB ad list. Retry
    // without it, but never create or alter the table from a read endpoint.
    try {
      const result = await drizzle.execute(base)
      return {
        available: true,
        drafts: rowsFromResult(result)
          .map(mapDraftRow)
          .filter((row): row is ConvocatoriaCampaignDraft => Boolean(row)),
      }
    } catch {
      return { available: false, drafts: [] }
    }
  }
}

async function readCandidates(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: Record<string, unknown>,
  tenantId: number,
  courseId: string | null
): Promise<{ available: boolean; candidates: ConvocatoriaCampaignCandidate[] }> {
  const numericCourseId = toPositiveInt(courseId)
  if (!numericCourseId) return { available: true, candidates: [] }
  try {
    const result = await payload.find({
      collection: 'campaigns',
      where: {
        and: [{ tenant: { equals: tenantId } }, { course: { equals: numericCourseId } }],
      },
      limit: MAX_CANDIDATES,
      depth: 0,
      user,
    })
    const docs = Array.isArray(result?.docs) ? result.docs : []
    return {
      available: true,
      candidates: docs
        .map((doc: unknown) => {
          if (!doc || typeof doc !== 'object') return null
          const record = doc as Record<string, unknown>
          const localCampaignId = text(record.id)
          const name = text(record.name)
          return localCampaignId && name
            ? { localCampaignId, name, reason: 'course_heuristic' as const }
            : null
        })
        .filter((candidate): candidate is ConvocatoriaCampaignCandidate => Boolean(candidate)),
    }
  } catch {
    return { available: false, candidates: [] }
  }
}

function emptyMetrics(): CampaignResponseMetrics {
  return {
    spend: null,
    impressions: null,
    reach: null,
    clicks: null,
    ctr: null,
    cpc: null,
    leads: null,
    cpl: null,
    conversions: null,
    roas: null,
  }
}

function baseResponse(resolution: ConvocatoriaCampaignResolution, generatedAt: string) {
  const linked = resolution.linkStatus === 'linked' && resolution.metaCampaignId
  return {
    success: true,
    linkStatus: resolution.linkStatus,
    workflowStatus: resolution.workflowStatus,
    deliveryStatus: resolution.deliveryStatus,
    metaCampaignId: resolution.metaCampaignId,
    metaAdSetId: resolution.metaAdSetId,
    primaryMetaAdId: resolution.primaryMetaAdId,
    campaignName: null as string | null,
    adName: null as string | null,
    internalDetailUrl: linked
      ? `/campanas/${encodeURIComponent(resolution.metaCampaignId!)}`
      : null,
    adsManagerUrl: null as string | null,
    metrics: emptyMetrics(),
    adCount: 0,
    lastSyncedAt: null as string | null,
    source: resolution.source,
    stale: false,
    candidateCount: resolution.candidateCount,
    candidates: resolution.candidates,
    generatedAt,
  }
}

function metaDeliveryStatus(status: string | null): {
  workflowStatus: ConvocatoriaCampaignResolution['workflowStatus']
  deliveryStatus: ConvocatoriaCampaignResolution['deliveryStatus']
} {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'IN_PROCESS' || normalized === 'WITH_ISSUES') {
    return { workflowStatus: 'active', deliveryStatus: 'active' }
  }
  if (normalized === 'PAUSED' || normalized === 'CAMPAIGN_PAUSED') {
    return { workflowStatus: 'meta_paused', deliveryStatus: 'paused' }
  }
  if (normalized === 'COMPLETED' || normalized === 'ARCHIVED' || normalized === 'DELETED') {
    return { workflowStatus: 'ended', deliveryStatus: 'completed' }
  }
  if (normalized === 'PENDING_REVIEW' || normalized === 'IN_REVIEW') {
    return { workflowStatus: 'review', deliveryStatus: 'draft' }
  }
  if (normalized === 'ERROR') {
    return { workflowStatus: 'error', deliveryStatus: 'unknown' }
  }
  return { workflowStatus: null, deliveryStatus: 'unknown' }
}

function valueOrNull(metric: { value: number | null }): number | null {
  return metric.value
}

function responseWithUnavailable(response: ReturnType<typeof baseResponse>, warning: string) {
  return {
    ...response,
    source: 'unavailable' as const,
    diagnostics: { warnings: [warning], errors: [] },
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ convocatoriaId: string }> }
) {
  const generatedAt = new Date().toISOString()
  if (!isEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONVOCATORIA_CAMPAIGN_READ_DISABLED',
          message: 'La lectura por convocatoria permanece desactivada.',
        },
      },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  const convocatoriaId = toPositiveInt((await context.params).convocatoriaId)
  if (!convocatoriaId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_CONVOCATORIA_ID', message: 'convocatoriaId no válido.' },
      },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const user = await authenticateRequest(request, payload)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const tenantId = toPositiveInt(user.tenantId ?? user.tenant_id ?? relationId(user.tenant))
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'TENANT_REQUIRED', message: 'No se pudo resolver el tenant actual.' },
        },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    let convocatoria: Record<string, unknown>
    try {
      convocatoria = (await payload.findByID({
        collection: 'course-runs',
        id: convocatoriaId,
        depth: 1,
        user,
      })) as unknown as Record<string, unknown>
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CONVOCATORIA_NOT_FOUND', message: 'Convocatoria no encontrada.' },
        },
        { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    if (relationId(convocatoria.tenant) !== String(tenantId)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CONVOCATORIA_NOT_FOUND', message: 'Convocatoria no encontrada.' },
        },
        { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const draftsResult = await readDrafts(payload, tenantId, convocatoriaId)
    const candidatesResult = await readCandidates(
      payload,
      user,
      tenantId,
      relationId(convocatoria.course)
    )
    const resolution = resolveConvocatoriaCampaign({
      drafts: draftsResult.drafts,
      draftsAvailable: draftsResult.available,
      candidates: candidatesResult.candidates,
      candidatesAvailable: candidatesResult.available,
    })
    const response = baseResponse(resolution, generatedAt)

    if (resolution.linkStatus !== 'linked' || !resolution.metaCampaignId) {
      return NextResponse.json(response, {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }

    // A global/env Meta token is not a valid enterprise boundary. Keep the
    // linked workflow visible, but do not query another account as fallback.
    const metaContext = await resolveMetaRequestContext(request, String(tenantId))
    if (
      !metaContext.authenticated ||
      metaContext.tenantId !== String(tenantId) ||
      metaContext.source === 'env' ||
      !metaContext.meta.adAccountIdNormalized ||
      !metaContext.meta.marketingApiToken
    ) {
      return NextResponse.json(
        responseWithUnavailable(response, 'La integración Meta no está disponible por tenant.'),
        { headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const health = await checkMetaHealth({
      adAccountId: metaContext.meta.adAccountIdNormalized,
      accessToken: metaContext.meta.marketingApiToken,
      requireAdsManagement: false,
    })
    if (health.status !== 'ok') {
      return NextResponse.json(
        responseWithUnavailable(response, health.error?.code ?? 'META_UNAVAILABLE'),
        { headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const requestId = crypto.randomUUID()
    const campaignResult = await fetchCampaignById({
      campaignId: resolution.metaCampaignId,
      adAccountId: metaContext.meta.adAccountIdNormalized,
      accessToken: metaContext.meta.marketingApiToken,
      requestId,
    })
    if (!campaignResult.ok || !campaignResult.data) {
      return NextResponse.json(
        responseWithUnavailable(
          response,
          campaignResult.error?.code ?? 'META_CAMPAIGN_UNAVAILABLE'
        ),
        { headers: { 'Cache-Control': 'private, no-store' } }
      )
    }

    const { range, warnings: rangeWarnings } = resolveInsightsRange(request.nextUrl.searchParams)
    const [insightsResult, adsResult] = await Promise.all([
      fetchCampaignInsights({
        campaignId: resolution.metaCampaignId,
        adAccountId: metaContext.meta.adAccountIdNormalized,
        accessToken: metaContext.meta.marketingApiToken,
        range,
        requestId,
      }),
      fetchCampaignAds({
        campaignId: resolution.metaCampaignId,
        adAccountId: metaContext.meta.adAccountIdNormalized,
        accessToken: metaContext.meta.marketingApiToken,
        requestId,
      }),
    ])
    const summary = buildInsightsSummary(
      range,
      insightsResult.ok ? (insightsResult.data?.data?.[0] ?? null) : null,
      insightsResult.ok ? null : insightsResult.error
    )
    const ads = adsResult.ok ? (adsResult.data?.data ?? []) : []
    const primaryAd = ads.find((ad) => ad.id === resolution.primaryMetaAdId) ?? ads[0] ?? null
    const liveState = metaDeliveryStatus(
      campaignResult.data.effective_status ?? campaignResult.data.status ?? null
    )
    const leads = summary.results.result_type?.toLowerCase().includes('lead')
      ? summary.results.value
      : null
    const diagnosticsErrors = [
      insightsResult.ok ? null : (insightsResult.error?.code ?? 'META_INSIGHTS_UNAVAILABLE'),
      adsResult.ok ? null : (adsResult.error?.code ?? 'META_ADS_UNAVAILABLE'),
    ].filter((value): value is string => Boolean(value))

    return NextResponse.json(
      {
        ...response,
        workflowStatus: liveState.workflowStatus ?? response.workflowStatus,
        deliveryStatus:
          liveState.deliveryStatus === 'unknown'
            ? response.deliveryStatus
            : liveState.deliveryStatus,
        campaignName: campaignResult.data.name || null,
        adName: primaryAd?.name || null,
        adsManagerUrl: buildAdsManagerUrl(
          metaContext.meta.adAccountIdNormalized,
          resolution.metaCampaignId
        ),
        metrics: {
          spend: valueOrNull(summary.spend),
          impressions: valueOrNull(summary.impressions),
          reach: valueOrNull(summary.reach),
          clicks: valueOrNull(summary.clicks),
          ctr: valueOrNull(summary.ctr),
          cpc: valueOrNull(summary.cpc),
          leads,
          cpl: leads && leads > 0 ? summary.results.cost_per_result : null,
          conversions: null,
          roas: null,
        },
        primaryMetaAdId: primaryAd?.id ?? response.primaryMetaAdId,
        adCount: ads.length,
        lastSyncedAt: generatedAt,
        source: 'meta_live' as const,
        stale: false,
        diagnostics: {
          warnings: rangeWarnings,
          errors: diagnosticsErrors,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('Convocatoria campaign read failed:', error)
    return NextResponse.json(
      {
        success: true,
        linkStatus: 'unavailable',
        workflowStatus: null,
        deliveryStatus: 'unknown',
        metaCampaignId: null,
        metaAdSetId: null,
        primaryMetaAdId: null,
        campaignName: null,
        adName: null,
        internalDetailUrl: null,
        adsManagerUrl: null,
        metrics: emptyMetrics(),
        adCount: 0,
        lastSyncedAt: null,
        source: 'unavailable',
        stale: false,
        candidateCount: 0,
        candidates: [],
        generatedAt,
        diagnostics: {
          warnings: [],
          errors: ['CONVOCATORIA_CAMPAIGN_READ_FAILED'],
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  }
}

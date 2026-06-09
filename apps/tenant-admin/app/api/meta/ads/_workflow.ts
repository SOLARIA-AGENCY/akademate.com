import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { resolveMetaRequestContext } from '../_lib/integrations'
import { checkMetaHealth } from '../_lib/meta-graph'
import {
  buildCampaignName,
  buildUtmParams,
  createAd,
  createAdCreative,
  createAdSet,
  createCampaign,
  updateAdStatus,
  uploadAdImage,
  uploadAdVideo,
} from '../../../../src/lib/meta-marketing'

export type AdStrategy = 'new_campaign' | 'new_ad_existing_adset' | 'refresh_existing_ad'
export type AdWorkflowStatus = 'draft' | 'review' | 'meta_paused' | 'active' | 'error' | 'ended'

export interface AdWorkflowCopy {
  primary_texts: string[]
  headlines: string[]
  descriptions: string[]
  cta: string
}

export interface AdWorkflowAsset {
  media_id: number
  ratio: '1:1' | '9:16' | '16:9'
  type: 'image' | 'video'
}

export interface PublishedMetaAd {
  ratio: AdWorkflowAsset['ratio']
  type: AdWorkflowAsset['type']
  meta_creative_id: string
  meta_ad_id: string
}

export interface AdWorkflowBody {
  draft_id?: number
  convocatoria_id: number
  strategy?: AdStrategy
  campaign_id?: string
  adset_id?: string
  review_confirmed?: boolean
  daily_budget: number
  start_time?: string
  stop_time?: string
  landing_url?: string
  copy: AdWorkflowCopy
  assets: AdWorkflowAsset[]
}

export interface AdPreflightBody {
  convocatoria_id: number
  strategy?: AdStrategy
  campaign_id?: string
  adset_id?: string
  daily_budget?: number
  start_time?: string
  stop_time?: string
  landing_url?: string
}

const META_PAGE_ID = process.env.META_PAGE_ID || '174953792552373'
const META_REGION_TENERIFE = '3872'
const DEFAULT_CATEGORY = 'CICLOS FP'

function esc(value: string): string {
  return value.replace(/'/g, "''")
}

function asRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>
  const typed = result as { rows?: Array<Record<string, unknown>> }
  return Array.isArray(typed?.rows) ? typed.rows : []
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function addUrlParams(rawUrl: string, params: Record<string, string | null | undefined>): string {
  const url = new URL(rawUrl)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }
  return url.toString()
}

function buildRequestScopedLandingUrl(request: NextRequest, convocatoriaCode: string): string {
  return `${request.nextUrl.origin.replace(/\/$/, '')}/p/convocatorias/${encodeURIComponent(convocatoriaCode)}`
}

function assertPublicConvocatoria(convocatoria: any) {
  const rawStatus = typeof convocatoria?.status === 'string' ? convocatoria.status.trim().toLowerCase() : ''
  if (!rawStatus) return
  if (rawStatus === 'published' || rawStatus === 'enrollment_open') return
  throw new Error('La convocatoria debe estar publicada o abierta para inscripcion antes de generar publicidad en Meta.')
}

export function buildMetaAdUrlParameters(input: { utmCampaign: string; metaCampaignId: string; ratio?: string }) {
  const params = new URLSearchParams(buildUtmParams(input.utmCampaign))
  if (input.metaCampaignId) {
    params.set('meta_campaign_id', input.metaCampaignId)
    params.set('campaign_id', input.metaCampaignId)
    params.set('utm_id', input.metaCampaignId)
  }
  if (input.ratio) params.set('utm_content', input.ratio)
  return params.toString()
}

function assertCopy(copy: AdWorkflowCopy) {
  if (!Array.isArray(copy?.primary_texts) || copy.primary_texts.filter(Boolean).length < 1) {
    throw new Error('Debes incluir al menos un texto principal.')
  }
  if (!Array.isArray(copy?.headlines) || copy.headlines.filter(Boolean).length < 1) {
    throw new Error('Debes incluir al menos un titular.')
  }
}

function assertAssets(assets: AdWorkflowAsset[]) {
  const ratios = new Set((Array.isArray(assets) ? assets : []).map((asset) => asset.ratio))
  if (!ratios.has('1:1') || !ratios.has('9:16')) {
    throw new Error('Debes subir al menos creatividades 1:1 y 9:16.')
  }
}

function assertStrategy(body: Partial<AdWorkflowBody>) {
  const strategy = body.strategy || 'new_campaign'
  if (strategy === 'new_ad_existing_adset' && (!body.campaign_id || !body.adset_id)) {
    throw new Error('Para crear un anuncio en un adset existente debes indicar campaign_id y adset_id.')
  }
  if (strategy === 'refresh_existing_ad' && (!body.campaign_id || !body.adset_id)) {
    throw new Error('Para refrescar una campaña existente debes indicar campaign_id y adset_id.')
  }
}

export function normalizeAdWorkflowBody(raw: Partial<AdWorkflowBody>): AdWorkflowBody {
  const convocatoriaId = toPositiveInt(raw.convocatoria_id)
  if (!convocatoriaId) throw new Error('convocatoria_id es obligatorio.')
  const dailyBudget = Number(raw.daily_budget)
  if (!Number.isFinite(dailyBudget) || dailyBudget < 100) {
    throw new Error('daily_budget debe estar en céntimos y ser mayor o igual a 100.')
  }
  const copy = raw.copy || { primary_texts: [], headlines: [], descriptions: [], cta: 'SIGN_UP' }
  assertCopy(copy)
  const assets = Array.isArray(raw.assets) ? raw.assets : []
  assertAssets(assets)
  assertStrategy(raw)

  return {
    draft_id: toPositiveInt(raw.draft_id) || undefined,
    convocatoria_id: convocatoriaId,
    strategy: raw.strategy || 'new_campaign',
    campaign_id: typeof raw.campaign_id === 'string' ? raw.campaign_id.trim() : undefined,
    adset_id: typeof raw.adset_id === 'string' ? raw.adset_id.trim() : undefined,
    review_confirmed: raw.review_confirmed === true,
    daily_budget: Math.round(dailyBudget),
    start_time: typeof raw.start_time === 'string' ? raw.start_time : undefined,
    stop_time: typeof raw.stop_time === 'string' ? raw.stop_time : undefined,
    landing_url: typeof raw.landing_url === 'string' ? raw.landing_url.trim() : undefined,
    copy: {
      primary_texts: copy.primary_texts.filter(Boolean).map((item) => String(item).trim()).slice(0, 6),
      headlines: copy.headlines.filter(Boolean).map((item) => String(item).trim()).slice(0, 6),
      descriptions: (copy.descriptions || []).filter(Boolean).map((item) => String(item).trim()).slice(0, 3),
      cta: copy.cta || 'SIGN_UP',
    },
    assets,
  }
}

export function normalizeAdPreflightBody(raw: Partial<AdPreflightBody>): AdPreflightBody {
  const convocatoriaId = toPositiveInt(raw.convocatoria_id)
  if (!convocatoriaId) throw new Error('convocatoria_id es obligatorio.')
  const dailyBudget = raw.daily_budget === undefined ? undefined : Number(raw.daily_budget)
  if (dailyBudget !== undefined && (!Number.isFinite(dailyBudget) || dailyBudget < 100)) {
    throw new Error('daily_budget debe estar en céntimos y ser mayor o igual a 100.')
  }
  assertStrategy(raw)

  return {
    convocatoria_id: convocatoriaId,
    strategy: raw.strategy || 'new_campaign',
    campaign_id: typeof raw.campaign_id === 'string' ? raw.campaign_id.trim() : undefined,
    adset_id: typeof raw.adset_id === 'string' ? raw.adset_id.trim() : undefined,
    daily_budget: dailyBudget === undefined ? undefined : Math.round(dailyBudget),
    start_time: typeof raw.start_time === 'string' ? raw.start_time : undefined,
    stop_time: typeof raw.stop_time === 'string' ? raw.stop_time : undefined,
    landing_url: typeof raw.landing_url === 'string' ? raw.landing_url.trim() : undefined,
  }
}

export async function getWorkflowContext(request: NextRequest) {
  const metaContext = await resolveMetaRequestContext(request, request.nextUrl.searchParams.get('tenantId'))
  if (!metaContext.authenticated) throw new Error('UNAUTHORIZED')
  if (!metaContext.tenantId) throw new Error('No se pudo resolver el tenant actual.')

  const health = await checkMetaHealth({
    adAccountId: metaContext.meta.adAccountIdNormalized,
    accessToken: metaContext.meta.marketingApiToken,
    requireAdsManagement: true,
  })
  if (health.status !== 'ok') {
    const err = new Error(health.error?.message || 'La integración Meta no está lista para publicar.') as Error & { health?: unknown }
    err.health = health
    throw err
  }

  const payload = await getPayload({ config: configPromise })
  const drizzle = (payload.db as any).drizzle || (payload.db as any).pool
  if (!drizzle?.execute) throw new Error('Base de datos no disponible para el workflow Meta.')
  await ensureWorkflowTables(drizzle)
  return { payload, drizzle, metaContext, health }
}

export async function preflightMetaAd(input: { request: NextRequest; body: AdPreflightBody }) {
  const ctx = await getWorkflowContext(input.request)
  const syntheticBody = {
    convocatoria_id: input.body.convocatoria_id,
    strategy: input.body.strategy || 'new_campaign',
    campaign_id: input.body.campaign_id,
    adset_id: input.body.adset_id,
    daily_budget: input.body.daily_budget || 100,
    start_time: input.body.start_time,
    stop_time: input.body.stop_time,
    landing_url: input.body.landing_url,
    copy: {
      primary_texts: ['preflight'],
      headlines: ['preflight'],
      descriptions: [],
      cta: 'SIGN_UP',
    },
    assets: [
      { media_id: 1, ratio: '1:1', type: 'image' },
      { media_id: 2, ratio: '9:16', type: 'image' },
    ],
  } satisfies AdWorkflowBody
  const convocatoria = await getConvocatoria(ctx.payload, input.body.convocatoria_id)
  const plan = resolveConvocatoriaPlan({ request: input.request, body: syntheticBody, convocatoria })

  return {
    ctx,
    preflight: {
      ok: true,
      checks: {
        authenticated: true,
        tenant_resolved: Boolean(ctx.metaContext.tenantId),
        meta_health: ctx.health.status,
        ads_management: Boolean(ctx.health.permissions.ads_management),
        ads_read: Boolean(ctx.health.permissions.ads_read),
        ad_account_access: Boolean(ctx.health.ad_account_access),
        workflow_tables: true,
        convocatoria_public: true,
        landing_url: plan.landingUrl,
        auto_stop_at: plan.stopIso,
        duration_days: plan.days,
      },
      diagnostics: {
        tenant_id: ctx.metaContext.tenantId,
        ad_account_id: ctx.metaContext.meta.adAccountIdNormalized,
        strategy: input.body.strategy || 'new_campaign',
        requires_existing_campaign: input.body.strategy === 'new_ad_existing_adset' || input.body.strategy === 'refresh_existing_ad',
        campaign_id: input.body.campaign_id || null,
        adset_id: input.body.adset_id || null,
      },
    },
  }
}

export async function ensureWorkflowTables(drizzle: any) {
  await drizzle.execute(`
    CREATE TABLE IF NOT EXISTS meta_ad_drafts (
      id BIGSERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      convocatoria_id INTEGER NOT NULL,
      strategy VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      campaign_id VARCHAR(64),
      adset_id VARCHAR(64),
      meta_campaign_id VARCHAR(64),
      meta_adset_id VARCHAR(64),
      meta_creative_id VARCHAR(64),
      meta_ad_id VARCHAR(64),
      meta_ads JSONB NOT NULL DEFAULT '[]'::jsonb,
      landing_url TEXT NOT NULL,
      utm_campaign VARCHAR(255),
      daily_budget INTEGER NOT NULL,
      start_time TIMESTAMPTZ,
      stop_time TIMESTAMPTZ,
      copy JSONB NOT NULL DEFAULT '{}'::jsonb,
      assets JSONB NOT NULL DEFAULT '[]'::jsonb,
      preview JSONB NOT NULL DEFAULT '{}'::jsonb,
      diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      activated_at TIMESTAMPTZ
    )
  `)
  await drizzle.execute(`CREATE INDEX IF NOT EXISTS meta_ad_drafts_tenant_conv_idx ON meta_ad_drafts (tenant_id, convocatoria_id, created_at DESC)`)
  await drizzle.execute(`ALTER TABLE meta_ad_drafts ADD COLUMN IF NOT EXISTS meta_ads JSONB NOT NULL DEFAULT '[]'::jsonb`)
  await drizzle.execute(`
    CREATE TABLE IF NOT EXISTS meta_publish_jobs (
      id BIGSERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      draft_id BIGINT,
      job_type VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      request JSONB NOT NULL DEFAULT '{}'::jsonb,
      response JSONB NOT NULL DEFAULT '{}'::jsonb,
      diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function getConvocatoria(payload: any, id: number) {
  return payload.findByID({ collection: 'course-runs', id, depth: 2 })
}

export function resolveConvocatoriaPlan(input: { request: NextRequest; body: AdWorkflowBody; convocatoria: any }) {
  assertPublicConvocatoria(input.convocatoria)
  const code = String(input.convocatoria?.codigo || input.body.convocatoria_id).trim()
  const startIso = toIsoDate(input.body.start_time) || new Date().toISOString()
  const stopIso = toIsoDate(input.body.stop_time) || toIsoDate(input.convocatoria?.start_date)
  if (!stopIso) throw new Error('La convocatoria no tiene fecha de inicio válida para calcular fin de campaña.')
  if (new Date(stopIso).getTime() <= Date.now()) {
    throw new Error('La convocatoria ya ha comenzado o no permite campaña hasta fecha de inicio.')
  }
  const baseLanding = input.body.landing_url || buildRequestScopedLandingUrl(input.request, code)
  const utmCampaign = `SA-SC-${code}`.replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 120)
  const landingUrl = addUrlParams(baseLanding, {
    utm_source: 'facebook',
    utm_medium: 'paid',
    utm_campaign: utmCampaign,
  })

  return {
    code,
    startIso,
    stopIso,
    landingUrl,
    utmCampaign,
    days: Math.max(1, Math.ceil((new Date(stopIso).getTime() - new Date(startIso).getTime()) / 86_400_000)),
  }
}

export function buildPreview(input: { body: AdWorkflowBody; convocatoria: any; plan: ReturnType<typeof resolveConvocatoriaPlan> }) {
  const course = typeof input.convocatoria.course === 'object' ? input.convocatoria.course : null
  const cycle = course && typeof course.cycle === 'object' ? course.cycle : null
  const courseName = course?.name || cycle?.name || `Convocatoria ${input.plan.code}`
  const estimatedTotal = input.body.daily_budget * input.plan.days
  return {
    course_name: courseName,
    campaign_name: buildCampaignName(DEFAULT_CATEGORY, String(new Date().getFullYear()), input.plan.utmCampaign),
    landing_url: input.plan.landingUrl,
    start_time: input.plan.startIso,
    stop_time: input.plan.stopIso,
    duration_days: input.plan.days,
    daily_budget: input.body.daily_budget,
    estimated_total_budget: estimatedTotal,
    status_after_publish: 'PAUSED',
    status_after_activation: 'ACTIVE',
    placements: ['feed', 'stories_reels', 'right_column'],
    lifecycle: {
      review_required: true,
      created_in_meta_status: 'PAUSED',
      manual_activation_required: true,
      auto_stop_at: input.plan.stopIso,
      stop_source: 'convocatoria.start_date',
    },
    ad: {
      primary_text: input.body.copy.primary_texts[0],
      headline: input.body.copy.headlines[0],
      description: input.body.copy.descriptions[0] || '',
      cta: input.body.copy.cta || 'SIGN_UP',
      assets: input.body.assets,
    },
    tracking: {
      pixel_after_crm_success: true,
      capi_dedup_event_id: true,
      public_form_connected: true,
      crm_lead_connected: true,
      meta_campaign_id_url_tags: true,
      traffic_events: ['page_view', 'form_click', 'form_submit', 'form_error', 'lead'],
      utm_campaign: input.plan.utmCampaign,
    },
    review_checklist: [
      'Creatividades 1:1 y 9:16 cargadas',
      'Textos/titulares revisados por operario',
      'Landing publica de convocatoria conectada',
      'Pixel/CAPI se disparan despues de crear el lead en CRM',
      'UTM y meta_campaign_id viajan a CRM, trafico y analiticas',
      'La campana se detiene automaticamente en la fecha de inicio de convocatoria',
      'La campana no se activa hasta confirmacion manual',
    ],
  }
}

export async function upsertDraft(input: {
  drizzle: any
  tenantId: string
  userId: string | number | null
  body: AdWorkflowBody
  plan: ReturnType<typeof resolveConvocatoriaPlan>
  preview: Record<string, unknown>
  status: AdWorkflowStatus
  diagnostics?: Record<string, unknown>
  meta?: Record<string, string | null | undefined>
  metaAds?: PublishedMetaAd[]
}): Promise<number> {
  const draftId = input.body.draft_id
  const meta = input.meta || {}
  if (draftId) {
    await input.drizzle.execute(`
      UPDATE meta_ad_drafts SET
        strategy='${esc(input.body.strategy || 'refresh_existing_ad')}',
        status='${esc(input.status)}',
        campaign_id=${input.body.campaign_id ? `'${esc(input.body.campaign_id)}'` : 'NULL'},
        adset_id=${input.body.adset_id ? `'${esc(input.body.adset_id)}'` : 'NULL'},
        meta_campaign_id=${meta.meta_campaign_id ? `'${esc(meta.meta_campaign_id)}'` : 'meta_campaign_id'},
        meta_adset_id=${meta.meta_adset_id ? `'${esc(meta.meta_adset_id)}'` : 'meta_adset_id'},
        meta_creative_id=${meta.meta_creative_id ? `'${esc(meta.meta_creative_id)}'` : 'meta_creative_id'},
        meta_ad_id=${meta.meta_ad_id ? `'${esc(meta.meta_ad_id)}'` : 'meta_ad_id'},
        meta_ads='${esc(JSON.stringify(input.metaAds || []))}'::jsonb,
        landing_url='${esc(input.plan.landingUrl)}',
        utm_campaign='${esc(input.plan.utmCampaign)}',
        daily_budget=${input.body.daily_budget},
        start_time='${esc(input.plan.startIso)}'::timestamptz,
        stop_time='${esc(input.plan.stopIso)}'::timestamptz,
        copy='${esc(JSON.stringify(input.body.copy))}'::jsonb,
        assets='${esc(JSON.stringify(input.body.assets))}'::jsonb,
        preview='${esc(JSON.stringify(input.preview))}'::jsonb,
        diagnostics='${esc(JSON.stringify(input.diagnostics || {}))}'::jsonb,
        updated_at=NOW(),
        published_at=CASE WHEN '${esc(input.status)}'='meta_paused' THEN COALESCE(published_at, NOW()) ELSE published_at END,
        activated_at=CASE WHEN '${esc(input.status)}'='active' THEN COALESCE(activated_at, NOW()) ELSE activated_at END
      WHERE id=${draftId} AND tenant_id=${Number(input.tenantId)}
    `)
    return draftId
  }

  const result = await input.drizzle.execute(`
    INSERT INTO meta_ad_drafts (
      tenant_id, convocatoria_id, strategy, status, campaign_id, adset_id, landing_url, utm_campaign,
      daily_budget, start_time, stop_time, copy, assets, preview, diagnostics, meta_ads, created_by
    ) VALUES (
      ${Number(input.tenantId)}, ${input.body.convocatoria_id}, '${esc(input.body.strategy || 'refresh_existing_ad')}', '${esc(input.status)}',
      ${input.body.campaign_id ? `'${esc(input.body.campaign_id)}'` : 'NULL'},
      ${input.body.adset_id ? `'${esc(input.body.adset_id)}'` : 'NULL'},
      '${esc(input.plan.landingUrl)}', '${esc(input.plan.utmCampaign)}', ${input.body.daily_budget},
      '${esc(input.plan.startIso)}'::timestamptz, '${esc(input.plan.stopIso)}'::timestamptz,
      '${esc(JSON.stringify(input.body.copy))}'::jsonb,
      '${esc(JSON.stringify(input.body.assets))}'::jsonb,
      '${esc(JSON.stringify(input.preview))}'::jsonb,
      '${esc(JSON.stringify(input.diagnostics || {}))}'::jsonb,
      '${esc(JSON.stringify(input.metaAds || []))}'::jsonb,
      ${input.userId ? `'${esc(String(input.userId))}'` : 'NULL'}
    ) RETURNING id
  `)
  const rows = asRows(result)
  return Number(rows[0]?.id || 0)
}

function parseMetaAds(raw: unknown): PublishedMetaAd[] {
  if (Array.isArray(raw)) return raw as PublishedMetaAd[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

async function resolveMediaAsset(input: {
  payload: any
  request: NextRequest
  adAccountId: string
  accessToken: string
  asset: AdWorkflowAsset
}): Promise<{ imageHash?: string; videoId?: string }> {
  const media = await input.payload.findByID({ collection: 'media', id: input.asset.media_id })
  const mediaUrl = typeof media?.url === 'string' ? media.url : ''
  if (!mediaUrl) throw new Error(`La creatividad ${input.asset.media_id} no tiene URL de media.`)
  const absoluteUrl = mediaUrl.startsWith('http') ? mediaUrl : `${input.request.nextUrl.origin}${mediaUrl}`
  if (input.asset.type === 'video') {
    const uploaded = await uploadAdVideo(input.adAccountId, input.accessToken, absoluteUrl)
    if (!uploaded.success || !uploaded.data?.id) throw new Error(uploaded.error || `No se pudo subir video ${input.asset.media_id} a Meta.`)
    return { videoId: uploaded.data.id }
  }
  const uploaded = await uploadAdImage(input.adAccountId, input.accessToken, absoluteUrl)
  if (!uploaded.success || !uploaded.data?.hash) throw new Error(uploaded.error || `No se pudo subir imagen ${input.asset.media_id} a Meta.`)
  return { imageHash: uploaded.data.hash }
}

export async function getDraft(drizzle: any, tenantId: string, draftId: number) {
  const result = await drizzle.execute(`SELECT * FROM meta_ad_drafts WHERE id=${draftId} AND tenant_id=${Number(tenantId)} LIMIT 1`)
  return asRows(result)[0] || null
}

export async function logPublishJob(input: { drizzle: any; tenantId: string; draftId?: number; type: string; status: string; request: unknown; response: unknown; diagnostics?: unknown }) {
  await input.drizzle.execute(`
    INSERT INTO meta_publish_jobs (tenant_id, draft_id, job_type, status, request, response, diagnostics)
    VALUES (${Number(input.tenantId)}, ${input.draftId || 'NULL'}, '${esc(input.type)}', '${esc(input.status)}', '${esc(JSON.stringify(input.request || {}))}'::jsonb, '${esc(JSON.stringify(input.response || {}))}'::jsonb, '${esc(JSON.stringify(input.diagnostics || {}))}'::jsonb)
  `)
}

export async function publishToMeta(input: { request: NextRequest; body: AdWorkflowBody }) {
  if (input.body.review_confirmed !== true) {
    throw new Error('Debes confirmar la revision operativa antes de crear el borrador en Meta.')
  }

  const ctx = await getWorkflowContext(input.request)
  const convocatoria = await getConvocatoria(ctx.payload, input.body.convocatoria_id)
  const plan = resolveConvocatoriaPlan({ request: input.request, body: input.body, convocatoria })
  const preview = buildPreview({ body: input.body, convocatoria, plan })

  const accessToken = ctx.metaContext.meta.marketingApiToken
  const adAccountId = ctx.metaContext.meta.adAccountIdNormalized
  const pixelId = ctx.metaContext.meta.pixelId
  const courseName = preview.course_name as string
  let metaCampaignId = input.body.campaign_id || ''
  let metaAdSetId = input.body.adset_id || ''

  if (input.body.strategy === 'new_campaign' || !metaCampaignId) {
    const campaign = await createCampaign({ adAccountId, accessToken, name: preview.campaign_name as string, status: 'PAUSED' })
    if (!campaign.success || !campaign.data?.id) throw new Error(campaign.error || 'No se pudo crear campaña Meta.')
    metaCampaignId = campaign.data.id
  }

  if (input.body.strategy === 'new_campaign' || !metaAdSetId) {
    const adSet = await createAdSet({
      adAccountId,
      accessToken,
      campaignId: metaCampaignId,
      name: `${courseName} / ${plan.code}`,
      dailyBudget: input.body.daily_budget,
      pixelId,
      targeting: { geoLocations: { regions: [{ key: META_REGION_TENERIFE }] } },
      startTime: plan.startIso,
      endTime: plan.stopIso,
    })
    if (!adSet.success || !adSet.data?.id) throw new Error(adSet.error || 'No se pudo crear conjunto de anuncios Meta.')
    metaAdSetId = adSet.data.id
  }

  const publishedAds: PublishedMetaAd[] = []
  for (const asset of input.body.assets) {
    const uploadedAsset = await resolveMediaAsset({
      payload: ctx.payload,
      request: input.request,
      adAccountId,
      accessToken,
      asset,
    })
    const creative = await createAdCreative({
      adAccountId,
      accessToken,
      name: `Creative - ${courseName} - ${asset.ratio} - ${new Date().toISOString().slice(0, 10)}`,
      pageId: META_PAGE_ID,
      imageHash: uploadedAsset.imageHash,
      videoId: uploadedAsset.videoId,
      headline: input.body.copy.headlines[0],
      body: input.body.copy.primary_texts[0],
      description: input.body.copy.descriptions[0] || '',
      linkUrl: plan.landingUrl,
      callToAction: input.body.copy.cta || 'SIGN_UP',
      urlParameters: buildMetaAdUrlParameters({ utmCampaign: plan.utmCampaign, metaCampaignId, ratio: asset.ratio }),
    })
    if (!creative.success || !creative.data?.id) throw new Error(creative.error || `No se pudo crear creative Meta para ${asset.ratio}.`)

    const ad = await createAd({
      adAccountId,
      accessToken,
      adSetId: metaAdSetId,
      name: `AD / ${courseName} / ${plan.code} / ${asset.ratio} / ${new Date().toISOString().slice(0, 10)}`,
      creativeId: creative.data.id,
      status: 'PAUSED',
    })
    if (!ad.success || !ad.data?.id) throw new Error(ad.error || `No se pudo crear anuncio Meta para ${asset.ratio}.`)
    publishedAds.push({
      ratio: asset.ratio,
      type: asset.type,
      meta_creative_id: creative.data.id,
      meta_ad_id: ad.data.id,
    })
  }
  const primaryPublishedAd = publishedAds[0]

  const draftId = await upsertDraft({
    drizzle: ctx.drizzle,
    tenantId: ctx.metaContext.tenantId!,
    userId: ctx.metaContext.userId,
    body: input.body,
    plan,
    preview,
    status: 'meta_paused',
    meta: {
      meta_campaign_id: metaCampaignId,
      meta_adset_id: metaAdSetId,
      meta_creative_id: primaryPublishedAd?.meta_creative_id,
      meta_ad_id: primaryPublishedAd?.meta_ad_id,
    },
    metaAds: publishedAds,
  })
  await logPublishJob({ drizzle: ctx.drizzle, tenantId: ctx.metaContext.tenantId!, draftId, type: 'publish', status: 'success', request: input.body, response: { metaCampaignId, metaAdSetId, metaAds: publishedAds } })

  return { ctx, draftId, preview, metaCampaignId, metaAdSetId, metaAds: publishedAds, metaCreativeId: primaryPublishedAd?.meta_creative_id, metaAdId: primaryPublishedAd?.meta_ad_id }
}

export async function activateMetaAd(input: { request: NextRequest; draftId: number; confirmed?: boolean }) {
  if (input.confirmed !== true) {
    throw new Error('Debes confirmar manualmente la puesta en marcha antes de activar anuncios en Meta.')
  }

  const ctx = await getWorkflowContext(input.request)
  const draft = await getDraft(ctx.drizzle, ctx.metaContext.tenantId!, input.draftId)
  if (!draft) throw new Error('Draft no encontrado.')
  const metaAds = parseMetaAds(draft.meta_ads)
  const adIds = metaAds.length > 0 ? metaAds.map((ad) => ad.meta_ad_id).filter(Boolean) : [String(draft.meta_ad_id || '')].filter(Boolean)
  if (adIds.length === 0) throw new Error('El anuncio aún no existe en Meta.')
  const results = []
  for (const adId of adIds) {
    const result = await updateAdStatus({ adId, accessToken: ctx.metaContext.meta.marketingApiToken, status: 'ACTIVE' })
    if (!result.success) throw new Error(result.error || `No se pudo activar el anuncio ${adId}.`)
    results.push({ metaAdId: adId, status: 'ACTIVE' })
  }
  await ctx.drizzle.execute(`UPDATE meta_ad_drafts SET status='active', activated_at=NOW(), updated_at=NOW() WHERE id=${input.draftId} AND tenant_id=${Number(ctx.metaContext.tenantId)}`)
  await logPublishJob({ drizzle: ctx.drizzle, tenantId: ctx.metaContext.tenantId!, draftId: input.draftId, type: 'activate', status: 'success', request: { draftId: input.draftId }, response: { ads: results } })
  return { ctx, draft, metaAdId: adIds[0], metaAds: results }
}

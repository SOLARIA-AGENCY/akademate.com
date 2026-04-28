export type CommercialBucket = 'leads' | 'inscripciones' | 'unresolved'

export type CommercialBucketFilter = 'leads' | 'inscripciones'

export interface ActiveCampaignSignal {
  id?: number | string | null
  name?: string | null
  status?: string | null
  utmCampaign?: string | null
  utmSource?: string | null
  campaignType?: string | null
  metaCampaignId?: string | null
}

export interface CommercialClassificationContext {
  byId: Map<number, ActiveCampaignMetadata>
  byToken: Map<string, ActiveCampaignMetadata>
  activeMetaCampaignIds: Set<string>
}

interface ActiveCampaignMetadata {
  id: number | null
  name: string | null
  isMeta: boolean
}

export interface CommercialClassification {
  bucket: CommercialBucket
  unresolved: boolean
  adsActive: boolean
  campaignLabel: string | null
  originLabel: string
  sourceLabel: string
  reason:
    | 'active_meta_campaign'
    | 'meta_source_without_active_campaign'
    | 'organic_or_non_meta_campaign'
}

const META_SOURCE_TOKENS = ['meta', 'facebook', 'instagram', 'fb', 'ig']

const SOURCE_FORM_LABELS: Record<string, string> = {
  preinscripcion_convocatoria: 'Formulario de convocatoria',
  preinscripcion_ciclo: 'Formulario de ciclo',
  landing_contact_form: 'Landing de captación',
  meta_lead_ads: 'Lead Ads de Meta',
  contacto: 'Formulario de contacto',
  web_form: 'Formulario web',
}

function asString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function toSourceDetails(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

function getFirstString(values: unknown[]): string {
  for (const value of values) {
    const candidate = asString(value)
    if (candidate.length > 0) return candidate
  }
  return ''
}

function parseTrackingParamFromUrl(rawUrl: string, param: string): string {
  if (!rawUrl.trim()) return ''
  try {
    const parsed = new URL(rawUrl)
    return asString(parsed.searchParams.get(param))
  } catch {
    const query = rawUrl.includes('?') ? rawUrl.split('?')[1] || '' : rawUrl
    if (!query) return ''
    const params = new URLSearchParams(query)
    return asString(params.get(param))
  }
}

function extractConvocatoriaCodeFromPath(pathLike: string): string {
  if (!pathLike.trim()) return ''
  const match = pathLike.match(/\/(?:p\/)?convocatorias\/([^/?#]+)/i)
  return asString(match?.[1])
}

function extractCycleSlugFromPath(pathLike: string): string {
  if (!pathLike.trim()) return ''
  const match = pathLike.match(/\/(?:p\/)?ciclos\/([^/?#]+)/i)
  return asString(match?.[1])
}

function isMetaLikeCampaign(campaign: ActiveCampaignSignal): boolean {
  const sourceToken = normalizeToken(asString(campaign.utmSource))
  const typeToken = normalizeToken(asString(campaign.campaignType))
  const nameToken = normalizeToken(asString(campaign.name))

  if (META_SOURCE_TOKENS.some((token) => sourceToken.includes(token))) return true
  if (META_SOURCE_TOKENS.some((token) => typeToken.includes(token))) return true
  if (META_SOURCE_TOKENS.some((token) => nameToken.includes(token))) return true
  if (asString(campaign.metaCampaignId).length > 0) return true

  return false
}

function isMetaSourceSignal(lead: Record<string, unknown>, sourceDetails: Record<string, unknown> | null): boolean {
  const sourceForm = normalizeToken(
    getFirstString([lead.source_form, sourceDetails?.source_form]),
  )
  const sourcePage = getFirstString([lead.source_page, sourceDetails?.source_page, sourceDetails?.path]).toLowerCase()
  const utmSource = normalizeToken(getFirstString([lead.utm_source, sourceDetails?.utm_source]))

  const metaCampaignId = getFirstString([lead.meta_campaign_id, sourceDetails?.meta_campaign_id])
  const adId = getFirstString([lead.ad_id, sourceDetails?.ad_id])
  const adsetId = getFirstString([lead.adset_id, sourceDetails?.adset_id])
  const fbclid = getFirstString([lead.fbclid, sourceDetails?.fbclid])
  const fbc = getFirstString([lead.fbc, sourceDetails?.fbc])
  const fbp = getFirstString([lead.fbp, sourceDetails?.fbp])

  if (sourceForm.includes('meta') || sourceForm.includes('facebook') || sourceForm.includes('instagram')) {
    return true
  }
  if (META_SOURCE_TOKENS.some((token) => utmSource.includes(token))) {
    return true
  }
  if (sourcePage.includes('facebook.com') || sourcePage.includes('instagram.com') || sourcePage.includes('fbclid=')) {
    return true
  }
  if (metaCampaignId || adId || adsetId || fbclid || fbc || fbp) {
    return true
  }

  return false
}

function resolveSourceLabel(lead: Record<string, unknown>, sourceDetails: Record<string, unknown> | null): string {
  const sourceFormRaw = getFirstString([lead.source_form, sourceDetails?.source_form])
  const sourceFormToken = normalizeToken(sourceFormRaw)
  const sourcePage = getFirstString([lead.source_page, sourceDetails?.source_page, sourceDetails?.path])
  const convocatoriaCode = getFirstString([
    sourceDetails?.convocatoria_code,
    sourceDetails?.convocatoria_codigo,
    lead.convocatoria_code,
    lead.convocatoria_codigo,
    extractConvocatoriaCodeFromPath(sourcePage),
  ])
  const cicloLabel = getFirstString([
    sourceDetails?.cycle_name,
    sourceDetails?.ciclo_name,
    lead.cycle_name,
    lead.ciclo_name,
    extractCycleSlugFromPath(sourcePage),
  ])

  if (sourceFormToken === 'preinscripcion_convocatoria' && convocatoriaCode.length > 0) {
    return `Convocatoria ${convocatoriaCode.toUpperCase()}`
  }

  if (sourceFormToken === 'preinscripcion_ciclo' && cicloLabel.length > 0) {
    return `Ciclo ${firstSegment(cicloLabel)}`
  }

  if (sourceFormToken.length > 0 && SOURCE_FORM_LABELS[sourceFormToken]) {
    return SOURCE_FORM_LABELS[sourceFormToken]
  }

  if (sourceFormRaw.length > 0) {
    return `Formulario ${sourceFormRaw.replace(/[_-]+/g, ' ')}`
  }

  if (sourcePage.length > 0) {
    const normalizedSourcePage = sourcePage.toLowerCase()
    if (normalizedSourcePage.includes('/convocatorias')) {
      if (convocatoriaCode.length > 0) {
        return `Convocatoria ${convocatoriaCode.toUpperCase()}`
      }
      return 'Página de convocatorias'
    }
    if (normalizedSourcePage.includes('/ciclos')) {
      if (cicloLabel.length > 0) {
        return `Ciclo ${firstSegment(cicloLabel)}`
      }
      return 'Página de ciclos'
    }
    if (normalizedSourcePage.includes('/landing/')) {
      const landingSlug = sourcePage
        .split('/landing/')[1]
        ?.split(/[?#]/)[0]
        ?.replace(/[-_]+/g, ' ')
        ?.trim()
      return landingSlug ? `Landing: ${firstSegment(landingSlug)}` : 'Landing de captación'
    }
    if (normalizedSourcePage.includes('/contacto')) {
      return 'Página de contacto'
    }

    try {
      const parsed = new URL(sourcePage)
      if (parsed.pathname && parsed.pathname !== '/') {
        return `Página ${parsed.pathname}`
      }
    } catch {
      // Ignore invalid URLs and continue to path fallback.
    }

    const pathLike = sourcePage.startsWith('/') ? sourcePage : `/${sourcePage}`
    const sanitizedPath = pathLike.split('?')[0].trim()
    if (sanitizedPath && sanitizedPath !== '/') {
      return `Página ${sanitizedPath}`
    }
    return 'Página principal'
  }

  return 'Procedencia orgánica'
}

function resolveCampaignId(lead: Record<string, unknown>): number | null {
  const campaignRelation = lead.campaign
  if (typeof campaignRelation === 'object' && campaignRelation !== null) {
    const relationRecord = campaignRelation as Record<string, unknown>
    return toPositiveInt(relationRecord.id)
  }

  return toPositiveInt(campaignRelation) ?? toPositiveInt((lead as Record<string, unknown>).campaign_id)
}

function resolveCampaignTokens(lead: Record<string, unknown>, sourceDetails: Record<string, unknown> | null): string[] {
  const sourcePage = getFirstString([lead.source_page, sourceDetails?.source_page, sourceDetails?.path])
  const candidates = [
    getFirstString([lead.campaign_code, sourceDetails?.campaign_code]),
    getFirstString([lead.utm_campaign, sourceDetails?.utm_campaign]),
    parseTrackingParamFromUrl(sourcePage, 'utm_campaign'),
  ].filter((value) => value.length > 0)

  return Array.from(
    new Set(
      candidates
        .map((value) => normalizeToken(value))
        .filter((value) => value.length > 0),
    ),
  )
}

function resolveMetaCampaignId(lead: Record<string, unknown>, sourceDetails: Record<string, unknown> | null): string {
  const sourcePage = getFirstString([lead.source_page, sourceDetails?.source_page, sourceDetails?.path])
  return getFirstString([
    lead.meta_campaign_id,
    sourceDetails?.meta_campaign_id,
    parseTrackingParamFromUrl(sourcePage, 'utm_id'),
    parseTrackingParamFromUrl(sourcePage, 'campaign_id'),
  ]).toLowerCase()
}

function firstSegment(value: string): string {
  if (!value) return ''
  const normalized = value.replace(/[_-]+/g, ' ').trim()
  return normalized.length > 0 ? normalized : ''
}

function resolveCampaignMetadata(
  lead: Record<string, unknown>,
  sourceDetails: Record<string, unknown> | null,
  context: CommercialClassificationContext,
): ActiveCampaignMetadata | null {
  const campaignId = resolveCampaignId(lead)
  if (campaignId !== null) {
    const matchById = context.byId.get(campaignId)
    if (matchById) return matchById
  }

  const metaCampaignId = resolveMetaCampaignId(lead, sourceDetails)
  if (metaCampaignId && context.activeMetaCampaignIds.has(metaCampaignId)) {
    return {
      id: null,
      name: `Meta ${metaCampaignId}`,
      isMeta: true,
    }
  }

  const campaignTokens = resolveCampaignTokens(lead, sourceDetails)
  for (const token of campaignTokens) {
    const match = context.byToken.get(token)
    if (match) return match
  }

  return null
}

export function parseCommercialBucketFilter(raw: string | null | undefined): CommercialBucketFilter | null {
  const token = normalizeToken(asString(raw))
  if (token === 'leads') return 'leads'
  if (token === 'inscripciones' || token === 'inscripcion') return 'inscripciones'
  return null
}

export function buildCommercialClassificationContext(
  activeCampaigns: ActiveCampaignSignal[],
): CommercialClassificationContext {
  const byId = new Map<number, ActiveCampaignMetadata>()
  const byToken = new Map<string, ActiveCampaignMetadata>()
  const activeMetaCampaignIds = new Set<string>()

  for (const campaign of activeCampaigns) {
    const normalizedStatus = normalizeToken(asString(campaign.status) || 'active')
    if (normalizedStatus && normalizedStatus !== 'active') continue

    const metadata: ActiveCampaignMetadata = {
      id: toPositiveInt(campaign.id),
      name: asString(campaign.name) || null,
      isMeta: isMetaLikeCampaign(campaign),
    }

    if (metadata.id !== null) {
      byId.set(metadata.id, metadata)
    }

    const utmToken = normalizeToken(asString(campaign.utmCampaign))
    if (utmToken.length > 0) {
      byToken.set(utmToken, metadata)
    }

    const codeToken = normalizeToken(asString(campaign.name))
    if (codeToken.length > 0) {
      byToken.set(codeToken, metadata)
    }

    const nameSegments = asString(campaign.name)
      .split(/\s-\s/)
      .map((segment) => normalizeToken(segment))
      .filter((segment) => segment.length > 0)
    for (const segmentToken of nameSegments) {
      byToken.set(segmentToken, metadata)
    }

    const metaCampaignId = asString(campaign.metaCampaignId).toLowerCase()
    if (metaCampaignId.length > 0) {
      activeMetaCampaignIds.add(metaCampaignId)
    }
  }

  return {
    byId,
    byToken,
    activeMetaCampaignIds,
  }
}

export function classifyLeadCommercialBucket(
  leadInput: Record<string, unknown>,
  context: CommercialClassificationContext,
): CommercialClassification {
  const sourceDetails = toSourceDetails(leadInput.source_details)
  const sourceFormToken = normalizeToken(
    getFirstString([leadInput.source_form, sourceDetails?.source_form]),
  )
  const sourceLabel = resolveSourceLabel(leadInput, sourceDetails)
  const campaignMetadata = resolveCampaignMetadata(leadInput, sourceDetails, context)
  const hasMetaSignal = isMetaSourceSignal(leadInput, sourceDetails)
  const sourcePage = getFirstString([
    leadInput.source_page,
    sourceDetails?.source_page,
    sourceDetails?.path,
  ]).toLowerCase()
  const likelyMetaDestinationForm =
    sourceFormToken === 'preinscripcion_convocatoria' ||
    sourceFormToken === 'preinscripcion_ciclo' ||
    sourceFormToken === 'landing_contact_form' ||
    sourcePage.includes('/convocatorias/') ||
    sourcePage.includes('/ciclos/')

  if (campaignMetadata?.isMeta) {
    return {
      bucket: 'leads',
      unresolved: false,
      adsActive: true,
      campaignLabel: campaignMetadata.name,
      originLabel: 'Landing con campaña activa',
      sourceLabel,
      reason: 'active_meta_campaign',
    }
  }

  if (!hasMetaSignal && context.activeMetaCampaignIds.size > 0 && likelyMetaDestinationForm) {
    return {
      bucket: 'leads',
      unresolved: false,
      adsActive: true,
      campaignLabel: campaignMetadata?.name ?? null,
      originLabel: 'Formulario con campañas activas',
      sourceLabel,
      reason: 'active_meta_campaign',
    }
  }

  if (hasMetaSignal) {
    const campaignHint = getFirstString([
      leadInput.campaign_code,
      leadInput.utm_campaign,
      sourceDetails?.utm_campaign,
    ])
    if (context.activeMetaCampaignIds.size > 0 && likelyMetaDestinationForm) {
      return {
        bucket: 'leads',
        unresolved: false,
        adsActive: true,
        campaignLabel: campaignMetadata?.name ?? (campaignHint || null),
        originLabel: 'Formulario con señal Meta',
        sourceLabel,
        reason: 'active_meta_campaign',
      }
    }

    return {
      bucket: 'unresolved',
      unresolved: true,
      adsActive: false,
      campaignLabel: campaignMetadata?.name ?? null,
      originLabel: 'Origen no resuelto',
      sourceLabel,
      reason: 'meta_source_without_active_campaign',
    }
  }

  return {
    bucket: 'inscripciones',
    unresolved: false,
    adsActive: false,
    campaignLabel: campaignMetadata?.name ?? null,
    originLabel: 'Formulario orgánico',
    sourceLabel,
    reason: 'organic_or_non_meta_campaign',
  }
}

export function matchesCommercialBucketFilter(
  classification: CommercialClassification,
  filter: CommercialBucketFilter,
): boolean {
  if (filter === 'leads') return classification.bucket === 'leads'
  return classification.bucket === 'inscripciones' || classification.bucket === 'unresolved'
}

export function resolveCommercialBadgeLabel(classification: CommercialClassification): string | null {
  if (classification.bucket === 'leads') return 'Ads activo'
  if (classification.bucket === 'unresolved') return 'Origen no resuelto'
  return null
}

function extractProgramFromText(rawValue: unknown): string {
  const text = asString(rawValue)
  if (!text) return ''

  const preinscripcionMatch = text.match(/preinscripci[oó]n\s*:\s*(.+)$/i)
  if (preinscripcionMatch?.[1]) return preinscripcionMatch[1].trim()

  const interesMatch = text.match(/inter[eé]s\s*:\s*(.+)$/i)
  if (interesMatch?.[1]) return interesMatch[1].trim()

  return ''
}

export function resolveLeadProgramLabel(lead: Record<string, unknown>): string {
  const sourceDetails = toSourceDetails(lead.source_details)

  const directCandidates = [
    sourceDetails?.program_name,
    sourceDetails?.course_name,
    sourceDetails?.course,
    sourceDetails?.cycle_name,
    sourceDetails?.convocatoria_name,
    sourceDetails?.convocatoria_code,
    lead.program_name,
    lead.course_name,
    lead.cycle_name,
    lead.convocatoria_name,
    lead.convocatoria_code,
  ]

  const direct = getFirstString(directCandidates)
  if (direct.length > 0) return direct

  const fromCallback = extractProgramFromText(lead.callback_notes)
  if (fromCallback.length > 0) return fromCallback

  const fromMessage = extractProgramFromText(lead.message)
  if (fromMessage.length > 0) return fromMessage

  const campaignCode = firstSegment(getFirstString([lead.campaign_code, lead.utm_campaign, sourceDetails?.utm_campaign]))
  if (campaignCode.length > 0) return campaignCode

  const sourceForm = getFirstString([lead.source_form, sourceDetails?.source_form])
  if (sourceForm.length > 0) return resolveSourceLabel(lead, sourceDetails)

  return 'Programa por confirmar'
}

export function resolveFullLeadName(lead: Record<string, unknown>): string {
  const fullName = asString((lead as Record<string, unknown>).full_name)
  if (fullName.length > 0) return fullName

  const firstName = asString((lead as Record<string, unknown>).first_name)
  const lastName = asString((lead as Record<string, unknown>).last_name)
  const joined = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (joined.length > 0) return joined

  const email = asString((lead as Record<string, unknown>).email)
  if (email.length > 0) return email

  return 'Sin nombre'
}

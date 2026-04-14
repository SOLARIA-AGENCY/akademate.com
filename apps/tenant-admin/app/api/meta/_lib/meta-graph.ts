import { maskSecret, normalizeMetaAdAccountId } from './integrations'

const META_GRAPH_API = 'https://graph.facebook.com/v21.0'
const SOLARIA_FILTER = 'SOLARIA AGENCY'
const MAX_RETRY_ATTEMPTS = 3

export type MetaErrorCode =
  | 'MISCONFIGURED'
  | 'TOKEN_EXPIRED'
  | 'MISSING_PERMISSIONS'
  | 'AD_ACCOUNT_ACCESS_DENIED'
  | 'META_API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'

export type MetaMetricState = 'loaded' | 'zero_real' | 'not_available' | 'api_error'

export interface MetaApiError {
  code: MetaErrorCode
  message: string
  graph_code?: number
  graph_subcode?: number
  fbtrace_id?: string
  token_expires_at?: string | null
}

export interface MetaSourceHealth {
  status: 'ok' | 'degraded'
  token_status: 'valid' | 'missing' | 'expired' | 'invalid'
  permissions_status: 'ok' | 'missing_ads_read' | 'missing_ads_management' | 'unknown'
  permissions: {
    ads_read: boolean
    ads_management: boolean
  }
  ad_account_id: string
  ad_account_access: boolean
  token_masked: string
  token_expires_at: string | null
  checked_at: string
  error?: MetaApiError
}

interface MetaGraphErrorPayload {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

interface MetaGraphResponse<T> {
  ok: boolean
  data?: T
  error?: MetaApiError
}

export interface MetaCampaignNode {
  id: string
  name: string
  status?: string
  effective_status?: string
  objective?: string
  daily_budget?: string
  lifetime_budget?: string
  created_time?: string
  start_time?: string
  stop_time?: string
  updated_time?: string
}

interface MetaInsightsNode {
  spend?: string
  impressions?: string
  reach?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  actions?: Array<{ action_type?: string; value?: string }>
  cost_per_action_type?: Array<{ action_type?: string; value?: string }>
  date_start?: string
  date_stop?: string
}

interface MetaAdSetNode {
  id: string
  campaign_id?: string
  name?: string
  status?: string
  effective_status?: string
  optimization_goal?: string
  billing_event?: string
  daily_budget?: string
  lifetime_budget?: string
  start_time?: string
  end_time?: string
  updated_time?: string
}

interface MetaAdNode {
  id: string
  name?: string
  status?: string
  effective_status?: string
  adset_id?: string
  campaign_id?: string
  updated_time?: string
  creative?: {
    id?: string
    name?: string
    thumbnail_url?: string
    image_url?: string
    video_id?: string
    object_story_spec?: Record<string, unknown>
  }
}

export interface MetaResolvedRange {
  input: '7d' | '30d' | '90d' | 'custom'
  datePreset: 'last_7d' | 'last_30d' | 'last_90d' | null
  since: string
  until: string
  key: string
}

export interface MetaMetricNumber {
  value: number | null
  state: MetaMetricState
}

export interface MetaInsightsSummary {
  range: {
    input: MetaResolvedRange['input']
    since: string
    until: string
  }
  spend: MetaMetricNumber
  impressions: MetaMetricNumber
  reach: MetaMetricNumber
  clicks: MetaMetricNumber
  ctr: MetaMetricNumber
  cpc: MetaMetricNumber
  cpm: MetaMetricNumber
  results: MetaMetricNumber & {
    result_type: string | null
    cost_per_result: number | null
    cost_per_result_state: MetaMetricState
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseTokenExpiry(message: string): string | null {
  const match = message.match(/expired on\s+(.+?)(?:\.\s+The current time is|\.$|$)/i)
  return match?.[1]?.trim() || null
}

function classifyMetaError(raw: MetaGraphErrorPayload): MetaApiError {
  const message = raw.message?.trim() || 'Unknown Meta API error'
  const graphCode = typeof raw.code === 'number' ? raw.code : undefined
  const graphSubcode = typeof raw.error_subcode === 'number' ? raw.error_subcode : undefined

  if (graphCode === 190 || /invalid oauth|invalid access token|session has expired/i.test(message)) {
    return {
      code: 'TOKEN_EXPIRED',
      message,
      graph_code: graphCode,
      graph_subcode: graphSubcode,
      fbtrace_id: raw.fbtrace_id,
      token_expires_at: parseTokenExpiry(message),
    }
  }

  if (graphCode === 200 || graphCode === 10 || /permission|permissions|ads_read|ads_management/i.test(message)) {
    return {
      code: 'MISSING_PERMISSIONS',
      message,
      graph_code: graphCode,
      graph_subcode: graphSubcode,
      fbtrace_id: raw.fbtrace_id,
    }
  }

  if (
    /ad account|act_[0-9]+/i.test(message) &&
    /access|not authorized|cannot|no tiene|does not have/i.test(message)
  ) {
    return {
      code: 'AD_ACCOUNT_ACCESS_DENIED',
      message,
      graph_code: graphCode,
      graph_subcode: graphSubcode,
      fbtrace_id: raw.fbtrace_id,
    }
  }

  return {
    code: 'META_API_ERROR',
    message,
    graph_code: graphCode,
    graph_subcode: graphSubcode,
    fbtrace_id: raw.fbtrace_id,
  }
}

function shouldRetry(status: number | null, error: MetaApiError, attempt: number): boolean {
  if (attempt >= MAX_RETRY_ATTEMPTS) return false
  if (error.code === 'NETWORK_ERROR') return true
  if (status === 429) return true
  if (status !== null && status >= 500) return true
  return false
}

function logMetaCall(input: {
  requestId: string
  endpoint: string
  status: number | null
  durationMs: number
  adAccountId?: string
  error?: MetaApiError
}) {
  const payload = {
    event: 'meta_api_call',
    request_id: input.requestId,
    endpoint: input.endpoint,
    status: input.status,
    duration_ms: input.durationMs,
    ad_account_id: input.adAccountId ?? null,
    error_code: input.error?.code ?? null,
    graph_code: input.error?.graph_code ?? null,
    graph_subcode: input.error?.graph_subcode ?? null,
    fbtrace_id: input.error?.fbtrace_id ?? null,
    ts: new Date().toISOString(),
  }

  if (input.error) {
    console.error('[meta-graph]', payload)
    return
  }

  console.info('[meta-graph]', payload)
}

async function metaGraphGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
  options: { requestId?: string; adAccountId?: string } = {}
): Promise<MetaGraphResponse<T>> {
  const requestId = options.requestId ?? crypto.randomUUID()

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now()
    let responseStatus: number | null = null

    try {
      const url = new URL(`${META_GRAPH_API}${path}`)
      url.searchParams.set('access_token', accessToken)
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }

      const response = await fetch(url.toString(), { cache: 'no-store' })
      responseStatus = response.status
      const payload = (await response.json()) as T & { error?: MetaGraphErrorPayload }

      if (!response.ok || payload.error) {
        const error = classifyMetaError(payload.error || { message: `HTTP ${response.status}` })

        logMetaCall({
          requestId,
          endpoint: path,
          status: responseStatus,
          durationMs: Date.now() - startedAt,
          adAccountId: options.adAccountId,
          error,
        })

        if (shouldRetry(responseStatus, error, attempt)) {
          const jitter = Math.floor(Math.random() * 120)
          await sleep(attempt * 200 + jitter)
          continue
        }

        return { ok: false, error }
      }

      logMetaCall({
        requestId,
        endpoint: path,
        status: responseStatus,
        durationMs: Date.now() - startedAt,
        adAccountId: options.adAccountId,
      })

      return { ok: true, data: payload as T }
    } catch (error) {
      const normalizedError: MetaApiError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error while querying Meta API',
      }

      logMetaCall({
        requestId,
        endpoint: path,
        status: responseStatus,
        durationMs: Date.now() - startedAt,
        adAccountId: options.adAccountId,
        error: normalizedError,
      })

      if (!shouldRetry(responseStatus, normalizedError, attempt)) {
        return { ok: false, error: normalizedError }
      }

      const jitter = Math.floor(Math.random() * 120)
      await sleep(attempt * 200 + jitter)
    }
  }

  return {
    ok: false,
    error: {
      code: 'NETWORK_ERROR',
      message: 'Meta API retries exhausted',
    },
  }
}

function toIsoDate(input: Date): string {
  return input.toISOString().slice(0, 10)
}

export function resolveInsightsRange(searchParams: URLSearchParams): {
  range: MetaResolvedRange
  warnings: string[]
} {
  const warnings: string[] = []
  const raw = (searchParams.get('range') || '30d').trim().toLowerCase()
  const selected = raw === '7d' || raw === '30d' || raw === '90d' || raw === 'custom' ? raw : '30d'

  const now = new Date()
  const defaultUntil = toIsoDate(now)

  if (selected === 'custom') {
    const sinceRaw = searchParams.get('since') || ''
    const untilRaw = searchParams.get('until') || ''

    const sinceDate = new Date(sinceRaw)
    const untilDate = new Date(untilRaw)

    if (Number.isNaN(sinceDate.getTime()) || Number.isNaN(untilDate.getTime()) || sinceDate > untilDate) {
      warnings.push('Rango custom inválido; se aplica 30d por defecto.')
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      const since = toIsoDate(start)
      return {
        range: {
          input: '30d',
          datePreset: 'last_30d',
          since,
          until: defaultUntil,
          key: `30d:${since}:${defaultUntil}`,
        },
        warnings,
      }
    }

    const since = toIsoDate(sinceDate)
    const until = toIsoDate(untilDate)

    return {
      range: {
        input: 'custom',
        datePreset: null,
        since,
        until,
        key: `custom:${since}:${until}`,
      },
      warnings,
    }
  }

  const days = selected === '7d' ? 6 : selected === '90d' ? 89 : 29
  const start = new Date(now)
  start.setDate(start.getDate() - days)
  const since = toIsoDate(start)

  return {
    range: {
      input: selected,
      datePreset: selected === '7d' ? 'last_7d' : selected === '90d' ? 'last_90d' : 'last_30d',
      since,
      until: defaultUntil,
      key: `${selected}:${since}:${defaultUntil}`,
    },
    warnings,
  }
}

function parseNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return numeric
}

function parseInteger(value: string | number | null | undefined): number | null {
  const numeric = parseNumeric(value)
  if (numeric === null) return null
  return Math.trunc(numeric)
}

function toMetricValue(value: number | null): MetaMetricNumber {
  if (value === null) {
    return { value: null, state: 'not_available' }
  }
  if (value === 0) {
    return { value: 0, state: 'zero_real' }
  }
  return { value, state: 'loaded' }
}

const RESULT_PRIORITY = ['lead', 'omni_lead', 'offsite_conversion.fb_pixel_lead'] as const

function resolveResultMetric(
  actions?: Array<{ action_type?: string; value?: string }>,
  costs?: Array<{ action_type?: string; value?: string }>
): {
  resultType: string | null
  value: number | null
  costPerResult: number | null
  valueState: MetaMetricState
  costState: MetaMetricState
} {
  const actionsMap = new Map<string, number>()
  const costMap = new Map<string, number>()

  for (const action of actions ?? []) {
    if (!action?.action_type) continue
    const value = parseNumeric(action.value)
    if (value === null) continue
    actionsMap.set(action.action_type, value)
  }

  for (const cost of costs ?? []) {
    if (!cost?.action_type) continue
    const value = parseNumeric(cost.value)
    if (value === null) continue
    costMap.set(cost.action_type, value)
  }

  const pickAction = (): string | null => {
    for (const candidate of RESULT_PRIORITY) {
      if (actionsMap.has(candidate)) return candidate
    }

    for (const [key, value] of actionsMap.entries()) {
      if (value > 0) return key
    }

    if (actionsMap.size > 0) {
      return actionsMap.keys().next().value ?? null
    }

    return null
  }

  const resultType = pickAction()

  if (!resultType) {
    return {
      resultType: null,
      value: null,
      costPerResult: null,
      valueState: 'not_available',
      costState: 'not_available',
    }
  }

  const value = actionsMap.get(resultType) ?? null
  const cost = costMap.get(resultType) ?? null

  return {
    resultType,
    value,
    costPerResult: cost,
    valueState: value === null ? 'not_available' : value === 0 ? 'zero_real' : 'loaded',
    costState: cost === null ? 'not_available' : cost === 0 ? 'zero_real' : 'loaded',
  }
}

export function buildInsightsSummary(
  range: MetaResolvedRange,
  insightsNode: MetaInsightsNode | null,
  error?: MetaApiError | null
): MetaInsightsSummary {
  if (!insightsNode) {
    const fallbackState: MetaMetricState = error ? 'api_error' : 'not_available'
    return {
      range: {
        input: range.input,
        since: range.since,
        until: range.until,
      },
      spend: { value: null, state: fallbackState },
      impressions: { value: null, state: fallbackState },
      reach: { value: null, state: fallbackState },
      clicks: { value: null, state: fallbackState },
      ctr: { value: null, state: fallbackState },
      cpc: { value: null, state: fallbackState },
      cpm: { value: null, state: fallbackState },
      results: {
        value: null,
        state: fallbackState,
        result_type: null,
        cost_per_result: null,
        cost_per_result_state: fallbackState,
      },
    }
  }

  const resultMetric = resolveResultMetric(insightsNode.actions, insightsNode.cost_per_action_type)

  return {
    range: {
      input: range.input,
      since: insightsNode.date_start || range.since,
      until: insightsNode.date_stop || range.until,
    },
    spend: toMetricValue(parseNumeric(insightsNode.spend)),
    impressions: toMetricValue(parseInteger(insightsNode.impressions)),
    reach: toMetricValue(parseInteger(insightsNode.reach)),
    clicks: toMetricValue(parseInteger(insightsNode.clicks)),
    ctr: toMetricValue(parseNumeric(insightsNode.ctr)),
    cpc: toMetricValue(parseNumeric(insightsNode.cpc)),
    cpm: toMetricValue(parseNumeric(insightsNode.cpm)),
    results: {
      value: resultMetric.value,
      state: resultMetric.valueState,
      result_type: resultMetric.resultType,
      cost_per_result: resultMetric.costPerResult,
      cost_per_result_state: resultMetric.costState,
    },
  }
}

export function parseBudget(dailyBudget?: string, lifetimeBudget?: string): number | null {
  const centsCandidate = dailyBudget || lifetimeBudget || ''
  const cents = Number(centsCandidate)
  if (!Number.isFinite(cents)) return null
  if (cents <= 0) return 0
  return cents / 100
}

export function buildAdsManagerUrl(adAccountId: string, campaignId: string): string {
  return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}&campaign_ids=${campaignId}`
}

export function getPrimaryPreviewFromAds(ads: MetaAdNode[]): {
  thumbnail_url: string | null
  image_url: string | null
  preview_state: 'loaded' | 'not_available'
} {
  for (const ad of ads) {
    const thumbnail = ad.creative?.thumbnail_url || null
    const image = ad.creative?.image_url || null
    if (thumbnail || image) {
      return {
        thumbnail_url: thumbnail,
        image_url: image,
        preview_state: 'loaded',
      }
    }
  }

  return {
    thumbnail_url: null,
    image_url: null,
    preview_state: 'not_available',
  }
}

export async function checkMetaHealth(input: {
  adAccountId: string
  accessToken: string
  requireAdsManagement?: boolean
}): Promise<MetaSourceHealth> {
  const checkedAt = new Date().toISOString()
  const adAccountIdNormalized = normalizeMetaAdAccountId(input.adAccountId)
  const tokenMasked = maskSecret(input.accessToken)
  const permissions = { ads_read: false, ads_management: false }

  const base: MetaSourceHealth = {
    status: 'degraded',
    token_status: 'missing',
    permissions_status: 'unknown',
    permissions,
    ad_account_id: adAccountIdNormalized,
    ad_account_access: false,
    token_masked: tokenMasked,
    token_expires_at: null,
    checked_at: checkedAt,
  }

  if (!input.accessToken.trim()) {
    return {
      ...base,
      error: {
        code: 'MISCONFIGURED',
        message: 'Meta Marketing API token no configurado en el tenant.',
      },
    }
  }

  if (!adAccountIdNormalized) {
    return {
      ...base,
      token_status: 'valid',
      error: {
        code: 'MISCONFIGURED',
        message: 'Meta Ad Account ID no configurado en el tenant.',
      },
    }
  }

  const permissionsResult = await metaGraphGet<{ data?: Array<{ permission?: string; status?: string }> }>(
    '/me/permissions',
    input.accessToken,
    {},
    { adAccountId: adAccountIdNormalized }
  )

  if (permissionsResult.ok && Array.isArray(permissionsResult.data?.data)) {
    for (const entry of permissionsResult.data.data) {
      if (entry.permission === 'ads_read' && entry.status === 'granted') permissions.ads_read = true
      if (entry.permission === 'ads_management' && entry.status === 'granted') permissions.ads_management = true
    }
  } else if (permissionsResult.error?.code === 'TOKEN_EXPIRED') {
    return {
      ...base,
      token_status: 'expired',
      token_expires_at: permissionsResult.error.token_expires_at ?? null,
      error: permissionsResult.error,
    }
  }

  const campaignsProbe = await metaGraphGet<{ data?: Array<{ id: string }> }>(
    `/act_${adAccountIdNormalized}/campaigns`,
    input.accessToken,
    { fields: 'id', limit: '1' },
    { adAccountId: adAccountIdNormalized }
  )

  if (!campaignsProbe.ok) {
    const error = campaignsProbe.error ?? { code: 'META_API_ERROR', message: 'Meta API error' }
    return {
      ...base,
      token_status: error.code === 'TOKEN_EXPIRED' ? 'expired' : 'valid',
      permissions_status: error.code === 'MISSING_PERMISSIONS' ? 'missing_ads_read' : 'unknown',
      token_expires_at: error.token_expires_at ?? null,
      error,
    }
  }

  const requiresManagement = Boolean(input.requireAdsManagement)

  const permissionsStatus = (() => {
    if (permissionsResult.ok) {
      if (!permissions.ads_read) return 'missing_ads_read'
      if (requiresManagement && !permissions.ads_management) return 'missing_ads_management'
      return 'ok'
    }
    return 'unknown'
  })()

  if (permissionsStatus === 'missing_ads_read' || permissionsStatus === 'missing_ads_management') {
    return {
      ...base,
      token_status: 'valid',
      permissions_status: permissionsStatus,
      permissions,
      ad_account_access: true,
      error: {
        code: 'MISSING_PERMISSIONS',
        message:
          permissionsStatus === 'missing_ads_read'
            ? 'El token no tiene permiso ads_read.'
            : 'El token no tiene permiso ads_management.',
      },
    }
  }

  return {
    ...base,
    status: 'ok',
    token_status: 'valid',
    permissions_status: permissionsStatus,
    permissions,
    ad_account_access: true,
  }
}

export async function fetchSolariaCampaigns(input: {
  adAccountId: string
  accessToken: string
  requestId?: string
}): Promise<MetaGraphResponse<{ data: MetaCampaignNode[] }>> {
  const adAccountIdNormalized = normalizeMetaAdAccountId(input.adAccountId)
  return metaGraphGet<{ data: MetaCampaignNode[] }>(
    `/act_${adAccountIdNormalized}/campaigns`,
    input.accessToken,
    {
      fields:
        'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time,updated_time',
      limit: '200',
      filtering: JSON.stringify([
        {
          field: 'name',
          operator: 'CONTAIN',
          value: SOLARIA_FILTER,
        },
      ]),
    },
    {
      requestId: input.requestId,
      adAccountId: adAccountIdNormalized,
    }
  )
}

export async function fetchCampaignById(input: {
  campaignId: string
  adAccountId: string
  accessToken: string
  requestId?: string
}): Promise<MetaGraphResponse<MetaCampaignNode>> {
  return metaGraphGet<MetaCampaignNode>(
    `/${input.campaignId}`,
    input.accessToken,
    {
      fields:
        'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time,updated_time',
    },
    {
      requestId: input.requestId,
      adAccountId: normalizeMetaAdAccountId(input.adAccountId),
    }
  )
}

export async function fetchCampaignInsights(input: {
  campaignId: string
  adAccountId: string
  accessToken: string
  range: MetaResolvedRange
  requestId?: string
}): Promise<MetaGraphResponse<{ data: MetaInsightsNode[] }>> {
  const params: Record<string, string> = {
    fields: 'spend,impressions,reach,clicks,ctr,cpc,cpm,actions,cost_per_action_type,date_start,date_stop',
    level: 'campaign',
    limit: '1',
  }

  if (input.range.datePreset) {
    params.date_preset = input.range.datePreset
  } else {
    params.time_range = JSON.stringify({
      since: input.range.since,
      until: input.range.until,
    })
  }

  return metaGraphGet<{ data: MetaInsightsNode[] }>(
    `/${input.campaignId}/insights`,
    input.accessToken,
    params,
    {
      requestId: input.requestId,
      adAccountId: normalizeMetaAdAccountId(input.adAccountId),
    }
  )
}

export async function fetchCampaignAdSets(input: {
  campaignId: string
  adAccountId: string
  accessToken: string
  requestId?: string
}): Promise<MetaGraphResponse<{ data: MetaAdSetNode[] }>> {
  return metaGraphGet<{ data: MetaAdSetNode[] }>(
    `/${input.campaignId}/adsets`,
    input.accessToken,
    {
      fields:
        'id,campaign_id,name,status,effective_status,optimization_goal,billing_event,daily_budget,lifetime_budget,start_time,end_time,updated_time',
      limit: '200',
    },
    {
      requestId: input.requestId,
      adAccountId: normalizeMetaAdAccountId(input.adAccountId),
    }
  )
}

export async function fetchCampaignAds(input: {
  campaignId: string
  adAccountId: string
  accessToken: string
  limit?: number
  requestId?: string
}): Promise<MetaGraphResponse<{ data: MetaAdNode[] }>> {
  return metaGraphGet<{ data: MetaAdNode[] }>(
    `/${input.campaignId}/ads`,
    input.accessToken,
    {
      fields:
        'id,name,status,effective_status,adset_id,campaign_id,updated_time,creative{id,name,thumbnail_url,image_url,video_id,object_story_spec}',
      limit: String(Math.max(1, Math.min(input.limit ?? 100, 500))),
    },
    {
      requestId: input.requestId,
      adAccountId: normalizeMetaAdAccountId(input.adAccountId),
    }
  )
}

export function mapAdSetBudget(adSet: {
  daily_budget?: string
  lifetime_budget?: string
}): number | null {
  return parseBudget(adSet.daily_budget, adSet.lifetime_budget)
}

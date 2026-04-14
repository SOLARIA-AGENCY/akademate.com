import { maskSecret, normalizeMetaAdAccountId } from './integrations'

const META_GRAPH_API = 'https://graph.facebook.com/v21.0'
const SOLARIA_FILTER = 'SOLARIA AGENCY'

export type MetaErrorCode =
  | 'MISCONFIGURED'
  | 'TOKEN_EXPIRED'
  | 'MISSING_PERMISSIONS'
  | 'AD_ACCOUNT_ACCESS_DENIED'
  | 'META_API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'

export interface MetaApiError {
  code: MetaErrorCode
  message: string
  graph_code?: number
  graph_subcode?: number
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

function parseTokenExpiry(message: string): string | null {
  const match = message.match(/expired on (.+)$/i) || message.match(/expired on ([^.]+)\.?/i)
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
      token_expires_at: parseTokenExpiry(message),
    }
  }

  if (graphCode === 200 || graphCode === 10 || /permission|permissions|ads_read|ads_management/i.test(message)) {
    return {
      code: 'MISSING_PERMISSIONS',
      message,
      graph_code: graphCode,
      graph_subcode: graphSubcode,
    }
  }

  if (/ad account|act_[0-9]+/i.test(message) && /access|not authorized|cannot|no tiene|does not have/i.test(message)) {
    return {
      code: 'AD_ACCOUNT_ACCESS_DENIED',
      message,
      graph_code: graphCode,
      graph_subcode: graphSubcode,
    }
  }

  return {
    code: 'META_API_ERROR',
    message,
    graph_code: graphCode,
    graph_subcode: graphSubcode,
  }
}

async function metaGraphGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<MetaGraphResponse<T>> {
  try {
    const url = new URL(`${META_GRAPH_API}${path}`)
    url.searchParams.set('access_token', accessToken)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url.toString(), { cache: 'no-store' })
    const payload = (await response.json()) as T & { error?: MetaGraphErrorPayload }

    if (!response.ok || payload.error) {
      return {
        ok: false,
        error: classifyMetaError(payload.error || { message: `HTTP ${response.status}` }),
      }
    }

    return { ok: true, data: payload as T }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error while querying Meta API',
      },
    }
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
    input.accessToken
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
    { fields: 'id', limit: '1' }
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
}): Promise<MetaGraphResponse<{ data: MetaCampaignNode[] }>> {
  const adAccountIdNormalized = normalizeMetaAdAccountId(input.adAccountId)
  return metaGraphGet<{ data: MetaCampaignNode[] }>(
    `/act_${adAccountIdNormalized}/campaigns`,
    input.accessToken,
    {
      fields:
        'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time,updated_time',
      limit: '100',
      filtering: JSON.stringify([
        {
          field: 'name',
          operator: 'CONTAIN',
          value: SOLARIA_FILTER,
        },
      ]),
    }
  )
}

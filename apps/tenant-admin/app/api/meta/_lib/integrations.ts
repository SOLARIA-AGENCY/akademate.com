import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { queryFirst, queryRows } from '@/@payload-config/lib/db'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface TenantIntegrations {
  ga4MeasurementId: string
  gtmContainerId: string
  metaPixelId: string
  metaAdAccountId: string
  metaBusinessId: string
  metaConversionsApiToken: string
  metaMarketingApiToken: string
  mailchimpApiKey: string
  whatsappBusinessId: string
}

export type TenantResolutionSource = 'query' | 'session' | 'host' | 'env' | null

export interface TenantResolutionContext {
  authenticated: boolean
  userId: string | number | null
  tenantId: string | null
  source: TenantResolutionSource
}

export interface MetaRequestContext extends TenantResolutionContext {
  integrations: TenantIntegrations
  meta: {
    adAccountId: string
    adAccountIdNormalized: string
    businessId: string
    marketingApiToken: string
    conversionsApiToken: string
    pixelId: string
    tokenMasked: string
  }
}

export const EMPTY_INTEGRATIONS: TenantIntegrations = {
  ga4MeasurementId: '',
  gtmContainerId: '',
  metaPixelId: '',
  metaAdAccountId: '',
  metaBusinessId: '',
  metaConversionsApiToken: '',
  metaMarketingApiToken: '',
  mailchimpApiKey: '',
  whatsappBusinessId: '',
}

const COLUMN_BY_FIELD: Record<keyof TenantIntegrations, string> = {
  ga4MeasurementId: 'integrations_ga4_measurement_id',
  gtmContainerId: 'integrations_gtm_container_id',
  metaPixelId: 'integrations_meta_pixel_id',
  metaAdAccountId: 'integrations_meta_ad_account_id',
  metaBusinessId: 'integrations_meta_business_id',
  metaConversionsApiToken: 'integrations_meta_conversions_api_token',
  metaMarketingApiToken: 'integrations_meta_marketing_api_token',
  mailchimpApiKey: 'integrations_mailchimp_api_key',
  whatsappBusinessId: 'integrations_whatsapp_business_id',
}

let tenantColumnsCache: Set<string> | null = null

function parseTenantIdCandidate(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim()
  if (/^\d+$/.test(normalized)) return normalized
  if (UUID_PATTERN.test(normalized)) return normalized
  return null
}

function normalizeHost(hostHeader?: string | null): string {
  const firstHost = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  return firstHost.replace(/:\d+$/, '')
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return isObjectRecord(value) ? value : {}
}

function pickFirstString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim()
    }
  }
  return ''
}

function mapRawToIntegrations(raw: Record<string, unknown>): TenantIntegrations {
  const integrations = asRecord(raw.integrations)
  const branding = asRecord(raw.branding)
  const brandingIntegrations = asRecord(branding.integrations)

  return {
    ga4MeasurementId: pickFirstString(
      raw.integrations_ga4_measurement_id,
      integrations.ga4MeasurementId,
      integrations.ga4_measurement_id,
      brandingIntegrations.ga4MeasurementId,
      brandingIntegrations.ga4_measurement_id
    ),
    gtmContainerId: pickFirstString(
      raw.integrations_gtm_container_id,
      integrations.gtmContainerId,
      integrations.gtm_container_id,
      brandingIntegrations.gtmContainerId,
      brandingIntegrations.gtm_container_id
    ),
    metaPixelId: pickFirstString(
      raw.integrations_meta_pixel_id,
      integrations.metaPixelId,
      integrations.meta_pixel_id,
      brandingIntegrations.metaPixelId,
      brandingIntegrations.meta_pixel_id
    ),
    metaAdAccountId: pickFirstString(
      raw.integrations_meta_ad_account_id,
      integrations.metaAdAccountId,
      integrations.meta_ad_account_id,
      brandingIntegrations.metaAdAccountId,
      brandingIntegrations.meta_ad_account_id
    ),
    metaBusinessId: pickFirstString(
      raw.integrations_meta_business_id,
      integrations.metaBusinessId,
      integrations.meta_business_id,
      brandingIntegrations.metaBusinessId,
      brandingIntegrations.meta_business_id
    ),
    metaConversionsApiToken: pickFirstString(
      raw.integrations_meta_conversions_api_token,
      integrations.metaConversionsApiToken,
      integrations.meta_conversions_api_token,
      brandingIntegrations.metaConversionsApiToken,
      brandingIntegrations.meta_conversions_api_token
    ),
    metaMarketingApiToken: pickFirstString(
      raw.integrations_meta_marketing_api_token,
      integrations.metaMarketingApiToken,
      integrations.meta_marketing_api_token,
      brandingIntegrations.metaMarketingApiToken,
      brandingIntegrations.meta_marketing_api_token
    ),
    mailchimpApiKey: pickFirstString(
      raw.integrations_mailchimp_api_key,
      integrations.mailchimpApiKey,
      integrations.mailchimp_api_key,
      brandingIntegrations.mailchimpApiKey,
      brandingIntegrations.mailchimp_api_key
    ),
    whatsappBusinessId: pickFirstString(
      raw.integrations_whatsapp_business_id,
      integrations.whatsappBusinessId,
      integrations.whatsapp_business_id,
      brandingIntegrations.whatsappBusinessId,
      brandingIntegrations.whatsapp_business_id
    ),
  }
}

export function normalizeMetaAdAccountId(value: string): string {
  return value.trim().replace(/^act_/i, '')
}

export function maskSecret(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 8) return '*'.repeat(trimmed.length)
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
}

async function getTenantColumns(): Promise<Set<string>> {
  if (tenantColumnsCache) return tenantColumnsCache

  try {
    const rows = await queryRows<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'tenants'`
    )
    tenantColumnsCache = new Set(rows.map((row) => row.column_name))
  } catch {
    tenantColumnsCache = new Set()
  }

  return tenantColumnsCache
}

async function getTenantRawRow(
  tenantId: string
): Promise<{ id: string; raw: Record<string, unknown> } | null> {
  const row = await queryFirst<{ id: string; raw: Record<string, unknown> }>(
    `SELECT id::text AS id, to_jsonb(t) AS raw
     FROM tenants t
     WHERE id::text = $1
     LIMIT 1`,
    [tenantId]
  )

  if (!row || !isObjectRecord(row.raw)) return null
  return row
}

export async function getTenantIntegrations(tenantId: string): Promise<TenantIntegrations | null> {
  const row = await getTenantRawRow(tenantId)
  if (!row) return null
  return mapRawToIntegrations(row.raw)
}

export async function updateTenantIntegrations(
  tenantId: string,
  integrations: TenantIntegrations
): Promise<void> {
  const columns = await getTenantColumns()
  const updateAssignments: string[] = []
  const updateParams: unknown[] = [tenantId]
  let cursor = 2

  for (const [field, column] of Object.entries(COLUMN_BY_FIELD) as Array<
    [keyof TenantIntegrations, string]
  >) {
    if (!columns.has(column)) continue
    updateAssignments.push(`${column} = $${cursor}`)
    updateParams.push(integrations[field] || null)
    cursor += 1
  }

  if (updateAssignments.length > 0) {
    if (columns.has('updated_at')) {
      updateAssignments.push('updated_at = NOW()')
    }
    await queryFirst(
      `UPDATE tenants
       SET ${updateAssignments.join(', ')}
       WHERE id::text = $1`,
      updateParams
    )
  }

  const supportsIntegrationsJson = columns.has('integrations')
  const supportsBrandingJson = columns.has('branding')

  if (!supportsIntegrationsJson && !supportsBrandingJson) {
    return
  }

  const currentRow = await getTenantRawRow(tenantId)
  if (!currentRow) return

  const fallbackAssignments: string[] = []
  const fallbackParams: unknown[] = [tenantId]
  let fallbackCursor = 2

  if (supportsIntegrationsJson) {
    const currentIntegrations = asRecord(currentRow.raw.integrations)
    const nextIntegrations = {
      ...currentIntegrations,
      ...integrations,
    }
    fallbackAssignments.push(`integrations = $${fallbackCursor}::jsonb`)
    fallbackParams.push(JSON.stringify(nextIntegrations))
    fallbackCursor += 1
  }

  if (supportsBrandingJson) {
    const currentBranding = asRecord(currentRow.raw.branding)
    const currentBrandingIntegrations = asRecord(currentBranding.integrations)
    const nextBranding = {
      ...currentBranding,
      integrations: {
        ...currentBrandingIntegrations,
        ...integrations,
      },
    }
    fallbackAssignments.push(`branding = $${fallbackCursor}::jsonb`)
    fallbackParams.push(JSON.stringify(nextBranding))
    fallbackCursor += 1
  }

  if (fallbackAssignments.length > 0) {
    if (columns.has('updated_at')) {
      fallbackAssignments.push('updated_at = NOW()')
    }
    await queryFirst(
      `UPDATE tenants
       SET ${fallbackAssignments.join(', ')}
       WHERE id::text = $1`,
      fallbackParams
    )
  }
}

export async function resolveTenantIdFromHost(hostHeader?: string | null): Promise<string | null> {
  const normalizedHost = normalizeHost(hostHeader)
  if (!normalizedHost || normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return null
  }

  try {
    const byDomain = await queryFirst<{ id: string }>(
      `SELECT id::text AS id
       FROM tenants
       WHERE LOWER(domain) = LOWER($1)
       LIMIT 1`,
      [normalizedHost]
    )
    if (byDomain?.id) return byDomain.id
  } catch {
    // Continue with other strategies.
  }

  try {
    const byDomains = await queryFirst<{ id: string }>(
      `SELECT id::text AS id
       FROM tenants
       WHERE domains @> $1::jsonb
       LIMIT 1`,
      [JSON.stringify([normalizedHost])]
    )
    if (byDomains?.id) return byDomains.id
  } catch {
    // domains column may not exist for this schema.
  }

  const hostParts = normalizedHost.split('.')
  if (hostParts.length >= 3) {
    const slug = hostParts[0]
    if (slug) {
      try {
        const bySlug = await queryFirst<{ id: string }>(
          `SELECT id::text AS id
           FROM tenants
           WHERE slug = $1
           LIMIT 1`,
          [slug]
        )
        if (bySlug?.id) return bySlug.id
      } catch {
        // slug column may not exist in some schemas.
      }
    }
  }

  return null
}

export async function resolveTenantContext(
  request: NextRequest,
  explicitTenantId?: string | null
): Promise<TenantResolutionContext> {
  const queryTenantId = parseTenantIdCandidate(explicitTenantId)
  let authenticated = false
  let userId: string | number | null = null
  let tenantFromSession: string | null = null

  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const authContext = await getAuthenticatedUserContext(request, payload)
    if (authContext) {
      authenticated = true
      userId = authContext.userId
      if (typeof authContext.tenantId === 'number' && authContext.tenantId > 0) {
        tenantFromSession = String(authContext.tenantId)
      }
    }
  } catch {
    // Gracefully continue with host/env fallback.
  }

  if (queryTenantId) {
    return {
      authenticated,
      userId,
      tenantId: queryTenantId,
      source: 'query',
    }
  }

  if (tenantFromSession) {
    return {
      authenticated,
      userId,
      tenantId: tenantFromSession,
      source: 'session',
    }
  }

  const tenantFromHost = await resolveTenantIdFromHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  )
  if (tenantFromHost) {
    return {
      authenticated,
      userId,
      tenantId: tenantFromHost,
      source: 'host',
    }
  }

  const envTenantId = parseTenantIdCandidate(
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? null
  )
  if (envTenantId) {
    return {
      authenticated,
      userId,
      tenantId: envTenantId,
      source: 'env',
    }
  }

  return {
    authenticated,
    userId,
    tenantId: null,
    source: null,
  }
}

export async function resolveMetaRequestContext(
  request: NextRequest,
  explicitTenantId?: string | null
): Promise<MetaRequestContext> {
  const tenantContext = await resolveTenantContext(request, explicitTenantId)
  const integrations =
    tenantContext.tenantId ? (await getTenantIntegrations(tenantContext.tenantId)) ?? EMPTY_INTEGRATIONS : EMPTY_INTEGRATIONS

  const adAccountId = integrations.metaAdAccountId || process.env.META_AD_ACCOUNT_ID || ''
  const marketingApiToken =
    integrations.metaMarketingApiToken || process.env.META_MARKETING_API_TOKEN || ''

  return {
    ...tenantContext,
    integrations,
    meta: {
      adAccountId,
      adAccountIdNormalized: normalizeMetaAdAccountId(adAccountId),
      businessId: integrations.metaBusinessId,
      marketingApiToken,
      conversionsApiToken:
        integrations.metaConversionsApiToken || process.env.META_CONVERSIONS_API_TOKEN || '',
      pixelId: integrations.metaPixelId || process.env.META_PIXEL_ID || '',
      tokenMasked: maskSecret(marketingApiToken),
    },
  }
}

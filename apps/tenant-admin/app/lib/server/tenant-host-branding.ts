import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const CEP_LOGO = '/logos/cep-formacion-logo-rectangular.png'
const CEP_FAVICON = '/logos/cep-formacion-isotipo.svg'

type BrandingDefaults = {
  academyName: string
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  isCepTenant: boolean
}

const AKADEMATE_DEFAULTS: BrandingDefaults = {
  academyName: 'Akademate',
  logoUrl: '/logos/akademate-logo-official.png',
  faviconUrl: '/logos/akademate-favicon.svg',
  primaryColor: '#0066CC',
  isCepTenant: false,
}

const CEP_DEFAULTS: BrandingDefaults = {
  academyName: 'CEP Formación',
  logoUrl: CEP_LOGO,
  faviconUrl: CEP_FAVICON,
  primaryColor: '#cc0000',
  isCepTenant: true,
}

export type TenantHostBranding = {
  host: string
  origin: string
  tenantId: string
  academyName: string
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  metaPixelId: string
  ga4MeasurementId: string
  contactPhone: string
  contactPhoneAlternative: string
  isCepTenant: boolean
}

type TenantDoc = {
  id?: string | number
  name?: string
  slug?: string
  domain?: string
  branding_logo_url?: string | null
  branding_primary_color?: string | null
  branding_favicon?: { url?: string | null } | number | null
  integrations_meta_pixel_id?: string | null
  integrations_ga4_measurement_id?: string | null
  integrations?: {
    metaPixelId?: string | null
    ga4MeasurementId?: string | null
  } | null
  contact_phone?: string | null
  contact_phone_alternative?: string | null
} | null

function normalizeHost(rawHost: string | null | undefined): string {
  const firstHost = (rawHost ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  return firstHost.replace(/:\d+$/, '')
}

function isLocalHost(host: string): boolean {
  return host === '' || host === 'localhost' || host === '127.0.0.1'
}

function hostLooksLikeCep(host: string): boolean {
  return /(^|\.)cepformacion(\.|$)/i.test(host) || host.includes('cep-formacion')
}

function buildOrigin(host: string): string {
  const runtimeHost = host || 'akademate.com'
  const protocol = runtimeHost === 'localhost' || runtimeHost === '127.0.0.1' ? 'http' : 'https'
  return `${protocol}://${runtimeHost}`
}

function resolveDefaults(host: string): BrandingDefaults {
  return hostLooksLikeCep(host) ? CEP_DEFAULTS : AKADEMATE_DEFAULTS
}

function normalizeAssetUrl(assetUrl: string | null | undefined): string {
  if (!assetUrl || assetUrl.trim() === '') return ''
  return assetUrl.trim()
}

function toTenantResponse(
  host: string,
  tenant: TenantDoc,
  defaults: BrandingDefaults
): TenantHostBranding {
  const origin = buildOrigin(host || 'akademate.com')
  const logoFromTenant = normalizeAssetUrl(tenant?.branding_logo_url)
  const faviconFromTenant =
    tenant?.branding_favicon && typeof tenant.branding_favicon === 'object'
      ? normalizeAssetUrl(tenant.branding_favicon.url)
      : ''
  const resolvedLogo = logoFromTenant || defaults.logoUrl
  const resolvedFavicon =
    faviconFromTenant ||
    (hostLooksLikeCep(host) ? CEP_FAVICON : '') ||
    logoFromTenant ||
    defaults.faviconUrl
  const resolvedName = tenant?.name?.trim() || defaults.academyName
  const resolvedPrimary = tenant?.branding_primary_color?.trim() || defaults.primaryColor
  const resolvedTenantId = tenant?.id != null ? String(tenant.id) : 'default'

  return {
    host,
    origin,
    tenantId: resolvedTenantId,
    academyName: resolvedName,
    logoUrl: resolvedLogo,
    faviconUrl: resolvedFavicon,
    primaryColor: resolvedPrimary,
    metaPixelId:
      tenant?.integrations_meta_pixel_id?.trim() ||
      tenant?.integrations?.metaPixelId?.trim() ||
      '',
    ga4MeasurementId:
      tenant?.integrations_ga4_measurement_id?.trim() ||
      tenant?.integrations?.ga4MeasurementId?.trim() ||
      '',
    contactPhone: tenant?.contact_phone?.trim() || '',
    contactPhoneAlternative: tenant?.contact_phone_alternative?.trim() || '',
    isCepTenant: defaults.isCepTenant || hostLooksLikeCep(host),
  }
}

const resolveByHost = cache(async (host: string): Promise<TenantHostBranding> => {
  const normalizedHost = normalizeHost(host)
  const defaults = resolveDefaults(normalizedHost)

  if (isLocalHost(normalizedHost)) {
    return toTenantResponse(normalizedHost || 'localhost', null, defaults)
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const byDomain = await payload.find({
      collection: 'tenants',
      where: {
        domain: { equals: normalizedHost },
      },
      depth: 1,
      limit: 1,
    })

    let tenant = (byDomain.docs[0] ?? null) as TenantDoc

    if (!tenant) {
      const hostParts = normalizedHost.split('.')
      const slug = hostParts.length >= 3 ? hostParts[0] : ''
      if (slug && slug !== 'www' && slug !== 'admin' && slug !== 'app') {
        const bySlug = await payload.find({
          collection: 'tenants',
          where: {
            slug: { equals: slug },
          },
          depth: 1,
          limit: 1,
        })
        tenant = (bySlug.docs[0] ?? null) as TenantDoc
      }
    }

    return toTenantResponse(normalizedHost, tenant, defaults)
  } catch {
    return toTenantResponse(normalizedHost, null, defaults)
  }
})

export async function getTenantHostBranding(): Promise<TenantHostBranding> {
  const headerStore = await Promise.resolve(headers())
  const normalizedHost = normalizeHost(
    headerStore.get('x-forwarded-host') || headerStore.get('host')
  )
  return resolveByHost(normalizedHost)
}

export function toAbsoluteAssetUrl(origin: string, assetUrl: string): string {
  if (!assetUrl) {
    let fallbackLogo = AKADEMATE_DEFAULTS.logoUrl
    try {
      const hostname = new URL(origin).hostname
      if (hostLooksLikeCep(hostname)) {
        fallbackLogo = CEP_LOGO
      }
    } catch {
      if (hostLooksLikeCep(origin)) {
        fallbackLogo = CEP_LOGO
      }
    }
    return fallbackLogo.startsWith('/') ? `${origin}${fallbackLogo}` : fallbackLogo
  }
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl
  return assetUrl.startsWith('/') ? `${origin}${assetUrl}` : `${origin}/${assetUrl}`
}

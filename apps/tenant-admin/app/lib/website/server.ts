import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { queryFirst } from '@/@payload-config/lib/db'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { CEP_DEFAULT_WEBSITE } from './defaults'
import { normalizeWebsiteConfig } from './editor'
import type { WebsiteConfig, WebsitePage } from './types'

const WEBSITE_START = '\n[AKADEMATE_WEBSITE]\n'
const WEBSITE_END = '\n[/AKADEMATE_WEBSITE]\n'

function extractWebsiteFromNotes(notes: string | null | undefined): WebsiteConfig | null {
  if (!notes) return null
  const start = notes.indexOf(WEBSITE_START)
  const end = notes.indexOf(WEBSITE_END)
  if (start === -1 || end === -1 || end <= start) return null
  const raw = notes.slice(start + WEBSITE_START.length, end).trim()
  if (!raw) return null
  try {
    return JSON.parse(raw) as WebsiteConfig
  } catch {
    return null
  }
}

export function mergeWebsiteConfig(input?: Partial<WebsiteConfig> | null): WebsiteConfig {
  if (!input) return normalizeWebsiteConfig(CEP_DEFAULT_WEBSITE)
  return normalizeWebsiteConfig({
    ...CEP_DEFAULT_WEBSITE,
    ...input,
    visualIdentity: {
      ...CEP_DEFAULT_WEBSITE.visualIdentity,
      ...(input.visualIdentity ?? {}),
    },
    navigation: {
      ...CEP_DEFAULT_WEBSITE.navigation,
      ...(input.navigation ?? {}),
      items: input.navigation?.items ?? CEP_DEFAULT_WEBSITE.navigation.items,
    },
    footer: {
      ...CEP_DEFAULT_WEBSITE.footer,
      ...(input.footer ?? {}),
      columns: input.footer?.columns ?? CEP_DEFAULT_WEBSITE.footer.columns,
    },
    redirects: input.redirects ?? CEP_DEFAULT_WEBSITE.redirects,
    pages: input.pages ?? CEP_DEFAULT_WEBSITE.pages,
  })
}

const getTenantWebsiteByIdCached = cache(async (tenantId: string): Promise<WebsiteConfig> => {
  if (!/^\d+$/.test(tenantId)) return CEP_DEFAULT_WEBSITE
  const row = await queryFirst<{ notes: string | null }>(
    'SELECT notes FROM tenants WHERE id = $1 LIMIT 1',
    [Number.parseInt(tenantId, 10)]
  )
  const parsed = extractWebsiteFromNotes(row?.notes)
  return mergeWebsiteConfig(parsed)
})

export async function getTenantWebsite(): Promise<WebsiteConfig> {
  const tenant = await getTenantHostBranding()
  return getTenantWebsiteByIdCached(tenant.tenantId)
}

export async function getPublicPage(pathname: string): Promise<WebsitePage | null> {
  const website = await getTenantWebsite()
  return website.pages.find((page) => page.path === pathname || page.slug === pathname.replace(/^\//, '').replace(/\//g, '--')) ?? null
}

export async function getRequestPathname(): Promise<string> {
  const headerStore = await Promise.resolve(headers())
  return headerStore.get('x-pathname') ?? '/'
}

export function serializeWebsiteNotes(existingNotes: string | null | undefined, website: WebsiteConfig): string {
  const current = existingNotes ?? ''
  const start = current.indexOf(WEBSITE_START)
  const end = current.indexOf(WEBSITE_END)
  const serialized = `${WEBSITE_START}${JSON.stringify(website, null, 2)}${WEBSITE_END}`
  if (start === -1 || end === -1 || end <= start) {
    return `${current.trimEnd()}${serialized}`.trim()
  }

  const before = current.slice(0, start)
  const after = current.slice(end + WEBSITE_END.length)
  return `${before}${serialized}${after}`.trim()
}

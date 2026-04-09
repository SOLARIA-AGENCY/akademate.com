import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { queryFirst } from '@/@payload-config/lib/db'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  buildThumbnailHash,
  buildThumbnailSvg,
  findPageBySlug,
  normalizeWebsiteConfig,
  normalizeWebsitePage,
  slugFromPath,
  upsertPageBySlug,
} from '@/app/lib/website/editor'
import { CEP_DEFAULT_WEBSITE } from '@/app/lib/website/defaults'
import { mergeWebsiteConfig, serializeWebsiteNotes } from '@/app/lib/website/server'
import type { WebsiteConfig, WebsitePage } from '@/app/lib/website/types'

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

export async function resolveTenantIdFromRuntime(): Promise<string> {
  const branding = await getTenantHostBranding()
  return branding.tenantId
}

async function getWebsiteByTenantId(tenantId: string): Promise<WebsiteConfig> {
  if (!tenantId) return normalizeWebsiteConfig(CEP_DEFAULT_WEBSITE)

  const isNumeric = /^\d+$/.test(tenantId)
  if (isNumeric) {
    const row = await queryFirst<{ notes: string | null }>(
      `SELECT notes FROM tenants WHERE id = $1 LIMIT 1`,
      [parseInt(tenantId, 10)]
    )
    return mergeWebsiteConfig(extractWebsiteFromNotes(row?.notes))
  }

  const row = await queryFirst<{ branding: unknown }>(
    `SELECT branding FROM tenants WHERE id = $1 LIMIT 1`,
    [tenantId]
  )
  const raw = (row?.branding as Record<string, unknown> | undefined)?.website ?? null
  return mergeWebsiteConfig((raw ?? null) as Partial<WebsiteConfig> | null)
}

async function updateWebsiteByTenantId(tenantId: string, website: WebsiteConfig): Promise<void> {
  const isNumeric = /^\d+$/.test(tenantId)
  if (isNumeric) {
    const existing = await queryFirst<{ notes: string | null }>(
      `SELECT notes FROM tenants WHERE id = $1 LIMIT 1`,
      [parseInt(tenantId, 10)]
    )
    const nextNotes = serializeWebsiteNotes(existing?.notes, website)
    await queryFirst(`UPDATE tenants SET notes = $2, updated_at = NOW() WHERE id = $1`, [
      parseInt(tenantId, 10),
      nextNotes,
    ])
    return
  }

  const existing = await queryFirst<{ branding: unknown }>(
    `SELECT branding FROM tenants WHERE id = $1 LIMIT 1`,
    [tenantId]
  )
  const currentBranding = ((existing?.branding ?? {}) as Record<string, unknown>) || {}
  const nextBranding = {
    ...currentBranding,
    website,
  }
  await queryFirst(`UPDATE tenants SET branding = $2::jsonb, updated_at = NOW() WHERE id = $1`, [
    tenantId,
    JSON.stringify(nextBranding),
  ])
}

export async function ensureThumbnailForPage(
  tenantId: string,
  website: WebsiteConfig,
  page: WebsitePage
): Promise<string> {
  const pageSlug = page.slug || slugFromPath(page.path)
  const hash = buildThumbnailHash(page, website.visualIdentity.colorPrimary)
  const relativeDir = `/website-cache/${tenantId}`
  const fileName = `${pageSlug}.${hash}.svg`
  const relativeUrl = `${relativeDir}/${fileName}`
  const absoluteDir = path.join(process.cwd(), 'public', 'website-cache', tenantId)
  const absolutePath = path.join(absoluteDir, fileName)

  await mkdir(absoluteDir, { recursive: true })
  const svg = buildThumbnailSvg(page, website.visualIdentity.colorPrimary, website.visualIdentity.colorText)
  await writeFile(absolutePath, svg, 'utf-8')

  return relativeUrl
}

export async function getWebsitePageBySlug(slug: string): Promise<{
  tenantId: string
  website: WebsiteConfig
  page: WebsitePage | null
}> {
  const tenantId = await resolveTenantIdFromRuntime()
  const website = await getWebsiteByTenantId(tenantId)
  const page = findPageBySlug(website, slug)
  return { tenantId, website, page }
}

export async function saveWebsitePage(
  slug: string,
  inputPage: WebsitePage,
  regenerateThumbnail = true
): Promise<{
  tenantId: string
  website: WebsiteConfig
  page: WebsitePage
}> {
  const tenantId = await resolveTenantIdFromRuntime()
  const website = await getWebsiteByTenantId(tenantId)
  const normalizedPage = normalizeWebsitePage(inputPage)
  let nextWebsite = upsertPageBySlug(website, slug, normalizedPage)
  let nextPage = findPageBySlug(nextWebsite, slug) || normalizedPage

  if (regenerateThumbnail) {
    const thumbnailUrl = await ensureThumbnailForPage(tenantId, nextWebsite, nextPage)
    nextPage = normalizeWebsitePage({
      ...nextPage,
      thumbnailUrl,
    })
    nextWebsite = upsertPageBySlug(nextWebsite, slug, nextPage)
  }

  await updateWebsiteByTenantId(tenantId, nextWebsite)
  return {
    tenantId,
    website: nextWebsite,
    page: nextPage,
  }
}

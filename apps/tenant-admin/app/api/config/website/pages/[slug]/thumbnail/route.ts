import { NextRequest, NextResponse } from 'next/server'
import { normalizeWebsitePage } from '@/app/lib/website/editor'
import { ensureThumbnailForPage, getWebsitePageBySlug, saveWebsitePage } from '../../_lib'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const normalizedSlug = decodeURIComponent(slug)
    const result = await getWebsitePageBySlug(normalizedSlug)
    if (!result.page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }

    const thumbnailUrl = await ensureThumbnailForPage(result.tenantId, result.website, result.page)
    const pageWithThumbnail = normalizeWebsitePage({
      ...result.page,
      thumbnailUrl,
    })
    await saveWebsitePage(normalizedSlug, pageWithThumbnail, false)

    return NextResponse.json({
      success: true,
      data: {
        thumbnailUrl,
        page: pageWithThumbnail,
      },
    })
  } catch (error) {
    console.error('Error regenerating page thumbnail:', error)
    return NextResponse.json({ success: false, error: 'Error regenerating thumbnail' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeWebsitePage } from '@/app/lib/website/editor'
import type { WebsitePage } from '@/app/lib/website/types'
import { getWebsitePageBySlug, saveWebsitePage } from '../_lib'

const websitePageSchema = z.object({
  title: z.string().min(1),
  path: z.string().min(1),
  slug: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  pageKind: z.enum([
    'home',
    'standard',
    'contact',
    'faq_index',
    'blog_index',
    'legal',
    'courses_index',
    'course_detail_template',
    'convocations_index',
    'convocation_detail_template',
    'cycles_index',
    'cycle_detail_template',
    'campuses_index',
    'campus_detail_template',
  ]),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  sections: z.array(z.any()),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const result = await getWebsitePageBySlug(decodeURIComponent(slug))
    if (!result.page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: {
        page: result.page,
      },
    })
  } catch (error) {
    console.error('Error reading website page:', error)
    return NextResponse.json({ success: false, error: 'Error reading page' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const body = (await request.json()) as { page?: WebsitePage; regenerateThumbnail?: boolean }
    const parsed = websitePageSchema.safeParse(body.page)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid page payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const normalized = normalizeWebsitePage(parsed.data as WebsitePage)
    const result = await saveWebsitePage(decodeURIComponent(slug), normalized, body.regenerateThumbnail !== false)
    return NextResponse.json({
      success: true,
      data: {
        page: result.page,
      },
    })
  } catch (error) {
    console.error('Error updating website page:', error)
    return NextResponse.json({ success: false, error: 'Error updating page' }, { status: 500 })
  }
}

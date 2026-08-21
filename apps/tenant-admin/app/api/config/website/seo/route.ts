import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { guardConfigRequest } from '@/app/api/config/_lib/guard'
import { getWebsiteConfig, saveWebsiteSeo } from '../pages/_lib'

const seoSchema = z.object({
  keywords: z.array(z.string().min(1).max(80)).max(40),
  concepts: z.array(z.string().min(1).max(160)).max(20),
})

export async function GET(request: NextRequest) {
  const guard = await guardConfigRequest(request, { method: 'read' })
  if (guard.response) return guard.response
  const { website } = await getWebsiteConfig()
  return NextResponse.json({
    success: true,
    data: {
      keywords: website.seo?.keywords ?? [],
      concepts: website.seo?.concepts ?? [],
    },
  })
}

export async function PUT(request: NextRequest) {
  const guard = await guardConfigRequest(request, { method: 'write' })
  if (guard.response) return guard.response
  const parsed = seoSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'SEO inválido' }, { status: 400 })
  }
  const website = await saveWebsiteSeo(parsed.data)
  return NextResponse.json({
    success: true,
    data: {
      keywords: website.seo?.keywords ?? [],
      concepts: website.seo?.concepts ?? [],
    },
  })
}

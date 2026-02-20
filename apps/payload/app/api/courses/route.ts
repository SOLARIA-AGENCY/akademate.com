import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = toPositiveInt(url.searchParams.get('page'), 1)
    const limit = toPositiveInt(url.searchParams.get('limit'), 20)

    const payload = await getPayload({ config })
    const courses = await payload.find({
      collection: 'courses',
      page,
      limit,
      depth: 1,
      sort: '-updatedAt',
      where: {
        status: {
          equals: 'published',
        },
      },
      overrideAccess: true,
    })

    return NextResponse.json(courses, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[payload/api/courses] Failed to load courses:', error)
    return NextResponse.json(
      {
        docs: [],
        totalDocs: 0,
        limit: 20,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      { status: 200 },
    )
  }
}

import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface LeadsWhere {
  status?: { equals: string }
  or?: Array<Record<string, { like: string }>>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 200)
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const sort = searchParams.get('sort') ?? '-createdAt'
    const status = searchParams.get('status')
    const search = searchParams.get('q')?.trim()

    const where: LeadsWhere = {}

    if (status) {
      where.status = { equals: status }
    }

    if (search) {
      where.or = [
        { first_name: { like: search } },
        { last_name: { like: search } },
        { email: { like: search } },
        { phone: { like: search } },
      ]
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const leads = await payload.find({
      collection: 'leads',
      where: Object.keys(where).length > 0 ? (where as unknown as Record<string, unknown>) : undefined,
      limit,
      page,
      sort,
      depth: 1,
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('[API][Leads] Failed to fetch leads:', error)

    // Degrade gracefully to avoid breaking dashboard pages in partially migrated envs.
    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      limit: 25,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      warning: 'Leads no disponibles temporalmente.',
    })
  }
}

import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { NextResponse, type NextRequest } from 'next/server'
import type { Payload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') ?? '50')
    const page = Number(searchParams.get('page') ?? '1')
    const sort = searchParams.get('sort') ?? '-createdAt'
    const status = searchParams.get('status')

    const payload: Payload = await getPayloadHMR({ config: configPromise })

    const where = status
      ? {
          status: {
            equals: status,
          },
        }
      : undefined

    const students = await payload.find({
      collection: 'students',
      where,
      limit,
      page,
      sort,
      overrideAccess: true,
    })

    return NextResponse.json(students)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener alumnos'
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}

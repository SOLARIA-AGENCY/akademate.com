import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { NextResponse, type NextRequest } from 'next/server'
import type { Payload } from 'payload'
import { getAuthenticatedUserContext } from '../leads/_lib/auth'

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

async function resolveTenantId(request: NextRequest, payload: Payload): Promise<number | null> {
  const authContext = await getAuthenticatedUserContext(request, payload)
  const queryTenantId = toPositiveInt(request.nextUrl.searchParams.get('tenantId'))
  const envTenantId = toPositiveInt(
    process.env.DEFAULT_TENANT_ID ?? process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID,
  )

  return authContext?.tenantId ?? queryTenantId ?? envTenantId
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') ?? '50')
    const page = Number(searchParams.get('page') ?? '1')
    const sort = searchParams.get('sort') ?? '-createdAt'
    const status = searchParams.get('status')

    const payload: Payload = await getPayloadHMR({ config: configPromise })
    const tenantId = await resolveTenantId(request, payload)

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant requerido para consultar alumnos',
        },
        { status: 401 },
      )
    }

    const where = {
      and: [
        {
          tenant: {
            equals: tenantId,
          },
        },
        ...(status
          ? [
              {
                status: {
                  equals: status,
                },
              },
            ]
          : []),
      ],
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const payload: Payload = await getPayloadHMR({ config: configPromise })
    const tenantId = await resolveTenantId(request, payload)

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          errors: [{ message: 'Tenant requerido para crear alumnos' }],
        },
        { status: 401 },
      )
    }

    const doc = await payload.create({
      collection: 'students',
      data: {
        ...body,
        tenant: tenantId,
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({ doc }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear alumno'
    return NextResponse.json(
      {
        success: false,
        errors: [{ message }],
      },
      { status: 500 },
    )
  }
}

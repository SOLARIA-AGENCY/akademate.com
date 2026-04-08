import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logRequest } from '@/lib/api-logger'
import { createTenant, listTenants } from '@/lib/ops/tenants'

export const dynamic = 'force-dynamic'

const tenantsListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().optional(),
})

const tenantCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  domain: z.string().trim().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  limitsMaxUsers: z.coerce.number().int().min(1).default(50),
  limitsMaxCourses: z.coerce.number().int().min(1).default(100),
  limitsMaxLeadsPerMonth: z.coerce.number().int().min(1).default(5000),
  limitsStorageQuotaMB: z.coerce.number().int().min(128).default(10240),
})

export async function GET(request: Request) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  const { searchParams } = new URL(request.url)
  const validation = tenantsListSchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  })

  if (!validation.success) {
    logRequest({ method: 'GET', path: '/api/ops/tenants', status: 400, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Parámetros inválidos', details: validation.error.flatten() }, { status: 400 })
  }

  try {
    const result = await listTenants(validation.data)
    logRequest({ method: 'GET', path: '/api/ops/tenants', status: 200, latencyMs: Date.now() - start, ip })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[ops/tenants] DB error', error)
    logRequest({ method: 'GET', path: '/api/ops/tenants', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al consultar tenants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  try {
    const body = await request.json()
    const validation = tenantCreateSchema.safeParse(body)

    if (!validation.success) {
      logRequest({ method: 'POST', path: '/api/ops/tenants', status: 400, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'Datos inválidos', details: validation.error.flatten() }, { status: 400 })
    }

    const result = await createTenant({
      ...validation.data,
      domain: validation.data.domain || null,
      contactEmail: validation.data.contactEmail || null,
      contactPhone: validation.data.contactPhone || null,
      notes: validation.data.notes || null,
    })

    logRequest({ method: 'POST', path: '/api/ops/tenants', status: 201, latencyMs: Date.now() - start, ip, tenantId: result.id })
    return NextResponse.json({ doc: result }, { status: 201 })
  } catch (error: unknown) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      logRequest({ method: 'POST', path: '/api/ops/tenants', status: 409, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 })
    }
    console.error('[ops/tenants POST] DB error', error)
    logRequest({ method: 'POST', path: '/api/ops/tenants', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al crear tenant' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logRequest } from '@/lib/api-logger'
import { getTenantById, updateTenant } from '@/lib/ops/tenants'

export const dynamic = 'force-dynamic'

const updateTenantSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  domain: z.string().trim().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  active: z.boolean(),
  limitsMaxUsers: z.coerce.number().int().min(1),
  limitsMaxCourses: z.coerce.number().int().min(1),
  limitsMaxLeadsPerMonth: z.coerce.number().int().min(1),
  limitsStorageQuotaMB: z.coerce.number().int().min(128),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  const { id } = await params

  try {
    const tenant = await getTenantById(id)

    if (!tenant) {
      logRequest({ method: 'GET', path: '/api/ops/tenants/[id]', status: 404, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    logRequest({ method: 'GET', path: '/api/ops/tenants/[id]', status: 200, latencyMs: Date.now() - start, ip, tenantId: tenant.id })
    return NextResponse.json({ doc: tenant })
  } catch (error) {
    console.error('[ops/tenants/:id GET] error', error)
    logRequest({ method: 'GET', path: '/api/ops/tenants/[id]', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al cargar tenant' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined
  const { id } = await params

  try {
    const body = await request.json()
    const validation = updateTenantSchema.safeParse(body)

    if (!validation.success) {
      logRequest({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 400, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'Datos inválidos', details: validation.error.flatten() }, { status: 400 })
    }

    const tenant = await updateTenant(id, {
      ...validation.data,
      domain: validation.data.domain || null,
      contactEmail: validation.data.contactEmail || null,
      contactPhone: validation.data.contactPhone || null,
      notes: validation.data.notes || null,
    })

    if (!tenant) {
      logRequest({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 404, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    logRequest({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 200, latencyMs: Date.now() - start, ip, tenantId: tenant.id })
    return NextResponse.json({ doc: tenant })
  } catch (error: unknown) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      logRequest({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 409, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 })
    }
    console.error('[ops/tenants/:id PATCH] error', error)
    logRequest({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al actualizar tenant' }, { status: 500 })
  }
}

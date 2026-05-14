import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { withTenantScope } from '@/app/lib/server/tenant-scope'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RelationValue = string | number | { id?: string | number; name?: string; codigo?: string; code?: string } | null | undefined

type CourseRunDoc = {
  id: string | number
  tenant?: RelationValue
  campus?: RelationValue
  classroom?: RelationValue
  course?: RelationValue
  cycle?: RelationValue
  codigo?: string
  start_date?: string
  end_date?: string
  schedule_days?: string[]
  schedule_time_start?: string
  schedule_time_end?: string
  status?: string
  planning_status?: string
}

function relationId(value: RelationValue): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  return null
}

function sameId(a: RelationValue, b: RelationValue) {
  const left = relationId(a)
  const right = relationId(b)
  return left != null && right != null && String(left) === String(right)
}

function toTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const raw = value.trim()
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  return undefined
}

function toSeconds(value?: string): number | null {
  if (!value) return null
  const parts = value.split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return null
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] ?? 0)
}

function dateRangesOverlap(startA?: string, endA?: string, startB?: string, endB?: string) {
  if (!startA || !endA || !startB || !endB) return false
  return new Date(startA) <= new Date(endB) && new Date(startB) <= new Date(endA)
}

function timeRangesOverlap(startA?: string, endA?: string, startB?: string, endB?: string) {
  const aStart = toSeconds(startA)
  const aEnd = toSeconds(endA)
  const bStart = toSeconds(startB)
  const bEnd = toSeconds(endB)
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false
  return aStart < bEnd && bStart < aEnd
}

function daysOverlap(a?: string[], b?: string[]) {
  if (!a?.length || !b?.length) return false
  const set = new Set(b)
  return a.some((day) => set.has(day))
}

async function findTenantDoc(payload: any, collection: string, id: unknown, tenantId: number) {
  const resolvedId = relationId(id as RelationValue)
  if (resolvedId == null) return null
  const result = await payload.find({
    collection,
    where: withTenantScope({ id: { equals: resolvedId } }, tenantId) as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

async function validateClassroomAvailability(payload: any, candidate: CourseRunDoc, tenantId: number) {
  const classroomId = relationId(candidate.classroom)
  if (!classroomId || !candidate.start_date || !candidate.end_date || !candidate.schedule_days?.length || !candidate.schedule_time_start || !candidate.schedule_time_end) {
    return null
  }

  const existing = await payload.find({
    collection: 'course-runs',
    where: withTenantScope(
      {
        and: [
          { id: { not_equals: candidate.id } },
          { classroom: { equals: classroomId } },
          { status: { not_in: ['cancelled', 'completed'] } },
        ],
      },
      tenantId,
    ) as any,
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })

  const conflict = (existing.docs as CourseRunDoc[]).find((run) => {
    return (
      dateRangesOverlap(candidate.start_date, candidate.end_date, run.start_date, run.end_date) &&
      daysOverlap(candidate.schedule_days, run.schedule_days) &&
      timeRangesOverlap(candidate.schedule_time_start, candidate.schedule_time_end, run.schedule_time_start, run.schedule_time_end)
    )
  })

  if (!conflict) return null
  const classroomName = typeof conflict.classroom === 'object' ? (conflict.classroom.name ?? conflict.classroom.code) : `Aula ${classroomId}`
  return {
    error: 'Aula ocupada en esa franja horaria.',
    detail: `${classroomName ?? 'El aula'} ya está asignada a ${conflict.codigo ?? `convocatoria ${conflict.id}`}.`,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const authContext = await getAuthenticatedUserContext(request, payload as any)
  if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ id: { equals: id } }, authContext.tenantId) as any,
    limit: 1,
    depth: Number(new URL(request.url).searchParams.get('depth') ?? 2),
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc) return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
  return NextResponse.json({ doc })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const authContext = await getAuthenticatedUserContext(request, payload as any)
    if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const existing = await payload.find({
      collection: 'course-runs',
      where: withTenantScope({ id: { equals: id } }, authContext.tenantId) as any,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const current = existing.docs[0] as CourseRunDoc | undefined
    if (!current) return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })

    const body = (await request.json()) as Record<string, unknown>
    const data: Record<string, unknown> = {}

    if ('start_date' in body) data.start_date = body.start_date
    if ('end_date' in body) data.end_date = body.end_date
    if ('price_override' in body) data.price_override = body.price_override === '' ? null : body.price_override
    if ('price_snapshot' in body) data.price_snapshot = body.price_snapshot === '' ? null : body.price_snapshot
    if ('enrollment_fee_snapshot' in body) data.enrollment_fee_snapshot = body.enrollment_fee_snapshot === '' ? null : body.enrollment_fee_snapshot
    if ('campus' in body) data.campus = body.campus || null
    if ('classroom' in body) data.classroom = body.classroom || null
    if ('schedule_days' in body) data.schedule_days = Array.isArray(body.schedule_days) ? body.schedule_days : []
    if ('schedule_time_start' in body) data.schedule_time_start = toTime(body.schedule_time_start) ?? null
    if ('schedule_time_end' in body) data.schedule_time_end = toTime(body.schedule_time_end) ?? null
    if ('shift' in body) data.shift = body.shift || null

    const startDate = String(data.start_date ?? current.start_date ?? '')
    const endDate = String(data.end_date ?? current.end_date ?? '')
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' }, { status: 400 })
    }

    for (const field of ['price_override', 'price_snapshot', 'enrollment_fee_snapshot']) {
      if (data[field] != null && Number(data[field]) < 0) {
        return NextResponse.json({ error: 'Los importes no pueden ser negativos.' }, { status: 400 })
      }
    }

    if (data.campus) {
      const campus = await findTenantDoc(payload, 'campuses', data.campus, authContext.tenantId)
      if (!campus) return NextResponse.json({ error: 'La sede seleccionada no pertenece a este tenant.' }, { status: 403 })
    }

    if (data.classroom) {
      const classroom = await findTenantDoc(payload, 'classrooms', data.classroom, authContext.tenantId)
      if (!classroom) return NextResponse.json({ error: 'El aula seleccionada no pertenece a este tenant.' }, { status: 403 })
      const selectedCampus = (data.campus ?? current.campus) as RelationValue
      if (selectedCampus && !sameId(classroom.campus as RelationValue, selectedCampus)) {
        return NextResponse.json({ error: 'El aula seleccionada no pertenece a la sede indicada.' }, { status: 400 })
      }
    }

    const candidate = { ...current, ...data, id: current.id } as CourseRunDoc
    const conflict = await validateClassroomAvailability(payload, candidate, authContext.tenantId)
    if (conflict) return NextResponse.json(conflict, { status: 409 })

    const updated = await payload.update({
      collection: 'course-runs',
      id,
      data,
      depth: 2,
      overrideAccess: true,
    })

    return NextResponse.json({ doc: updated, message: 'Cambios guardados' })
  } catch (error) {
    console.error('[course-runs/:id] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron guardar los cambios' },
      { status: 500 },
    )
  }
}

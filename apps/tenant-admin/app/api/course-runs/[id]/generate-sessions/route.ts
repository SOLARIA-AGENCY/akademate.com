import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import {
  evaluateCourseRunAvailability,
  evaluateCourseRunInstructorReadiness,
  normalizeTime,
  relationId,
  type CourseRunPlanningDoc,
} from '@/app/lib/server/course-run-planning'
import { withTenantScope } from '@/app/lib/server/tenant-scope'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function toDayOnlyIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function relationNumber(value: unknown): number | undefined {
  const id = relationId(value)
  if (!id) return undefined
  const numeric = Number(id)
  return Number.isFinite(numeric) ? numeric : undefined
}

function buildSessionDates(run: CourseRunPlanningDoc) {
  const start = parseDate(run.start_date)
  const end = parseDate(run.end_date)
  const days = new Set(run.schedule_days ?? [])
  if (!start || !end || end < start || days.size === 0) return []

  const dates: Array<{ date: string; weekday: string }> = []
  const cursor = new Date(start)
  cursor.setHours(12, 0, 0, 0)
  const last = new Date(end)
  last.setHours(12, 0, 0, 0)

  while (cursor <= last) {
    const weekday = WEEKDAY_KEYS[cursor.getDay()]
    if (days.has(weekday)) {
      dates.push({ date: toDayOnlyIso(cursor), weekday })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const payloadAny = payload as any
    const authContext = await getAuthenticatedUserContext(request, payload as any)
    if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const result = await payload.find({
      collection: 'course-runs',
      where: withTenantScope({ id: { equals: id } }, authContext.tenantId) as any,
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    const run = result.docs[0] as CourseRunPlanningDoc | undefined
    if (!run) return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })

    const timeStart = normalizeTime(run.schedule_time_start)
    const timeEnd = normalizeTime(run.schedule_time_end)
    const sessionDates = buildSessionDates(run)

    if (!timeStart || !timeEnd || sessionDates.length === 0) {
      return NextResponse.json({
        error: 'La convocatoria necesita fechas, días y horario para generar sesiones.',
      }, { status: 400 })
    }

    const availability = await evaluateCourseRunAvailability(payload, run, authContext.tenantId)
    const instructorReadiness = await evaluateCourseRunInstructorReadiness(payload, run, authContext.tenantId)
    const blockers = [...availability.blockers, ...instructorReadiness.blockers]
    if (blockers.length > 0) {
      return NextResponse.json({
        error: 'No se pueden generar sesiones porque la planificación tiene conflictos.',
        blockers,
        warnings: [...availability.warnings, ...instructorReadiness.warnings],
      }, { status: 409 })
    }

    const existing = await payloadAny.find({
      collection: 'course-run-sessions',
      where: withTenantScope({ course_run: { equals: run.id } }, authContext.tenantId) as any,
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const existingKeys = new Set((existing.docs as any[]).map((session) => {
      const rawDate = typeof session.session_date === 'string' ? session.session_date.slice(0, 10) : ''
      return `${rawDate}|${session.time_start}|${session.time_end}`
    }))

    const created = []
    for (const session of sessionDates) {
      const key = `${session.date}|${timeStart}|${timeEnd}`
      if (existingKeys.has(key)) continue

      const doc = await payloadAny.create({
        collection: 'course-run-sessions',
        data: {
          title: `${run.codigo ?? 'Convocatoria'} · ${session.date}`,
          course_run: run.id,
          session_date: session.date,
          weekday: session.weekday,
          time_start: timeStart,
          time_end: timeEnd,
          campus: relationNumber(run.campus),
          classroom: relationNumber(run.classroom),
          instructor: relationNumber(run.instructor),
          status: 'scheduled',
          tenant: authContext.tenantId,
        },
        overrideAccess: true,
      })
      created.push(doc)
    }

    return NextResponse.json({
      created: created.length,
      skipped: sessionDates.length - created.length,
      total: sessionDates.length,
      message: created.length > 0 ? 'Sesiones generadas' : 'Las sesiones ya estaban generadas',
    })
  } catch (error) {
    console.error('[course-runs/:id/generate-sessions] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron generar las sesiones' },
      { status: 500 },
    )
  }
}

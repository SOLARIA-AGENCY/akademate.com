/** Protected student progress API for the internal Campus Virtual. */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { campusEnrollmentBelongsToStudent, readCampusSession } from '@/src/lib/campus/auth'
import { isLessonProgressStorageAvailable } from '../_lib/lessonProgressStorage'

type ProgressSql = ReturnType<typeof postgres>

interface ProgressRow {
  id: number | string
  enrollment: number | string
  lesson: number | string
  isCompleted: boolean | null
  completedAt: string | Date | null
  timeSpent: number | string | null
  lastAccessAt: string | Date | null
  lastPosition: number | string | null
}

interface ProgressUpdateBody {
  enrollmentId?: string
  lessonId?: string
  isCompleted?: boolean
  timeSpent?: number
  lastPosition?: number
}

let progressSql: ProgressSql | null | undefined

function getProgressSql(): ProgressSql | null {
  if (progressSql !== undefined) return progressSql
  const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABASE_URI
  progressSql = databaseUrl ? postgres(databaseUrl) : null
  return progressSql
}

function numericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function serializeProgress(row: ProgressRow) {
  return {
    id: String(row.id),
    enrollment: String(row.enrollment),
    lesson: String(row.lesson),
    isCompleted: Boolean(row.isCompleted),
    completedAt: toIso(row.completedAt),
    timeSpent: Number(row.timeSpent ?? 0),
    lastAccessAt: toIso(row.lastAccessAt),
    lastPosition: Number(row.lastPosition ?? 0),
  }
}

async function authorizedRequest(request: NextRequest): Promise<{
  session: Awaited<ReturnType<typeof readCampusSession>>
  sql: ProgressSql
} | NextResponse> {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const session = await readCampusSession(request)
  if (!session) return NextResponse.json({ success: false, error: 'Sesion no valida.' }, { status: 401 })

  const sql = getProgressSql()
  if (!sql) {
    return NextResponse.json({ success: false, error: 'El almacenamiento de progreso no esta disponible en este entorno.' }, { status: 503 })
  }

  return { session, sql }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const enrollmentId = searchParams.get('enrollmentId')
  if (!enrollmentId) return NextResponse.json({ success: false, error: 'enrollmentId es obligatorio.' }, { status: 400 })

  const authorized = await authorizedRequest(request)
  if (authorized instanceof NextResponse) return authorized
  const { session, sql } = authorized
  if (!session || !(await campusEnrollmentBelongsToStudent(session.student.id, enrollmentId))) {
    return NextResponse.json({ success: false, error: 'No tienes acceso a esta matricula.' }, { status: 403 })
  }

  const enrollmentNumericId = numericId(enrollmentId)
  if (!enrollmentNumericId) return NextResponse.json({ success: false, error: 'enrollmentId no es valido.' }, { status: 400 })

  try {
    const enrollmentRows = await sql`
      SELECT e.id, e.status::text AS status, e.course_run_id, cr.course_id
      FROM enrollments e
      LEFT JOIN course_runs cr ON cr.id = e.course_run_id
      WHERE e.id = ${enrollmentNumericId}
      LIMIT 1
    `
    const enrollment = enrollmentRows[0]
    if (!enrollment) return NextResponse.json({ success: false, error: 'Matricula no encontrada.' }, { status: 404 })

    if (!(await isLessonProgressStorageAvailable())) {
      return NextResponse.json({ success: false, error: 'El almacenamiento de progreso no esta disponible en este entorno.' }, { status: 503 })
    }

    const rows = await sql`
      SELECT
        id,
        enrollment_id AS enrollment,
        lesson_id AS lesson,
        is_completed AS "isCompleted",
        completed_at AS "completedAt",
        time_spent AS "timeSpent",
        last_access_at AS "lastAccessAt",
        last_position AS "lastPosition"
      FROM lesson_progress
      WHERE enrollment_id = ${enrollmentNumericId}
      ORDER BY created_at DESC
      LIMIT 500
    ` as ProgressRow[]

    const enrollmentAccess = session.enrollments.find((item) => item.id === enrollmentId)
    let totalLessons = rows.length
    if (enrollmentAccess?.courseId) {
      const courseId = numericId(enrollmentAccess.courseId)
      if (courseId) {
        const lessonCountRows = await sql`
          SELECT COUNT(*)::int AS count
          FROM lessons l
          INNER JOIN modules m ON m.id = l.module_id
          WHERE m.course_id = ${courseId}
            AND m.is_published = true
            AND l.is_published = true
        `
        totalLessons = Number(lessonCountRows[0]?.count ?? 0)
      }
    }

    const completedLessons = rows.filter((progress) => progress.isCompleted === true).length
    const totalTimeSpent = rows.reduce((total, progress) => total + Number(progress.timeSpent ?? 0), 0)
    return NextResponse.json({
      success: true,
      data: {
        enrollmentId,
        courseRunId: enrollment.course_run_id === null ? null : String(enrollment.course_run_id),
        status: String(enrollment.status ?? ''),
        completedLessons,
        totalLessons,
        progressPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
        totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
        lessonProgress: rows.map(serializeProgress),
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[LMS Progress] GET error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cargar el progreso.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: ProgressUpdateBody
  try {
    body = await request.json() as ProgressUpdateBody
  } catch {
    return NextResponse.json({ success: false, error: 'Cuerpo JSON no valido.' }, { status: 400 })
  }

  const { enrollmentId, lessonId, isCompleted, timeSpent, lastPosition } = body
  if (!enrollmentId || !lessonId) {
    return NextResponse.json({ success: false, error: 'enrollmentId y lessonId son obligatorios.' }, { status: 400 })
  }
  if (timeSpent !== undefined && (!Number.isFinite(timeSpent) || timeSpent < 0)) {
    return NextResponse.json({ success: false, error: 'timeSpent no es valido.' }, { status: 400 })
  }
  if (lastPosition !== undefined && (!Number.isFinite(lastPosition) || lastPosition < 0)) {
    return NextResponse.json({ success: false, error: 'lastPosition no es valido.' }, { status: 400 })
  }

  const authorized = await authorizedRequest(request)
  if (authorized instanceof NextResponse) return authorized
  const { session, sql } = authorized
  if (!session || !(await campusEnrollmentBelongsToStudent(session.student.id, enrollmentId))) {
    return NextResponse.json({ success: false, error: 'No tienes acceso a esta matricula.' }, { status: 403 })
  }
  if (!(await isLessonProgressStorageAvailable())) {
    return NextResponse.json({ success: false, error: 'El almacenamiento de progreso no esta disponible en este entorno.' }, { status: 503 })
  }

  const enrollmentNumericId = numericId(enrollmentId)
  const lessonNumericId = numericId(lessonId)
  if (!enrollmentNumericId || !lessonNumericId) {
    return NextResponse.json({ success: false, error: 'enrollmentId y lessonId no son validos.' }, { status: 400 })
  }

  const enrollmentAccess = session.enrollments.find((item) => item.id === enrollmentId)
  const courseId = enrollmentAccess?.courseId ? numericId(enrollmentAccess.courseId) : null
  const tenantId = numericId(String(session.student.tenantId ?? ''))
  if (!courseId || !tenantId) {
    return NextResponse.json({ success: false, error: 'La matricula no tiene un contexto de campus valido.' }, { status: 403 })
  }

  try {
    const lessonRows = await sql`
      SELECT l.id
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      WHERE l.id = ${lessonNumericId}
        AND l.is_published = true
        AND m.course_id = ${courseId}
        AND m.is_published = true
      LIMIT 1
    `
    if (!lessonRows[0]) {
      return NextResponse.json({ success: false, error: 'La leccion no pertenece a esta matricula.' }, { status: 403 })
    }

    const existingRows = await sql`
      SELECT is_completed, completed_at, time_spent, last_position
      FROM lesson_progress
      WHERE enrollment_id = ${enrollmentNumericId}
        AND lesson_id = ${lessonNumericId}
      LIMIT 1
    `
    const existing = existingRows[0]
    const completed = isCompleted ?? Boolean(existing?.is_completed ?? false)
    const completedAt = completed ? existing?.completed_at ?? new Date().toISOString() : null
    const time = timeSpent ?? Number(existing?.time_spent ?? 0)
    const position = lastPosition ?? Number(existing?.last_position ?? 0)

    const progressRows = await sql`
      INSERT INTO lesson_progress (
        enrollment_id,
        lesson_id,
        is_completed,
        completed_at,
        time_spent,
        last_access_at,
        last_position,
        tenant_id,
        updated_at,
        created_at
      ) VALUES (
        ${enrollmentNumericId},
        ${lessonNumericId},
        ${completed},
        ${completedAt},
        ${time},
        NOW(),
        ${position},
        ${tenantId},
        NOW(),
        COALESCE((SELECT created_at FROM lesson_progress WHERE enrollment_id = ${enrollmentNumericId} AND lesson_id = ${lessonNumericId} LIMIT 1), NOW())
      )
      ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET
        is_completed = EXCLUDED.is_completed,
        completed_at = EXCLUDED.completed_at,
        time_spent = EXCLUDED.time_spent,
        last_access_at = EXCLUDED.last_access_at,
        last_position = EXCLUDED.last_position,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW()
      RETURNING
        id,
        enrollment_id AS enrollment,
        lesson_id AS lesson,
        is_completed AS "isCompleted",
        completed_at AS "completedAt",
        time_spent AS "timeSpent",
        last_access_at AS "lastAccessAt",
        last_position AS "lastPosition"
    ` as ProgressRow[]

    return NextResponse.json({ success: true, data: serializeProgress(progressRows[0]) })
  } catch (error) {
    console.error('[LMS Progress] POST error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo guardar el progreso.' }, { status: 500 })
  }
}

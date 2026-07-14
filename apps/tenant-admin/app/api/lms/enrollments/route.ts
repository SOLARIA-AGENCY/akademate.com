/**
 * Protected LMS enrollment list for the internal Campus Virtual.
 *
 * The campus_enrollments bridge is the authorization source. This endpoint
 * does not query the historical Payload enrollment graph, which can hydrate
 * unrelated administrative subcollections that are absent in staging.
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { campusSql, readCampusSession } from '@/src/lib/campus/auth'

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function numericIds(values: string[]): number[] {
  return values.map(Number).filter((value) => Number.isInteger(value) && value > 0)
}

export async function GET(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError
  if (!campusSql) {
    return NextResponse.json({ success: false, error: 'Base del Campus no disponible.' }, { status: 503 })
  }

  const session = await readCampusSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesión no autorizada.' }, { status: 401 })
  }

  const tenantId = Number(session.student.tenantId)
  const enrollmentIds = numericIds(session.enrollments.map((enrollment) => enrollment.id))
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return NextResponse.json({ success: false, error: 'La sesión no tiene tenant válido.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')?.trim() || null
  const limit = Math.min(100, positiveInteger(searchParams.get('limit'), 20))
  const page = positiveInteger(searchParams.get('page'), 1)
  const offset = (page - 1) * limit

  if (enrollmentIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      meta: { page, limit, totalDocs: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    })
  }

  try {
    const enrollmentIdList = campusSql.array(enrollmentIds)
    const countRows = await campusSql`
      SELECT COUNT(*)::int AS total
      FROM enrollments e
      WHERE e.id = ANY(${enrollmentIdList}::int[])
        AND (${status}::text IS NULL OR e.status::text = ${status})
    `
    const totalDocs = Number((countRows[0] as Record<string, unknown> | undefined)?.total ?? 0)

    const rows = await campusSql`
      WITH lesson_totals AS (
        SELECT m.course_id, COUNT(l.id)::int AS total_lessons
        FROM modules m
        INNER JOIN lessons l ON l.module_id = m.id
          AND l.tenant_id = ${tenantId}
          AND l.is_published = true
        WHERE m.tenant_id = ${tenantId}
          AND m.is_published = true
        GROUP BY m.course_id
      ),
      progress_totals AS (
        SELECT lp.enrollment_id,
               COUNT(*) FILTER (WHERE lp.is_completed = true)::int AS completed_lessons
        FROM lesson_progress lp
        INNER JOIN lessons l ON l.id = lp.lesson_id
          AND l.tenant_id = ${tenantId}
          AND l.is_published = true
        INNER JOIN modules m ON m.id = l.module_id
          AND m.tenant_id = ${tenantId}
          AND m.is_published = true
        WHERE lp.tenant_id = ${tenantId}
          AND lp.enrollment_id = ANY(${enrollmentIdList}::int[])
        GROUP BY lp.enrollment_id
      )
      SELECT
        e.id,
        e.status::text AS status,
        e.created_at,
        e.enrolled_at,
        cr.id AS course_run_id,
        cr.codigo AS course_run_title,
        cr.course_id,
        c.name AS course_title,
        COALESCE(lt.total_lessons, 0)::int AS total_lessons,
        COALESCE(pt.completed_lessons, 0)::int AS completed_lessons
      FROM enrollments e
      INNER JOIN course_runs cr ON cr.id = e.course_run_id
      INNER JOIN courses c ON c.id = cr.course_id
      LEFT JOIN lesson_totals lt ON lt.course_id = cr.course_id
      LEFT JOIN progress_totals pt ON pt.enrollment_id = e.id
      WHERE e.id = ANY(${enrollmentIdList}::int[])
        AND (${status}::text IS NULL OR e.status::text = ${status})
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const data = rows.map((row) => {
      const enrollment = row as Record<string, unknown>
      const totalLessons = Number(enrollment.total_lessons ?? 0)
      const completedLessons = Number(enrollment.completed_lessons ?? 0)
      return {
        id: String(enrollment.id),
        status: String(enrollment.status ?? 'pending'),
        enrolledAt: enrollment.enrolled_at ?? enrollment.created_at ?? null,
        courseRun: {
          id: String(enrollment.course_run_id),
          title: String(enrollment.course_run_title ?? ''),
          course: {
            id: String(enrollment.course_id),
            title: String(enrollment.course_title ?? 'Curso'),
            thumbnail: null,
          },
        },
        progress: {
          completed: completedLessons,
          total: totalLessons,
          percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        },
      }
    })

    const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / limit) : 0
    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        totalDocs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1 && totalDocs > 0,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[LMS Enrollments] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudieron cargar las matrículas.' }, { status: 500 })
  }
}

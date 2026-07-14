/**
 * Protected LMS enrollment detail endpoint for the internal Campus Virtual.
 *
 * This route deliberately uses the isolated LMS tables directly. The legacy
 * Payload enrollment relation still points to leads in older tenants and
 * hydrates academic relations that are not part of the student contract.
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import {
  campusEnrollmentBelongsToStudent,
  campusSql,
  readCampusSession,
} from '@/src/lib/campus/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface EnrollmentLessonProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  progressPercent: number
}

function numericId(value: string | null): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isoDate(value: unknown): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError
  if (!campusSql) {
    return NextResponse.json({ success: false, error: 'Base del Campus no disponible.' }, { status: 503 })
  }

  const { id } = await params
  const enrollmentId = numericId(id)
  if (!enrollmentId) {
    return NextResponse.json({ success: false, error: 'La matrícula no es válida.' }, { status: 400 })
  }

  const session = await readCampusSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesión no autorizada.' }, { status: 401 })
  }
  if (!(await campusEnrollmentBelongsToStudent(session.student.id, String(enrollmentId)))) {
    return NextResponse.json({ success: false, error: 'La matrícula no está autorizada.' }, { status: 403 })
  }

  const tenantId = numericId(String(session.student.tenantId))
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'La matrícula no tiene un contexto válido.' }, { status: 403 })
  }

  try {
    const enrollmentRows = await campusSql`
      SELECT
        e.id,
        e.status,
        e.enrolled_at,
        e.completed_at,
        cr.id AS course_run_id,
        cr.codigo AS course_run_title,
        cr.start_date,
        cr.end_date,
        cr.status AS course_run_status,
        c.id AS course_id,
        c.name AS course_title,
        c.slug AS course_slug,
        c.short_description AS course_description,
        media.url AS course_thumbnail
      FROM enrollments e
      JOIN course_runs cr ON cr.id = e.course_run_id
        AND cr.tenant_id = ${tenantId}
      JOIN courses c ON c.id = cr.course_id
        AND c.tenant_id = ${tenantId}
      LEFT JOIN media ON media.id = c.featured_image_id
      WHERE e.id = ${enrollmentId}
      LIMIT 1
    `
    const enrollment = enrollmentRows[0] as Record<string, unknown> | undefined
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Matrícula no encontrada.' }, { status: 404 })
    }

    const courseId = Number(enrollment.course_id)
    const moduleRows = await campusSql`
      SELECT id, title, description, "order", estimated_duration_minutes
      FROM modules
      WHERE course_id = ${courseId}
        AND tenant_id = ${tenantId}
        AND is_published = true
      ORDER BY "order" ASC, id ASC
    `
    const moduleIds = moduleRows.map((row) => Number((row as Record<string, unknown>).id)).filter(Number.isInteger)
    const lessonRows = moduleIds.length === 0
      ? []
      : await campusSql`
          SELECT id, module_id, title, "order", estimated_duration_minutes, requires_completion
          FROM lessons
          WHERE module_id = ANY(${campusSql.array(moduleIds)}::int[])
            AND tenant_id = ${tenantId}
            AND is_published = true
          ORDER BY module_id ASC, "order" ASC, id ASC
        `
    const lessonIds = lessonRows.map((row) => Number((row as Record<string, unknown>).id)).filter(Number.isInteger)
    const progressRows = lessonIds.length === 0
      ? []
      : await campusSql`
          SELECT lesson_id, is_completed, watched_percentage
          FROM lesson_progress
          WHERE enrollment_id = ${enrollmentId}
            AND tenant_id = ${tenantId}
            AND lesson_id = ANY(${campusSql.array(lessonIds)}::int[])
        `
    const progressByLesson = new Map<string, EnrollmentLessonProgress>(progressRows.map((row): [string, EnrollmentLessonProgress] => {
      const item = row as Record<string, unknown>
      return [String(item.lesson_id), {
        status: item.is_completed === true
          ? 'completed'
          : Number(item.watched_percentage ?? 0) > 0 ? 'in_progress' : 'not_started',
        progressPercent: Number(item.watched_percentage ?? 0),
      }]
    }))
    const lessonsByModule = new Map<string, Record<string, unknown>[]>()
    for (const row of lessonRows) {
      const lesson = row as Record<string, unknown>
      const key = String(lesson.module_id)
      const list = lessonsByModule.get(key) ?? []
      list.push(lesson)
      lessonsByModule.set(key, list)
    }

    const completedLessons = lessonRows.filter((row) => {
      const progress = progressByLesson.get(String((row as Record<string, unknown>).id))
      return progress?.status === 'completed'
    }).length
    const totalLessons = lessonRows.length

    return NextResponse.json({
      success: true,
      data: {
        enrollment: {
          id: String(enrollment.id),
          status: String(enrollment.status ?? 'confirmed'),
          enrolledAt: isoDate(enrollment.enrolled_at),
          startedAt: isoDate(enrollment.enrolled_at),
          completedAt: isoDate(enrollment.completed_at),
        },
        course: {
          id: String(enrollment.course_id),
          title: String(enrollment.course_title ?? ''),
          slug: enrollment.course_slug ?? null,
          description: enrollment.course_description ?? null,
          thumbnail: enrollment.course_thumbnail ?? null,
        },
        courseRun: {
          id: String(enrollment.course_run_id),
          title: String(enrollment.course_run_title ?? ''),
          startDate: isoDate(enrollment.start_date),
          endDate: isoDate(enrollment.end_date),
          status: enrollment.course_run_status ?? null,
        },
        modules: moduleRows.map((row) => {
          const module = row as Record<string, unknown>
          const lessons = lessonsByModule.get(String(module.id)) ?? []
          return {
            id: String(module.id),
            title: String(module.title ?? ''),
            description: module.description ?? null,
            order: Number(module.order ?? 0),
            estimatedMinutes: Number(module.estimated_duration_minutes ?? 0),
            lessons: lessons.map((lesson) => ({
              id: String(lesson.id),
              title: String(lesson.title ?? ''),
              description: null,
              order: Number(lesson.order ?? 0),
              estimatedMinutes: Number(lesson.estimated_duration_minutes ?? 0),
              isMandatory: lesson.requires_completion !== false,
              progress: progressByLesson.get(String(lesson.id)) ?? {
                status: 'not_started',
                progressPercent: 0,
              },
            })),
            lessonsCount: lessons.length,
          }
        }),
        progress: {
          totalModules: moduleRows.length,
          totalLessons,
          completedLessons,
          progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          status: completedLessons === totalLessons && totalLessons > 0
            ? 'completed'
            : completedLessons > 0 ? 'in_progress' : 'not_started',
        },
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[LMS Enrollment] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cargar la matrícula.' }, { status: 500 })
  }
}

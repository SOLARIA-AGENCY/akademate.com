/**
 * Protected LMS lesson endpoint for the internal Campus Virtual.
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import {
  campusEnrollmentBelongsToStudent,
  campusSql,
  readCampusSession,
} from '@/src/lib/campus/auth'

interface LessonRouteParams {
  params: Promise<{ id: string }>
}

function numericId(value: string | null): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export async function GET(request: NextRequest, { params }: LessonRouteParams) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError
  if (!campusSql) {
    return NextResponse.json({ success: false, error: 'Base del Campus no disponible.' }, { status: 503 })
  }

  const { id: lessonId } = await params
  const enrollmentId = new URL(request.url).searchParams.get('enrollmentId')
  const lessonNumericId = numericId(lessonId)
  const enrollmentNumericId = numericId(enrollmentId)
  if (!lessonNumericId || !enrollmentNumericId) {
    return NextResponse.json({ success: false, error: 'lessonId y enrollmentId deben ser válidos.' }, { status: 400 })
  }

  const session = await readCampusSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesión no autorizada.' }, { status: 401 })
  }
  const enrollmentAccess = session.enrollments.find((item) => item.id === String(enrollmentNumericId))
  if (!enrollmentAccess || !(await campusEnrollmentBelongsToStudent(session.student.id, String(enrollmentNumericId)))) {
    return NextResponse.json({ success: false, error: 'La matrícula no está autorizada.' }, { status: 403 })
  }

  const tenantId = numericId(String(session.student.tenantId))
  const courseId = numericId(enrollmentAccess.courseId)
  if (!tenantId || !courseId) {
    return NextResponse.json({ success: false, error: 'La matrícula no tiene contexto académico válido.' }, { status: 403 })
  }

  try {
    const lessonRows = await campusSql`
      SELECT
        l.id,
        l.title,
        l.content,
        l."order",
        l.estimated_duration_minutes,
        l.requires_completion,
        l.video_url,
        l.video_duration_seconds,
        m.id AS module_id,
        m.title AS module_title,
        m.course_id,
        c.id AS course_id,
        c.name AS course_title
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
        AND m.tenant_id = ${tenantId}
        AND m.is_published = true
      INNER JOIN courses c ON c.id = m.course_id
      WHERE l.id = ${lessonNumericId}
        AND l.tenant_id = ${tenantId}
        AND l.is_published = true
        AND m.course_id = ${courseId}
      LIMIT 1
    `
    const lesson = lessonRows[0] as Record<string, unknown> | undefined
    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lección no encontrada.' }, { status: 404 })
    }

    const [progressRows, materialRows, navigationRows] = await Promise.all([
      campusSql`
        SELECT id, is_completed, watched_percentage, last_position, completed_at
        FROM lesson_progress
        WHERE enrollment_id = ${enrollmentNumericId}
          AND lesson_id = ${lessonNumericId}
          AND tenant_id = ${tenantId}
        LIMIT 1
      `,
      campusSql`
        SELECT id, title, material_type, file_size_bytes
        FROM materials
        WHERE lesson_id = ${lessonNumericId}
          AND tenant_id = ${tenantId}
          AND is_published = true
        ORDER BY "order" ASC, id ASC
      `,
      campusSql`
        SELECT id, title, "order"
        FROM lessons
        WHERE module_id = ${Number(lesson.module_id)}
          AND tenant_id = ${tenantId}
          AND is_published = true
        ORDER BY "order" ASC, id ASC
      `,
    ])

    const progress = progressRows[0] as Record<string, unknown> | undefined
    const isCompleted = progress?.is_completed === true
    const progressPercent = Number(progress?.watched_percentage ?? 0)
    const orderedLessons = navigationRows.map((row) => row as Record<string, unknown>)
    const currentIndex = orderedLessons.findIndex((item) => String(item.id) === String(lesson.id))
    const previous = currentIndex > 0 ? orderedLessons[currentIndex - 1] : undefined
    const next = currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : undefined

    return NextResponse.json({
      success: true,
      data: {
        lesson: {
          id: String(lesson.id),
          title: String(lesson.title ?? ''),
          description: null,
          content: lesson.content ?? null,
          order: Number(lesson.order ?? 0),
          estimatedMinutes: Number(lesson.estimated_duration_minutes ?? 0),
          isMandatory: lesson.requires_completion !== false,
          videoUrl: lesson.video_url ?? null,
          videoDuration: Number(lesson.video_duration_seconds ?? 0),
        },
        module: { id: String(lesson.module_id), title: String(lesson.module_title ?? '') },
        course: { id: String(lesson.course_id), title: String(lesson.course_title ?? 'Curso') },
        enrollment: { id: String(enrollmentNumericId) },
        progress: {
          status: isCompleted ? 'completed' : progressPercent > 0 ? 'in_progress' : 'not_started',
          progressPercent,
          videoProgress: progressPercent,
          lastPosition: Number(progress?.last_position ?? 0),
          completedAt: isoDate(progress?.completed_at),
        },
        materials: materialRows.map((row) => {
          const material = row as Record<string, unknown>
          return {
            id: String(material.id),
            title: String(material.title ?? ''),
            type: String(material.material_type ?? 'document'),
            url: `/api/lms/materials/${String(material.id)}?enrollmentId=${enrollmentNumericId}`,
            size: material.file_size_bytes === null || material.file_size_bytes === undefined
              ? undefined
              : `${(Number(material.file_size_bytes) / 1024 / 1024).toFixed(1)} MB`,
          }
        }),
        navigation: {
          previousLesson: previous ? { id: String(previous.id), title: String(previous.title ?? '') } : undefined,
          nextLesson: next ? { id: String(next.id), title: String(next.title ?? '') } : undefined,
        },
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[LMS Lesson] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cargar la lección.' }, { status: 500 })
  }
}

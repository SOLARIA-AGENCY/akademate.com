/**
 * Protected LMS module endpoint for the internal Campus Virtual.
 *
 * This route intentionally reads the minimal LMS schema directly. Payload
 * hydration also loads historical academic relations that are not required by
 * a student and may not exist in an isolated staging database.
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

interface ProgressSummary {
  id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progressPercent: number
  lastPosition: number
  completedAt?: string
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError
  if (!campusSql) {
    return NextResponse.json({ success: false, error: 'Base del Campus no disponible.' }, { status: 503 })
  }

  const { id: moduleId } = await params
  const { searchParams } = new URL(request.url)
  const enrollmentId = searchParams.get('enrollmentId')
  const moduleNumericId = numericId(moduleId)
  const enrollmentNumericId = numericId(enrollmentId)

  if (!moduleNumericId) {
    return NextResponse.json({ success: false, error: 'El módulo no es válido.' }, { status: 400 })
  }
  if (!enrollmentNumericId) {
    return NextResponse.json({ success: false, error: 'enrollmentId es obligatorio y debe ser válido.' }, { status: 400 })
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
    return NextResponse.json({ success: false, error: 'La matrícula no tiene un contexto académico válido.' }, { status: 403 })
  }

  try {
    const moduleRows = await campusSql`
      SELECT id, title, description, "order", unlock_date, estimated_duration_minutes, course_id
      FROM modules
      WHERE id = ${moduleNumericId}
        AND course_id = ${courseId}
        AND tenant_id = ${tenantId}
        AND is_published = true
      LIMIT 1
    `
    const moduleRow = moduleRows[0] as Record<string, unknown> | undefined
    if (!moduleRow) {
      return NextResponse.json({ success: false, error: 'Módulo no encontrado.' }, { status: 404 })
    }

    const lessonRows = await campusSql`
      SELECT id, title, content, "order", estimated_duration_minutes,
             requires_completion, video_url, video_duration_seconds
      FROM lessons
      WHERE module_id = ${moduleNumericId}
        AND tenant_id = ${tenantId}
        AND is_published = true
      ORDER BY "order" ASC, id ASC
    `
    const lessonIds = lessonRows.map((row) => Number((row as Record<string, unknown>).id)).filter(Number.isInteger)

    const materialRows = await campusSql`
      SELECT id, title, material_type, external_url, file_size_bytes
      FROM materials
      WHERE module_id = ${moduleNumericId}
        AND tenant_id = ${tenantId}
        AND is_published = true
      ORDER BY "order" ASC, id ASC
    `

    const progressRows = lessonIds.length === 0
      ? []
      : await campusSql`
          SELECT id, lesson_id, is_completed, watched_percentage, last_position, completed_at
          FROM lesson_progress
          WHERE enrollment_id = ${enrollmentNumericId}
            AND tenant_id = ${tenantId}
            AND lesson_id = ANY(${campusSql.array(lessonIds)}::int[])
        `
    const progressByLesson = new Map<string, ProgressSummary>(
      progressRows.map((row): [string, ProgressSummary] => {
        const progress = row as Record<string, unknown>
        const isCompleted = progress.is_completed === true
        const progressPercent = Number(progress.watched_percentage ?? 0)
        return [String(progress.lesson_id), {
          id: String(progress.id),
          status: isCompleted ? 'completed' : progressPercent > 0 ? 'in_progress' : 'not_started',
          progressPercent,
          lastPosition: Number(progress.last_position ?? 0),
          completedAt: isoDate(progress.completed_at),
        }]
      }),
    )

    const lessons = lessonRows.map((row) => {
      const lesson = row as Record<string, unknown>
      const id = String(lesson.id)
      return {
        id,
        title: String(lesson.title ?? ''),
        description: null,
        content: lesson.content ?? null,
        order: Number(lesson.order ?? 0),
        estimatedMinutes: Number(lesson.estimated_duration_minutes ?? 0),
        isMandatory: lesson.requires_completion !== false,
        status: 'published',
        videoUrl: lesson.video_url ?? null,
        videoDuration: Number(lesson.video_duration_seconds ?? 0),
        progress: progressByLesson.get(id) ?? {
          status: 'not_started',
          progressPercent: 0,
          lastPosition: 0,
        },
        resources: [],
      }
    })

    const completedLessons = lessons.filter((lesson) => lesson.progress.status === 'completed').length
    return NextResponse.json({
      success: true,
      data: {
        module: {
          id: String(moduleRow.id),
          title: String(moduleRow.title ?? ''),
          description: moduleRow.description ?? null,
          order: Number(moduleRow.order ?? 0),
          estimatedMinutes: Number(moduleRow.estimated_duration_minutes ?? 0),
          unlockDate: isoDate(moduleRow.unlock_date),
          status: 'published',
        },
        lessons,
        materials: materialRows.map((row) => {
          const material = row as Record<string, unknown>
          return {
            id: String(material.id),
            title: String(material.title ?? ''),
            type: String(material.material_type ?? 'document'),
            url: `/api/lms/materials/${String(material.id)}?enrollmentId=${enrollmentNumericId}`,
            fileSize: material.file_size_bytes === null ? undefined : Number(material.file_size_bytes),
          }
        }),
        stats: {
          totalLessons: lessons.length,
          totalMaterials: materialRows.length,
          completedLessons,
          progressPercent: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0,
        },
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[LMS Module] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cargar el módulo.' }, { status: 500 })
  }
}

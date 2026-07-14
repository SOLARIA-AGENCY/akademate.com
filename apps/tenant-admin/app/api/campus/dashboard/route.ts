/**
 * Campus Dashboard API.
 *
 * This endpoint is intentionally backed by the campus session bridge instead
 * of querying the historical `enrollments.student` relation directly. The
 * latter still points to leads in older tenants and is not an LMS identity.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { campusSql, readCampusSession } from '@/src/lib/campus/auth'

interface DashboardProgress {
  progressPercent: number
  totalModules: number
  completedModules: number
  lastAccessedAt: string | null
  estimatedMinutesRemaining: number
}

export async function GET(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const session = await readCampusSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesion no autorizada.' }, { status: 401 })
  }

  const enrollmentIds = session.enrollments
    .map((enrollment) => Number(enrollment.id))
    .filter((id) => Number.isInteger(id) && id > 0)
  const tenantId = Number(session.student.tenantId)
  const progressRows = campusSql && enrollmentIds.length > 0 && Number.isInteger(tenantId)
    ? await campusSql`
        SELECT
          e.id,
          COUNT(DISTINCT m.id)::int AS total_modules,
          COUNT(DISTINCT m.id) FILTER (
            WHERE m.id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM lessons module_lesson
                WHERE module_lesson.module_id = m.id
                  AND module_lesson.tenant_id = ${tenantId}
                  AND module_lesson.is_published = true
                  AND NOT EXISTS (
                    SELECT 1
                    FROM lesson_progress module_progress
                    WHERE module_progress.enrollment_id = e.id
                      AND module_progress.lesson_id = module_lesson.id
                      AND module_progress.tenant_id = ${tenantId}
                      AND module_progress.is_completed = true
                  )
              )
          )::int AS completed_modules,
          COUNT(DISTINCT l.id)::int AS total_lessons,
          COUNT(DISTINCT l.id) FILTER (
            WHERE lp.is_completed = true
          )::int AS completed_lessons,
          MAX(lp.last_access_at) AS last_accessed_at,
          COALESCE(SUM(l.estimated_duration_minutes) FILTER (
            WHERE lp.is_completed IS DISTINCT FROM true
          ), 0)::int AS estimated_minutes_remaining
        FROM enrollments e
        JOIN course_runs cr ON cr.id = e.course_run_id
        JOIN modules m ON m.course_id = cr.course_id
          AND m.tenant_id = ${tenantId}
          AND m.is_published = true
        LEFT JOIN lessons l ON l.module_id = m.id
          AND l.tenant_id = ${tenantId}
          AND l.is_published = true
        LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id
          AND lp.lesson_id = l.id
          AND lp.tenant_id = ${tenantId}
        WHERE e.id = ANY(${campusSql.array(enrollmentIds)}::int[])
        GROUP BY e.id
      `
    : []
  const progressByEnrollment = new Map<string, DashboardProgress>(
    progressRows.map((row): [string, DashboardProgress] => {
      const item = row as Record<string, unknown>
      const totalLessons = Number(item.total_lessons ?? 0)
      const completedLessons = Number(item.completed_lessons ?? 0)
      return [String(item.id), {
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        totalModules: Number(item.total_modules ?? 0),
        completedModules: Number(item.completed_modules ?? 0),
        lastAccessedAt: item.last_accessed_at instanceof Date
          ? item.last_accessed_at.toISOString()
          : item.last_accessed_at ? String(item.last_accessed_at) : null,
        estimatedMinutesRemaining: Number(item.estimated_minutes_remaining ?? 0),
      }]
    }),
  )

  const enrollments = session.enrollments.map((enrollment) => {
    const progress = progressByEnrollment.get(enrollment.id)
    return {
      id: enrollment.id,
      courseTitle: enrollment.courseTitle,
      courseThumbnail: enrollment.courseThumbnail,
      courseRunTitle: enrollment.courseRunTitle,
      status: enrollment.status,
      progressPercent: progress?.progressPercent ?? 0,
      totalModules: progress?.totalModules ?? 0,
      completedModules: progress?.completedModules ?? 0,
      lastAccessedAt: progress?.lastAccessedAt ?? null,
      estimatedMinutesRemaining: progress?.estimatedMinutesRemaining ?? 0,
    }
  })

  const completedCourses = session.enrollments.filter((enrollment) => enrollment.status === 'completed').length

  return NextResponse.json(
    {
      success: true,
      enrollments,
      stats: {
        totalCourses: session.enrollments.filter((enrollment) => ['active', 'in_progress', 'confirmed'].includes(enrollment.status)).length,
        completedCourses,
        currentStreak: 0,
        totalBadges: 0,
        totalPoints: 0,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}

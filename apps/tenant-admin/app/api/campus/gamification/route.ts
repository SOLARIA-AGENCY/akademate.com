/**
 * Campus Gamification API.
 *
 * Gamification is derived from the Campus tables and is read-only. It does
 * not depend on the legacy Payload collections used by the former LMS route.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { campusEnvironmentError, campusGamificationEnabled } from '@/src/lib/campus/environment'
import { campusSql, readCampusSession } from '@/src/lib/campus/auth'
import { buildCampusGamification, type CampusProgressActivity } from '@/src/lib/campus/gamification'

function disabledResponse(): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data: {
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        level: 1,
        levelProgress: 0,
        nextLevelPoints: 100,
        badges: [],
        recentActivity: [],
        stats: {
          coursesCompleted: 0,
          lessonsCompleted: 0,
          hoursLearned: 0,
          daysActive: 0,
        },
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}

export async function GET(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const session = await readCampusSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesión no autorizada' }, { status: 401 })
  }

  if (!campusGamificationEnabled()) return disabledResponse()
  if (!campusSql) {
    return NextResponse.json(
      { success: false, error: 'La base de datos del campus no está disponible en este entorno' },
      { status: 503 },
    )
  }

  const studentId = Number(session.student.id)
  const tenantId = Number(session.student.tenantId)
  if (!Number.isInteger(studentId) || studentId <= 0 || !Number.isInteger(tenantId) || tenantId <= 0) {
    return NextResponse.json(
      { success: false, error: 'La sesión del campus no tiene un ámbito válido' },
      { status: 403 },
    )
  }

  try {
    const progressRows = await campusSql`
      SELECT
        COALESCE(lp.completed_at, lp.updated_at) AS completed_at,
        COALESCE(lp.time_spent, 0)::int AS time_spent_minutes
      FROM lesson_progress lp
      INNER JOIN campus_enrollments ce
        ON ce.enrollment_id = lp.enrollment_id
       AND ce.student_id = ${studentId}
       AND ce.tenant_id = ${tenantId}
       AND ce.status = 'active'
      WHERE lp.tenant_id = ${tenantId}
        AND lp.is_completed = true
      ORDER BY completed_at DESC NULLS LAST
      LIMIT 2000
    `

    const completedCoursesRows = await campusSql`
      SELECT COUNT(DISTINCT ce.enrollment_id)::int AS completed_courses
      FROM campus_enrollments ce
      INNER JOIN enrollments e ON e.id = ce.enrollment_id
      WHERE ce.student_id = ${studentId}
        AND ce.tenant_id = ${tenantId}
        AND ce.status = 'active'
        AND e.status::text = 'completed'
    `

    const activities: CampusProgressActivity[] = progressRows.map((row) => ({
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      timeSpentMinutes: Number(row.time_spent_minutes ?? 0),
    }))
    const result = buildCampusGamification(
      activities,
      Number(completedCoursesRows[0]?.completed_courses ?? 0),
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          totalPoints: result.stats.totalPoints,
          currentStreak: result.stats.currentStreak,
          longestStreak: result.stats.longestStreak,
          level: result.level,
          levelProgress: result.levelProgress,
          nextLevelPoints: result.nextLevelPoints,
          badges: result.badges,
          recentActivity: result.recentActivity,
          stats: {
            coursesCompleted: result.stats.coursesCompleted,
            lessonsCompleted: result.stats.lessonsCompleted,
            hoursLearned: result.stats.hoursLearned,
            daysActive: result.stats.daysActive,
          },
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[Campus Gamification] Error:', error)
    return NextResponse.json(
      { success: false, error: 'No se han podido cargar los datos de progreso' },
      { status: 500 },
    )
  }
}

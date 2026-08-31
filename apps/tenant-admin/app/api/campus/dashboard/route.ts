/**
 * Campus Dashboard API
 *
 * Returns student's enrollments and stats for the dashboard.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isActiveEnrollmentStatus } from '../../../(app)/campus/lib/dashboard'
import {
  averageAttendance,
  buildLiveAndUpcoming,
  mapBadges,
  mapEnrollmentCard,
  weeklyActivityFromStreak,
  type LooseEnrollmentDoc,
} from './_lib'

interface Badge {
  id: string
  name?: string
}

interface GamificationDocument {
  currentStreak?: number
  badges?: Badge[]
  totalPoints?: number
}

interface LoosePayloadFindResult {
  docs: unknown[]
  totalDocs?: number
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET ?? 'campus-secret-key-change-in-production'
)

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.split(' ')[1]
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request)
    if (decoded?.type !== 'campus') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const studentId = decoded.sub!

    const enrollmentsResult = await payload.find({
      collection: 'enrollments',
      where: {
        student: { equals: studentId },
      },
      depth: 3,
      sort: '-updatedAt',
    })
    const enrollmentDocs = enrollmentsResult.docs as unknown as LooseEnrollmentDoc[]
    const enrollments = enrollmentDocs.map(mapEnrollmentCard)

    const completedEnrollments = enrollmentDocs.filter((item) => item.status === 'completed')

    let gamificationStats = {
      currentStreak: 0,
      totalBadges: 0,
      totalPoints: 0,
    }
    let badges: { id: string; name: string }[] = []

    try {
      const payloadLoose = payload as unknown as {
        find: (args: {
          collection: string
          where?: Record<string, unknown>
          limit?: number
          depth?: number
        }) => Promise<LoosePayloadFindResult>
      }

      const gamificationResult = await payloadLoose.find({
        collection: 'studentGamification',
        where: {
          student: { equals: studentId },
        },
        limit: 1,
      })

      if (gamificationResult.docs.length > 0) {
        const gamification = gamificationResult.docs[0] as unknown as GamificationDocument
        const mapped = mapBadges(gamification.badges ?? [])
        badges = mapped
        gamificationStats = {
          currentStreak: gamification.currentStreak ?? 0,
          totalBadges: mapped.length || (gamification.badges?.length ?? 0),
          totalPoints: gamification.totalPoints ?? 0,
        }
      }
    } catch {
      console.log('[Campus Dashboard] Gamification not available')
    }

    if (badges.length === 0) {
      try {
        const payloadLoose = payload as unknown as {
          find: (args: {
            collection: string
            where?: Record<string, unknown>
            limit?: number
            depth?: number
          }) => Promise<LoosePayloadFindResult>
        }
        const userBadges = await payloadLoose.find({
          collection: 'user-badges',
          where: { user: { equals: studentId } },
          limit: 6,
          depth: 1,
        })
        badges = mapBadges(
          userBadges.docs.map((doc) => {
            const record = doc as { badge?: Badge | string; id?: string }
            return typeof record.badge === 'object' ? record.badge : { id: record.id, name: undefined }
          })
        )
        if (badges.length > 0) {
          gamificationStats.totalBadges = badges.length
        }
      } catch {
        // user-badges may not map to student ids
      }
    }

    let liveClass = null
    let upcoming: ReturnType<typeof buildLiveAndUpcoming>['upcoming'] = []
    try {
      const schedule = buildLiveAndUpcoming(enrollmentDocs)
      liveClass = schedule.liveClass
      upcoming = schedule.upcoming
    } catch {
      liveClass = null
      upcoming = []
    }

    const stats = {
      totalCourses: enrollmentDocs.filter((item) => isActiveEnrollmentStatus(item.status)).length,
      completedCourses: completedEnrollments.length,
      ...gamificationStats,
    }

    return NextResponse.json({
      success: true,
      enrollments,
      stats,
      liveClass,
      upcoming,
      attendanceRate: averageAttendance(enrollmentDocs),
      badges,
      weeklyActivity: weeklyActivityFromStreak(gamificationStats.currentStreak),
    })
  } catch (error) {
    console.error('[Campus Dashboard] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load dashboard' }, { status: 500 })
  }
}

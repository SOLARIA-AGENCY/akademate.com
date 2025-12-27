/**
 * Campus Gamification API
 *
 * Returns student's gamification data: badges, points, streaks, level.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPayload } from 'payload';
import config from '@payload-config';

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET || 'campus-secret-key-change-in-production'
);

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Badge definitions - could be moved to CMS later
const BADGE_DEFINITIONS = [
  {
    id: 'first-lesson',
    name: 'Primera Leccion',
    description: 'Completa tu primera leccion',
    icon: 'book',
    category: 'learning' as const,
    requirement: 'Completa 1 leccion',
    pointsRequired: 1,
  },
  {
    id: 'fast-learner',
    name: 'Aprendiz Rapido',
    description: 'Completa 10 lecciones',
    icon: 'zap',
    category: 'learning' as const,
    requirement: 'Completa 10 lecciones',
    pointsRequired: 10,
  },
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Completa 50 lecciones',
    icon: 'target',
    category: 'learning' as const,
    requirement: 'Completa 50 lecciones',
    pointsRequired: 50,
  },
  {
    id: 'scholar',
    name: 'Erudito',
    description: 'Completa tu primer curso',
    icon: 'award',
    category: 'achievement' as const,
    requirement: 'Completa 1 curso',
    coursesRequired: 1,
  },
  {
    id: 'streak-3',
    name: 'En Racha',
    description: 'Estudia 3 dias seguidos',
    icon: 'flame',
    category: 'streak' as const,
    requirement: 'Racha de 3 dias',
    streakRequired: 3,
  },
  {
    id: 'streak-7',
    name: 'Semana Perfecta',
    description: 'Estudia 7 dias seguidos',
    icon: 'flame',
    category: 'streak' as const,
    requirement: 'Racha de 7 dias',
    streakRequired: 7,
  },
  {
    id: 'streak-30',
    name: 'Mes Imparable',
    description: 'Estudia 30 dias seguidos',
    icon: 'flame',
    category: 'streak' as const,
    requirement: 'Racha de 30 dias',
    streakRequired: 30,
  },
  {
    id: 'early-bird',
    name: 'Madrugador',
    description: 'Estudia antes de las 8am',
    icon: 'star',
    category: 'special' as const,
    requirement: 'Estudia antes de las 8am',
  },
];

// Calculate level from total points
function calculateLevel(points: number): { level: number; progress: number; nextLevelPoints: number } {
  const pointsPerLevel = 100;
  const level = Math.floor(points / pointsPerLevel) + 1;
  const currentLevelPoints = (level - 1) * pointsPerLevel;
  const nextLevelPoints = level * pointsPerLevel;
  const progress = Math.round(((points - currentLevelPoints) / pointsPerLevel) * 100);

  return { level, progress, nextLevelPoints };
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded || decoded.type !== 'campus') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await getPayload({ config });
    const studentId = decoded.sub as string;

    // Get student stats from enrollments and progress
    let lessonsCompleted = 0;
    let coursesCompleted = 0;
    let hoursLearned = 0;
    let totalPoints = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let daysActive = 0;
    const earnedBadgeIds: string[] = [];

    // Try to get gamification record
    try {
      const gamificationResult = await payload.find({
        collection: 'studentGamification' as any,
        where: {
          student: { equals: studentId },
        },
        limit: 1,
      });

      if (gamificationResult.docs.length > 0) {
        const gamification = gamificationResult.docs[0] as any;
        totalPoints = gamification.totalPoints || 0;
        currentStreak = gamification.currentStreak || 0;
        longestStreak = gamification.longestStreak || 0;
        earnedBadgeIds.push(...(gamification.badges || []).map((b: any) => b.badgeId));
      }
    } catch (err) {
      console.log('[Gamification] Collection not available, using fallback');
    }

    // Get lesson progress stats
    try {
      const progressResult = await payload.find({
        collection: 'lessonProgress' as any,
        where: {
          student: { equals: studentId },
          status: { equals: 'completed' },
        },
      });

      lessonsCompleted = progressResult.docs.length;

      // Estimate hours from lessons (15 min average per lesson)
      hoursLearned = Math.round((lessonsCompleted * 15) / 60);

      // Calculate points if not stored (10 points per lesson)
      if (totalPoints === 0) {
        totalPoints = lessonsCompleted * 10;
      }

      // Get unique days active
      const uniqueDays = new Set(
        progressResult.docs.map((doc: any) =>
          new Date(doc.completedAt || doc.updatedAt).toDateString()
        )
      );
      daysActive = uniqueDays.size;
    } catch (err) {
      console.log('[Gamification] Progress collection not available');
    }

    // Get completed courses count
    try {
      const enrollmentsResult = await payload.find({
        collection: 'enrollments',
        where: {
          student: { equals: studentId },
          status: { equals: 'completed' },
        },
      });
      coursesCompleted = enrollmentsResult.docs.length;
    } catch (err) {
      console.log('[Gamification] Enrollments not available');
    }

    // Calculate level
    const { level, progress: levelProgress, nextLevelPoints } = calculateLevel(totalPoints);

    // Determine which badges are earned
    const badges = BADGE_DEFINITIONS.map((badge) => {
      let isEarned = earnedBadgeIds.includes(badge.id);
      let progress = 0;

      // Check if badge should be earned based on stats
      if (!isEarned) {
        if ('pointsRequired' in badge && badge.pointsRequired) {
          progress = Math.min(100, Math.round((lessonsCompleted / badge.pointsRequired) * 100));
          isEarned = lessonsCompleted >= badge.pointsRequired;
        } else if ('coursesRequired' in badge && badge.coursesRequired) {
          progress = Math.min(100, Math.round((coursesCompleted / badge.coursesRequired) * 100));
          isEarned = coursesCompleted >= badge.coursesRequired;
        } else if ('streakRequired' in badge && badge.streakRequired) {
          progress = Math.min(100, Math.round((longestStreak / badge.streakRequired) * 100));
          isEarned = longestStreak >= badge.streakRequired;
        }
      }

      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        isEarned,
        progress: isEarned ? 100 : progress,
        requirement: badge.requirement,
        earnedAt: isEarned ? new Date().toISOString() : undefined,
      };
    });

    // Generate recent activity (mock for now, would come from activity log)
    const recentActivity: any[] = [];

    if (lessonsCompleted > 0) {
      recentActivity.push({
        id: '1',
        type: 'points',
        title: 'Leccion Completada',
        description: 'Has ganado puntos por completar una leccion',
        points: 10,
        earnedAt: new Date().toISOString(),
      });
    }

    const earnedBadges = badges.filter((b) => b.isEarned);
    if (earnedBadges.length > 0) {
      recentActivity.push({
        id: '2',
        type: 'badge',
        title: `Insignia: ${earnedBadges[0].name}`,
        description: earnedBadges[0].description,
        points: 50,
        earnedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPoints,
        currentStreak,
        longestStreak,
        level,
        levelProgress,
        nextLevelPoints,
        badges,
        recentActivity,
        stats: {
          coursesCompleted,
          lessonsCompleted,
          hoursLearned,
          daysActive,
        },
      },
    });
  } catch (error) {
    console.error('[Gamification] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load gamification data' },
      { status: 500 }
    );
  }
}

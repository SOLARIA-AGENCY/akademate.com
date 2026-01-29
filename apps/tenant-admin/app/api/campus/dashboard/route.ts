/**
 * Campus Dashboard API
 *
 * Returns student's enrollments and stats for the dashboard.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPayload } from 'payload';
import config from '@payload-config';

// TypeScript interfaces for course and enrollment data
interface CourseMedia {
  url?: string;
}

interface Course {
  title?: string;
  thumbnail?: CourseMedia;
  estimatedHours?: number;
}

interface CourseRun {
  title?: string;
  course?: Course;
}

interface Badge {
  id: string;
  name?: string;
}

interface EnrollmentDocument {
  id: string;
  courseRun?: CourseRun;
  status: string;
  progressPercent?: number;
  lastAccessedAt?: string;
  updatedAt?: string;
}

interface GamificationDocument {
  currentStreak?: number;
  badges?: Badge[];
  totalPoints?: number;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET ?? 'campus-secret-key-change-in-production'
);

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
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

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (decoded?.type !== 'campus') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Payload config import pattern
    const payload = await getPayload({ config });
    const studentId = decoded.sub!;

    // Get all enrollments with course details
    const enrollmentsResult = await payload.find({
      collection: 'enrollments',
      where: {
        student: { equals: studentId },
      },
      depth: 3,
      sort: '-updatedAt',
    });

    // Transform enrollments for dashboard
    const enrollments = enrollmentsResult.docs.map((enrollment: EnrollmentDocument) => {
      const courseRun = enrollment.courseRun;
      const course = courseRun?.course;

      // Calculate modules progress
      const totalModules = 0; // Would come from course structure
      const completedModules = 0;

      return {
        id: enrollment.id,
        courseTitle: course?.title ?? 'Unknown Course',
        courseThumbnail: course?.thumbnail?.url ?? null,
        courseRunTitle: courseRun?.title ?? '',
        status: enrollment.status,
        progressPercent: enrollment.progressPercent ?? 0,
        totalModules: totalModules,
        completedModules: completedModules,
        lastAccessedAt: enrollment.lastAccessedAt ?? enrollment.updatedAt,
        estimatedMinutesRemaining: Math.round(
          ((100 - (enrollment.progressPercent ?? 0)) / 100) * (course?.estimatedHours ?? 10) * 60
        ),
      };
    });

    // Calculate stats
    const completedEnrollments = enrollmentsResult.docs.filter(
      (e: EnrollmentDocument) => e.status === 'completed'
    );

    // Get gamification data (badges, points, streak)
    let gamificationStats = {
      currentStreak: 0,
      totalBadges: 0,
      totalPoints: 0,
    };

    try {
      const gamificationResult = await payload.find({
        // Using string literal for collection that may not exist in all configurations
        collection: 'studentGamification' as 'users',
        where: {
          student: { equals: studentId },
        },
        limit: 1,
      });

      if (gamificationResult.docs.length > 0) {
        const gamification = gamificationResult.docs[0] as unknown as GamificationDocument;
        gamificationStats = {
          currentStreak: gamification.currentStreak ?? 0,
          totalBadges: gamification.badges?.length ?? 0,
          totalPoints: gamification.totalPoints ?? 0,
        };
      }
    } catch {
      // Gamification collection might not exist yet
      console.log('[Campus Dashboard] Gamification not available');
    }

    const stats = {
      totalCourses: enrollmentsResult.docs.filter(
        (e: EnrollmentDocument) => e.status === 'enrolled' || e.status === 'in_progress'
      ).length,
      completedCourses: completedEnrollments.length,
      ...gamificationStats,
    };

    return NextResponse.json({
      success: true,
      enrollments,
      stats,
    });
  } catch (error) {
    console.error('[Campus Dashboard] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

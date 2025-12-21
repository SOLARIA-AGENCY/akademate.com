/**
 * LMS Enrollments List API
 *
 * GET /api/lms/enrollments - List enrollments for current user
 * POST /api/lms/enrollments - Create new enrollment (admin only)
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/lms/enrollments
 *
 * Query params:
 * - userId: Filter by user ID
 * - status: Filter by status (active, completed, cancelled)
 * - limit: Number of results (default 20)
 * - page: Page number (default 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const payload = await getPayloadHMR({ config: configPromise });

    // Build where clause
    const where: Record<string, any> = {};
    if (userId) {
      where.student = { equals: userId };
    }
    if (status) {
      where.status = { equals: status };
    }

    const enrollments = await payload.find({
      collection: 'enrollments',
      where,
      limit,
      page,
      depth: 2,
      sort: '-createdAt',
    });

    // Enhance with progress summary
    const enrollmentsWithProgress = await Promise.all(
      enrollments.docs.map(async (enrollment) => {
        // Get progress for this enrollment
        const progress = await payload.find({
          collection: 'lesson-progress',
          where: { enrollment: { equals: enrollment.id } },
          limit: 500,
        });

        const completed = progress.docs.filter(
          (p: any) => p.status === 'completed'
        ).length;
        const total = progress.totalDocs;

        return {
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.createdAt,
          courseRun: typeof enrollment.courseRun === 'object'
            ? {
                id: enrollment.courseRun.id,
                title: enrollment.courseRun.title,
                course: typeof enrollment.courseRun.course === 'object'
                  ? {
                      id: enrollment.courseRun.course.id,
                      title: enrollment.courseRun.course.title,
                      thumbnail: enrollment.courseRun.course.thumbnail,
                    }
                  : null,
              }
            : null,
          progress: {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrollmentsWithProgress,
      meta: {
        page: enrollments.page,
        limit: enrollments.limit,
        totalDocs: enrollments.totalDocs,
        totalPages: enrollments.totalPages,
        hasNextPage: enrollments.hasNextPage,
        hasPrevPage: enrollments.hasPrevPage,
      },
    });
  } catch (error: any) {
    console.error('[LMS Enrollments] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

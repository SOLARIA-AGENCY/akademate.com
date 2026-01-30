/**
 * LMS Enrollments List API
 *
 * GET /api/lms/enrollments - List enrollments for current user
 * POST /api/lms/enrollments - Create new enrollment (admin only)
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Course data structure */
interface CourseData {
  id: string;
  title: string;
  thumbnail?: string;
}

/** Course run data structure */
interface CourseRunData {
  id: string;
  title: string;
  course?: CourseData | string;
}

/** Enrollment document from Payload */
interface EnrollmentDocument {
  id: string;
  status: string;
  createdAt: string;
  course_run?: CourseRunData | string;
}

/** Lesson progress document from Payload */
interface LessonProgressDocument {
  id: string;
  status: string;
}

/** Query filter for equals condition */
interface EqualsFilter {
  equals: string;
}

/** Where clause for enrollment queries */
interface EnrollmentWhereClause {
  student?: EqualsFilter;
  status?: EqualsFilter;
}

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
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const page = parseInt(searchParams.get('page') ?? '1', 10);

     
    const payload = await getPayloadHMR({ config: configPromise });

    // Build where clause
    const where: EnrollmentWhereClause = {};
    if (userId) {
      where.student = { equals: userId };
    }
    if (status) {
      where.status = { equals: status };
    }

    const enrollments = await payload.find({
      collection: 'enrollments' as 'users',
      where,
      limit,
      page,
      depth: 2,
      sort: '-createdAt',
    });

    // Enhance with progress summary
    const enrollmentsWithProgress = await Promise.all(
      enrollments.docs.map(async (enrollment) => {
        const enrollmentRecord = enrollment as unknown as EnrollmentDocument;
        // Get progress for this enrollment
        const progress = await payload.find({
          collection: 'lesson-progress' as 'users',
          where: { enrollment: { equals: enrollmentRecord.id } },
          limit: 500,
        });

        const completed = progress.docs.filter(
          (p) => (p as unknown as LessonProgressDocument).status === 'completed'
        ).length;
        const total = progress.totalDocs;

        return {
          id: enrollmentRecord.id,
          status: enrollmentRecord.status,
          enrolledAt: enrollmentRecord.createdAt,
          courseRun: typeof enrollmentRecord.course_run === 'object'
            ? {
                id: enrollmentRecord.course_run.id,
                title: enrollmentRecord.course_run.title,
                course: typeof enrollmentRecord.course_run.course === 'object'
                  ? {
                      id: enrollmentRecord.course_run.course.id,
                      title: enrollmentRecord.course_run.course.title,
                      thumbnail: enrollmentRecord.course_run.course.thumbnail,
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
  } catch (error: unknown) {
    console.error('[LMS Enrollments] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch enrollments';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

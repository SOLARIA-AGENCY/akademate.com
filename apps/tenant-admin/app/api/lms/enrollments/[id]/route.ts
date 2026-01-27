/**
 * LMS Enrollment API Routes
 *
 * GET /api/lms/enrollments/:id - Get enrollment with course content
 *
 * Used by Campus Virtual to load student's enrolled course data
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/lms/enrollments/:id
 *
 * Returns enrollment details including:
 * - Enrollment status and dates
 * - Course information
 * - All modules with their lessons
 * - Student's progress data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: enrollmentId } = await params;

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

    // 1. Get enrollment with student and course run
    const enrollment = await payload.findByID({
      collection: 'enrollments' as any,
      id: enrollmentId,
      depth: 2, // Include nested relations
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // 2. Get course run details (edicion/convocatoria)
    const enrollmentRecord = enrollment;
    const courseRunRef = enrollmentRecord.course_run ?? enrollmentRecord.courseRun;
    const courseRun = typeof courseRunRef === 'object'
      ? courseRunRef
      : await payload.findByID({
          collection: 'course-runs' as any,
          id: courseRunRef as string,
          depth: 1,
        });

    // 3. Get the base course
    const courseRunRecord = courseRun;
    const courseRef = courseRunRecord?.course;
    const course = courseRef
      ? (typeof courseRef === 'object'
          ? courseRef
          : await payload.findByID({
              collection: 'courses' as any,
              id: courseRef as string,
              depth: 1,
            }))
      : null;

    // 4. Get all modules for this course run
    const modules = await payload.find({
      collection: 'modules' as any,
      where: {
        courseRun: { equals: courseRunRecord?.id || courseRunRef },
      },
      sort: 'order',
      depth: 0,
      limit: 100,
    });

    // 5. Get lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.docs.map(async (module) => {
        const moduleRecord = module;
        const lessons = await payload.find({
          collection: 'lessons' as any,
          where: { module: { equals: moduleRecord.id } },
          sort: 'order',
          depth: 0,
          limit: 100,
        });

        return {
          ...moduleRecord,
          lessons: lessons.docs,
          lessonsCount: lessons.totalDocs,
        };
      })
    );

    // 6. Get student's progress data
    const progress = await payload.find({
      collection: 'lesson-progress' as any,
      where: {
        enrollment: { equals: enrollmentId },
      },
      depth: 0,
      limit: 500,
    });

    // 7. Calculate overall progress
    const totalLessons = modulesWithLessons.reduce(
      (sum, m) => sum + (m.lessonsCount || 0),
      0
    );
    const completedLessons = progress.docs.filter(
      (p: any) => p.status === 'completed'
    ).length;
    const progressPercent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    // 8. Build response
    const response = {
      success: true,
      data: {
        enrollment: {
          id: enrollmentRecord.id,
          status: enrollmentRecord.status,
          enrolledAt: enrollmentRecord.createdAt,
          startedAt: enrollmentRecord.started_at ?? enrollmentRecord.startedAt ?? null,
          completedAt: enrollmentRecord.completed_at ?? enrollmentRecord.completedAt ?? null,
        },
        course: course ? {
          id: (course).id,
          title: (course).title,
          slug: (course).slug,
          description: (course).description,
          thumbnail: (course).thumbnail,
        } : null,
        courseRun: courseRun ? {
          id: courseRunRecord.id,
          title: courseRunRecord.title,
          startDate: courseRunRecord.startDate ?? courseRunRecord.start_date,
          endDate: courseRunRecord.endDate ?? courseRunRecord.end_date,
          status: courseRunRecord.status,
        } : null,
        modules: modulesWithLessons.map((module) => {
          const moduleRecord = module;
          return {
            id: moduleRecord.id,
            title: moduleRecord.title,
            description: moduleRecord.description,
            order: moduleRecord.order,
            estimatedMinutes: moduleRecord.estimatedMinutes,
            lessons: moduleRecord.lessons.map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
              estimatedMinutes: lesson.estimatedMinutes,
              isMandatory: lesson.isMandatory,
            // Include progress for this lesson
            progress: progress.docs.find(
              (p: any) => p.lesson === lesson.id || p.lesson?.id === lesson.id
            ) || { status: 'not_started', progressPercent: 0 },
            })),
            lessonsCount: moduleRecord.lessonsCount,
          };
        }),
        progress: {
          totalModules: modules.totalDocs,
          totalLessons,
          completedLessons,
          progressPercent,
          status: progressPercent >= 100
            ? 'completed'
            : progressPercent > 0
              ? 'in_progress'
              : 'not_started',
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[LMS Enrollment] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}

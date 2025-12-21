/**
 * LMS Enrollment API Routes
 *
 * GET /api/lms/enrollments/:id - Get enrollment with course content
 *
 * Used by Campus Virtual to load student's enrolled course data
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

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
      collection: 'enrollments',
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
    const courseRun = typeof enrollment.courseRun === 'object'
      ? enrollment.courseRun
      : await payload.findByID({
          collection: 'course-runs',
          id: enrollment.courseRun as string,
          depth: 1,
        });

    // 3. Get the base course
    const course = courseRun?.course
      ? (typeof courseRun.course === 'object'
          ? courseRun.course
          : await payload.findByID({
              collection: 'courses',
              id: courseRun.course as string,
              depth: 1,
            }))
      : null;

    // 4. Get all modules for this course run
    const modules = await payload.find({
      collection: 'modules',
      where: {
        courseRun: { equals: courseRun?.id || enrollment.courseRun },
      },
      sort: 'order',
      depth: 0,
      limit: 100,
    });

    // 5. Get lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.docs.map(async (module) => {
        const lessons = await payload.find({
          collection: 'lessons',
          where: { module: { equals: module.id } },
          sort: 'order',
          depth: 0,
          limit: 100,
        });

        return {
          ...module,
          lessons: lessons.docs,
          lessonsCount: lessons.totalDocs,
        };
      })
    );

    // 6. Get student's progress data
    const progress = await payload.find({
      collection: 'lesson-progress',
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
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.createdAt,
          startedAt: enrollment.startedAt,
          completedAt: enrollment.completedAt,
        },
        course: course ? {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
        } : null,
        courseRun: courseRun ? {
          id: courseRun.id,
          title: courseRun.title,
          startDate: courseRun.startDate,
          endDate: courseRun.endDate,
          status: courseRun.status,
        } : null,
        modules: modulesWithLessons.map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          order: module.order,
          estimatedMinutes: module.estimatedMinutes,
          lessons: module.lessons.map((lesson: any) => ({
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
          lessonsCount: module.lessonsCount,
        })),
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

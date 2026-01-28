/**
 * LMS Enrollment API Routes
 *
 * GET /api/lms/enrollments/:id - Get enrollment with course content
 *
 * Used by Campus Virtual to load student's enrolled course data
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ============================================================================
// Payload CMS Collection Types
// ============================================================================

/** Base type for Payload collection documents */
interface PayloadDocument {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Enrollment record from Payload 'enrollments' collection */
interface PayloadEnrollment extends PayloadDocument {
  status?: string;
  // Support both snake_case and camelCase field names
  course_run?: string | PayloadCourseRun;
  courseRun?: string | PayloadCourseRun;
  started_at?: string;
  startedAt?: string;
  completed_at?: string;
  completedAt?: string;
  student?: string | PayloadStudent;
}

/** Student record from Payload 'users' collection */
interface PayloadStudent extends PayloadDocument {
  email?: string;
  name?: string;
}

/** Course Run record from Payload 'course-runs' collection */
interface PayloadCourseRun extends PayloadDocument {
  title?: string;
  course?: string | PayloadCourse;
  status?: string;
  // Support both snake_case and camelCase field names
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
}

/** Course record from Payload 'courses' collection */
interface PayloadCourse extends PayloadDocument {
  title?: string;
  slug?: string;
  description?: string;
  thumbnail?: string | PayloadMedia;
}

/** Media record from Payload 'media' collection */
interface PayloadMedia extends PayloadDocument {
  url?: string;
  alt?: string;
  filename?: string;
}

/** Module record from Payload 'modules' collection */
interface PayloadModule extends PayloadDocument {
  title?: string;
  description?: string;
  order?: number;
  estimatedMinutes?: number;
  courseRun?: string | PayloadCourseRun;
  status?: string;
}

/** Lesson record from Payload 'lessons' collection */
interface PayloadLesson extends PayloadDocument {
  title?: string;
  description?: string;
  order?: number;
  estimatedMinutes?: number;
  isMandatory?: boolean;
  module?: string | PayloadModule;
  status?: string;
}

/** Lesson Progress record from Payload 'lesson-progress' collection */
interface PayloadLessonProgress extends PayloadDocument {
  enrollment?: string | PayloadEnrollment;
  lesson?: string | PayloadLesson;
  status?: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number;
  startedAt?: string;
  completedAt?: string;
  timeSpentSeconds?: number;
}

/** Module with lessons array (computed) */
interface ModuleWithLessons extends PayloadModule {
  lessons: PayloadLesson[];
  lessonsCount: number;
}

/** Progress info for lesson response */
interface LessonProgressInfo {
  status: string;
  progressPercent: number;
}

// ============================================================================
// Payload Collection Names (type-safe)
// ============================================================================

type PayloadCollectionSlug =
  | 'enrollments'
  | 'course-runs'
  | 'courses'
  | 'modules'
  | 'lessons'
  | 'lesson-progress'
  | 'users'
  | 'media';

// ============================================================================
// Route Types
// ============================================================================

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- configPromise is typed correctly
    const payload = await getPayloadHMR({ config: configPromise });

    // 1. Get enrollment with student and course run
    const enrollment = await payload.findByID({
      collection: 'enrollments' as PayloadCollectionSlug,
      id: enrollmentId,
      depth: 2, // Include nested relations
    }) as unknown as PayloadEnrollment | null;

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // 2. Get course run details (edicion/convocatoria)
    const enrollmentRecord: PayloadEnrollment = enrollment;
    const courseRunRef = enrollmentRecord.course_run ?? enrollmentRecord.courseRun;
    const courseRun: PayloadCourseRun | null = typeof courseRunRef === 'object'
      ? courseRunRef
      : courseRunRef
        ? await payload.findByID({
            collection: 'course-runs' as PayloadCollectionSlug,
            id: courseRunRef,
            depth: 1,
          }) as unknown as PayloadCourseRun
        : null;

    // 3. Get the base course
    const courseRunRecord: PayloadCourseRun | null = courseRun;
    const courseRef = courseRunRecord?.course;
    const course: PayloadCourse | null = courseRef
      ? (typeof courseRef === 'object'
          ? courseRef
          : await payload.findByID({
              collection: 'courses' as PayloadCollectionSlug,
              id: courseRef,
              depth: 1,
            }) as unknown as PayloadCourse)
      : null;

    // 4. Get all modules for this course run
    const modulesResult = await payload.find({
      collection: 'modules' as PayloadCollectionSlug,
      where: {
        courseRun: { equals: courseRunRecord?.id ?? courseRunRef },
      },
      sort: 'order',
      depth: 0,
      limit: 100,
    });
    const modules = modulesResult as unknown as { docs: PayloadModule[]; totalDocs: number };

    // 5. Get lessons for each module
    const modulesWithLessons: ModuleWithLessons[] = await Promise.all(
      modules.docs.map(async (module: PayloadModule): Promise<ModuleWithLessons> => {
        const moduleRecord: PayloadModule = module;
        const lessonsResult = await payload.find({
          collection: 'lessons' as PayloadCollectionSlug,
          where: { module: { equals: moduleRecord.id } },
          sort: 'order',
          depth: 0,
          limit: 100,
        });
        const lessons = lessonsResult as unknown as { docs: PayloadLesson[]; totalDocs: number };

        return {
          ...moduleRecord,
          lessons: lessons.docs,
          lessonsCount: lessons.totalDocs,
        };
      })
    );

    // 6. Get student's progress data
    const progressResult = await payload.find({
      collection: 'lesson-progress' as PayloadCollectionSlug,
      where: {
        enrollment: { equals: enrollmentId },
      },
      depth: 0,
      limit: 500,
    });
    const progress = progressResult as unknown as { docs: PayloadLessonProgress[]; totalDocs: number };

    // 7. Calculate overall progress
    const totalLessons = modulesWithLessons.reduce(
      (sum: number, m: ModuleWithLessons) => sum + (m.lessonsCount || 0),
      0
    );
    const completedLessons = progress.docs.filter(
      (p: PayloadLessonProgress) => p.status === 'completed'
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
        modules: modulesWithLessons.map((module: ModuleWithLessons) => {
          const moduleRecord: ModuleWithLessons = module;
          return {
            id: moduleRecord.id,
            title: moduleRecord.title,
            description: moduleRecord.description,
            order: moduleRecord.order,
            estimatedMinutes: moduleRecord.estimatedMinutes,
            lessons: moduleRecord.lessons.map((lesson: PayloadLesson) => {
              // Find progress for this lesson
              const lessonProgress = progress.docs.find(
                (p: PayloadLessonProgress) => {
                  const progressLessonId = typeof p.lesson === 'object' ? p.lesson?.id : p.lesson;
                  return progressLessonId === lesson.id;
                }
              );
              const progressInfo: LessonProgressInfo = lessonProgress
                ? { status: lessonProgress.status ?? 'not_started', progressPercent: lessonProgress.progressPercent ?? 0 }
                : { status: 'not_started', progressPercent: 0 };

              return {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                estimatedMinutes: lesson.estimatedMinutes,
                isMandatory: lesson.isMandatory,
                // Include progress for this lesson
                progress: progressInfo,
              };
            }),
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
  } catch (error: unknown) {
    console.error('[LMS Enrollment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch enrollment';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

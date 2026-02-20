/**
 * LMS Lesson API
 *
 * Returns lesson details with materials and progress for a specific enrollment.
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPayload } from 'payload';
import config from '@payload-config';

// ============================================================================
// Type Definitions
// ============================================================================

/** Generic Payload document with common fields */
interface PayloadDocument {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/** File/media attachment */
interface PayloadFile {
  id?: string;
  url?: string;
  filesize?: number;
  filename?: string;
  mimeType?: string;
}

/** Student reference */
interface StudentRef extends PayloadDocument {
  email?: string;
  name?: string;
}

/** Course data */
interface CourseData extends PayloadDocument {
  title?: string;
  description?: string;
}

/** Course run with course reference */
interface CourseRunData extends PayloadDocument {
  course?: CourseData | string;
  startDate?: string;
  endDate?: string;
}

/** Module data */
interface ModuleData extends PayloadDocument {
  title?: string;
  description?: string;
  order?: number;
}

/** Lesson data structure */
interface LessonData extends PayloadDocument {
  title?: string;
  description?: string;
  content?: string;
  order?: number;
  estimatedMinutes?: number;
  isMandatory?: boolean;
  video?: PayloadFile;
  videoUrl?: string;
  videoDuration?: number;
  module?: ModuleData | string;
}

/** Enrollment data structure */
interface EnrollmentData extends PayloadDocument {
  student?: StudentRef | string;
  course_run?: CourseRunData;
  courseRun?: CourseRunData;
  status?: string;
}

/** Lesson progress data */
interface LessonProgressData extends PayloadDocument {
  enrollment?: string;
  lesson?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number;
  videoProgress?: number;
  lastPosition?: number;
  completedAt?: string;
}

/** Material data structure */
interface MaterialData extends PayloadDocument {
  title?: string;
  type?: string;
  file?: PayloadFile;
  url?: string;
  lesson?: string;
}

/** Formatted material for API response */
interface FormattedMaterial {
  id: string;
  title?: string;
  type: string;
  url?: string;
  size?: string;
}

/** Lesson navigation reference */
interface LessonNavRef {
  id: string;
  title?: string;
}

interface ProgressState {
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  videoProgress: number;
  lastPosition: number;
  completedAt?: string;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (decoded?.type !== 'campus') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: lessonId } = await params;
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'enrollmentId is required' },
        { status: 400 }
      );
    }

     
    const payload = await getPayload({ config });
    const studentId = decoded.sub!;

    // Verify enrollment belongs to student
    const enrollment = await payload.findByID({
      collection: 'enrollments' as 'payload-locked-documents',
      id: enrollmentId,
      depth: 3,
    }) as unknown as EnrollmentData | null;

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const enrollmentStudent = typeof enrollment.student === 'object' && enrollment.student !== null
      ? enrollment.student.id
      : enrollment.student;

    if (String(enrollmentStudent) !== studentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to this enrollment' },
        { status: 403 }
      );
    }

    // Get lesson
    const lesson = await payload.findByID({
      collection: 'lessons' as 'payload-locked-documents',
      id: lessonId,
      depth: 2,
    }) as unknown as LessonData | null;

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Get lesson progress
    let progressData: ProgressState = {
      status: 'not_started',
      progressPercent: 0,
      videoProgress: 0,
      lastPosition: 0,
      completedAt: undefined,
    };

    try {
      const progressResult = await payload.find({
        collection: 'lessonProgress' as 'payload-locked-documents',
        where: {
          enrollment: { equals: enrollmentId },
          lesson: { equals: lessonId },
        },
        limit: 1,
      }) as unknown as { docs: LessonProgressData[] };

      if (progressResult.docs.length > 0) {
        const progress = progressResult.docs[0];
        progressData = {
          status: progress.status ?? 'not_started',
          progressPercent: progress.progressPercent ?? 0,
          videoProgress: progress.videoProgress ?? 0,
          lastPosition: progress.lastPosition ?? 0,
          completedAt: progress.completedAt,
        };
      }
    } catch {
      // lessonProgress collection might not exist
      console.log('[LMS Lesson] Progress collection not available');
    }

    // Get module info
    const module: ModuleData | null = typeof lesson.module === 'object' && lesson.module !== null
      ? lesson.module
      : null;

    // Get course info
    const courseRun = enrollment.course_run ?? enrollment.courseRun;
    const course: CourseData | null = typeof courseRun?.course === 'object' && courseRun.course !== null
      ? courseRun.course
      : null;

    // Get materials for this lesson
    let materials: FormattedMaterial[] = [];
    try {
      const materialsResult = await payload.find({
        collection: 'materials' as 'payload-locked-documents',
        where: {
          lesson: { equals: lessonId },
        },
        depth: 1,
      }) as unknown as { docs: MaterialData[] };

      materials = materialsResult.docs.map((material: MaterialData): FormattedMaterial => ({
        id: material.id,
        title: material.title,
        type: material.type ?? 'document',
        url: material.file?.url ?? material.url,
        size: material.file?.filesize
          ? `${(material.file.filesize / 1024 / 1024).toFixed(1)} MB`
          : undefined,
      }));
    } catch {
      // Materials collection might not exist
      console.log('[LMS Lesson] Materials collection not available');
    }

    // Get navigation (previous/next lessons)
    const navigation: {
      previousLesson: LessonNavRef | undefined;
      nextLesson: LessonNavRef | undefined;
    } = {
      previousLesson: undefined,
      nextLesson: undefined,
    };

    if (module?.id) {
      try {
        const lessonsResult = await payload.find({
          collection: 'lessons' as 'payload-locked-documents',
          where: {
            module: { equals: module.id },
          },
          sort: 'order',
        }) as unknown as { docs: LessonData[] };

        const currentIndex = lessonsResult.docs.findIndex(
          (l: LessonData) => String(l.id) === String(lessonId)
        );

        if (currentIndex > 0) {
          const prev = lessonsResult.docs[currentIndex - 1];
          navigation.previousLesson = { id: prev.id, title: prev.title };
        }

        if (currentIndex < lessonsResult.docs.length - 1) {
          const next = lessonsResult.docs[currentIndex + 1];
          navigation.nextLesson = { id: next.id, title: next.title };
        }
      } catch {
        console.log('[LMS Lesson] Navigation fetch failed');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          order: lesson.order ?? 1,
          estimatedMinutes: lesson.estimatedMinutes ?? 0,
          isMandatory: lesson.isMandatory ?? false,
          videoUrl: lesson.video?.url ?? lesson.videoUrl,
          videoDuration: lesson.videoDuration,
        },
        module: module
          ? {
              id: module.id,
              title: module.title,
            }
          : null,
        course: course
          ? {
              id: course.id,
              title: course.title,
            }
          : null,
        enrollment: {
          id: enrollment.id,
        },
        progress: progressData,
        materials,
        navigation,
      },
    });
  } catch (error) {
    console.error('[LMS Lesson] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load lesson' },
      { status: 500 }
    );
  }
}

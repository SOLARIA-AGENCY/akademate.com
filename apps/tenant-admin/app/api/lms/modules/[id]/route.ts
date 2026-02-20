/**
 * LMS Module API Routes
 *
 * GET /api/lms/modules/:id - Get module with lessons
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ============================================================================
// TypeScript Interfaces for LMS Data
// ============================================================================

interface LmsModule {
  id: string;
  title: string;
  description?: string;
  order?: number;
  estimatedMinutes?: number;
  unlockDate?: string;
  status?: string;
}

interface LmsLesson {
  id: string;
  title: string;
  description?: string;
  content?: unknown;
  order?: number;
  estimatedMinutes?: number;
  isMandatory?: boolean;
  status?: string;
  resources?: LmsResource[];
}

interface LmsResource {
  id?: string;
  title?: string;
  url?: string;
  type?: string;
}

interface LmsMaterial {
  id: string;
  title: string;
  type?: string;
  url?: string;
  fileSize?: number;
}

interface LessonProgress {
  id: string;
  lesson: string | { id: string };
  enrollment: string | { id: string };
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  completedAt?: string;
}

type ProgressByLesson = Record<string, LessonProgress>;

// ============================================================================
// Type Guards
// ============================================================================

function isLmsModule(value: unknown): value is LmsModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value
  );
}

function isLmsLesson(value: unknown): value is LmsLesson {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value
  );
}

function isLmsMaterial(value: unknown): value is LmsMaterial {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value
  );
}

function isLessonProgress(value: unknown): value is LessonProgress {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lesson' in value &&
    'status' in value
  );
}

function extractLessonId(lesson: string | { id: string }): string {
  if (typeof lesson === 'string') {
    return lesson;
  }
  return lesson.id;
}

// ============================================================================
// Route Params
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/lms/modules/:id
 *
 * Returns module with all lessons and materials.
 * Optionally includes progress for a specific enrollment.
 *
 * Query params:
 * - enrollmentId: Include progress for this enrollment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: moduleId } = await params;
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: 'Module ID is required' },
        { status: 400 }
      );
    }

     
    const payload = await getPayloadHMR({ config: configPromise });

    // 1. Get module details
    const moduleResult = await payload.findByID({
      collection: 'modules' as 'users',
      id: moduleId,
      depth: 1,
    });

    if (!moduleResult || !isLmsModule(moduleResult)) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    const moduleData: LmsModule = moduleResult;

    // 2. Get lessons for this module
    const lessonsResult = await payload.find({
      collection: 'lessons' as 'users',
      where: { module: { equals: moduleId } },
      sort: 'order',
      depth: 1,
      limit: 100,
    });

    const lessonDocs = lessonsResult.docs.filter(isLmsLesson) as unknown as LmsLesson[];

    // 3. Get materials for this module
    const materialsResult = await payload.find({
      collection: 'materials' as 'users',
      where: { module: { equals: moduleId } },
      sort: 'order',
      depth: 1,
      limit: 100,
    });

    const materialDocs = materialsResult.docs.filter(isLmsMaterial) as unknown as LmsMaterial[];

    // 4. Get progress if enrollmentId provided
    const progressByLesson: ProgressByLesson = {};
    if (enrollmentId) {
      const progressResult = await payload.find({
        collection: 'lesson-progress' as 'users',
        where: {
          enrollment: { equals: enrollmentId },
          lesson: { in: lessonDocs.map((l) => l.id) },
        },
        limit: 100,
      });

      for (const doc of progressResult.docs) {
        if (isLessonProgress(doc)) {
          const lessonId = extractLessonId(doc.lesson);
          progressByLesson[lessonId] = doc;
        }
      }
    }

    // 5. Build response
    const completedLessonsCount = Object.values(progressByLesson).filter(
      (p: LessonProgress) => p.status === 'completed'
    ).length;

    const response = {
      success: true,
      data: {
        module: {
          id: moduleData.id,
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          estimatedMinutes: moduleData.estimatedMinutes,
          unlockDate: moduleData.unlockDate,
          status: moduleData.status,
        },
        lessons: lessonDocs.map((lesson: LmsLesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes,
          isMandatory: lesson.isMandatory,
          status: lesson.status,
          progress: progressByLesson[lesson.id] ?? {
            status: 'not_started',
            progressPercent: 0,
          },
          resources: lesson.resources ?? [],
        })),
        materials: materialDocs.map((material: LmsMaterial) => ({
          id: material.id,
          title: material.title,
          type: material.type,
          url: material.url,
          fileSize: material.fileSize,
        })),
        stats: {
          totalLessons: lessonDocs.length,
          totalMaterials: materialDocs.length,
          completedLessons: completedLessonsCount,
          progressPercent:
            lessonDocs.length > 0
              ? Math.round((completedLessonsCount / lessonDocs.length) * 100)
              : 0,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[LMS Module] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch module';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

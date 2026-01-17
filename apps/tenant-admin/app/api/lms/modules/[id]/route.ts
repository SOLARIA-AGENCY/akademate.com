/**
 * LMS Module API Routes
 *
 * GET /api/lms/modules/:id - Get module with lessons
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

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
    const module = await payload.findByID({
      collection: 'modules' as any,
      id: moduleId,
      depth: 1,
    });

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // 2. Get lessons for this module
    const lessons = await payload.find({
      collection: 'lessons' as any,
      where: { module: { equals: moduleId } },
      sort: 'order',
      depth: 1,
      limit: 100,
    });

    // 3. Get materials for this module
    const materials = await payload.find({
      collection: 'materials' as any,
      where: { module: { equals: moduleId } },
      sort: 'order',
      depth: 1,
      limit: 100,
    });

    // 4. Get progress if enrollmentId provided
    let progressByLesson: Record<string, any> = {};
    if (enrollmentId) {
      const progress = await payload.find({
        collection: 'lesson-progress' as any,
        where: {
          enrollment: { equals: enrollmentId },
          lesson: { in: lessons.docs.map((l) => l.id) },
        },
        limit: 100,
      });

      progressByLesson = progress.docs.reduce((acc: any, p: any) => {
        const lessonId = typeof p.lesson === 'string' ? p.lesson : p.lesson?.id;
        if (lessonId) acc[lessonId] = p;
        return acc;
      }, {});
    }

    // 5. Build response
    const response = {
      success: true,
      data: {
        module: {
          id: (module as any).id,
          title: (module as any).title,
          description: (module as any).description,
          order: (module as any).order,
          estimatedMinutes: (module as any).estimatedMinutes,
          unlockDate: (module as any).unlockDate,
          status: (module as any).status,
        },
        lessons: lessons.docs.map((lesson) => {
          const lessonRecord = lesson as any;
          return {
            id: lessonRecord.id,
            title: lessonRecord.title,
            description: lessonRecord.description,
            content: lessonRecord.content,
            order: lessonRecord.order,
            estimatedMinutes: lessonRecord.estimatedMinutes,
            isMandatory: lessonRecord.isMandatory,
            status: lessonRecord.status,
            progress: progressByLesson[lessonRecord.id] || {
            status: 'not_started',
            progressPercent: 0,
          },
          resources: lessonRecord.resources || [],
          };
        }),
        materials: materials.docs.map((material) => {
          const materialRecord = material as any;
          return {
            id: materialRecord.id,
            title: materialRecord.title,
            type: materialRecord.type,
            url: materialRecord.url,
            fileSize: materialRecord.fileSize,
          };
        }),
        stats: {
          totalLessons: lessons.totalDocs,
          totalMaterials: materials.totalDocs,
          completedLessons: Object.values(progressByLesson).filter(
            (p: any) => p.status === 'completed'
          ).length,
          progressPercent: lessons.totalDocs > 0
            ? Math.round(
                (Object.values(progressByLesson).filter(
                  (p: any) => p.status === 'completed'
                ).length / lessons.totalDocs) * 100
              )
            : 0,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[LMS Module] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch module' },
      { status: 500 }
    );
  }
}

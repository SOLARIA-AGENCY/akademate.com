/**
 * LMS Lesson API
 *
 * Returns lesson details with materials and progress for a specific enrollment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPayload } from 'payload';
import config from '@payload-config';

if (!process.env.CAMPUS_JWT_SECRET) {
  throw new Error('CAMPUS_JWT_SECRET environment variable is required');
}

const JWT_SECRET = new TextEncoder().encode(process.env.CAMPUS_JWT_SECRET);

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded || decoded.type !== 'campus') {
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
    const studentId = decoded.sub as string;

    // Verify enrollment belongs to student
    const enrollment = await payload.findByID({
      collection: 'enrollments' as any,
      id: enrollmentId,
      depth: 3,
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const enrollmentStudent = typeof (enrollment as any).student === 'object'
      ? (enrollment as any).student.id
      : (enrollment as any).student;

    if (String(enrollmentStudent) !== studentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to this enrollment' },
        { status: 403 }
      );
    }

    // Get lesson
    const lesson = await payload.findByID({
      collection: 'lessons' as any,
      id: lessonId,
      depth: 2,
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Get lesson progress
    let progressData = {
      status: 'not_started' as const,
      progressPercent: 0,
      videoProgress: 0,
      lastPosition: 0,
      completedAt: undefined as string | undefined,
    };

    try {
      const progressResult = await payload.find({
        collection: 'lessonProgress' as any,
        where: {
          enrollment: { equals: enrollmentId },
          lesson: { equals: lessonId },
        },
        limit: 1,
      });

      if (progressResult.docs.length > 0) {
        const progress = progressResult.docs[0] as any;
        progressData = {
          status: progress.status || 'not_started',
          progressPercent: progress.progressPercent || 0,
          videoProgress: progress.videoProgress || 0,
          lastPosition: progress.lastPosition || 0,
          completedAt: progress.completedAt,
        };
      }
    } catch (err) {
      // lessonProgress collection might not exist
      console.log('[LMS Lesson] Progress collection not available');
    }

    // Get module info
    const module = typeof (lesson as any).module === 'object'
      ? (lesson as any).module
      : null;

    // Get course info
    const courseRun = (enrollment as any).course_run ?? (enrollment as any).courseRun;
    const course = typeof courseRun?.course === 'object' ? courseRun.course : null;

    // Get materials for this lesson
    let materials: any[] = [];
    try {
      const materialsResult = await payload.find({
        collection: 'materials' as any,
        where: {
          lesson: { equals: lessonId },
        },
        depth: 1,
      });

      materials = materialsResult.docs.map((material: any) => ({
        id: material.id,
        title: material.title,
        type: material.type || 'document',
        url: material.file?.url || material.url,
        size: material.file?.filesize
          ? `${(material.file.filesize / 1024 / 1024).toFixed(1)} MB`
          : undefined,
      }));
    } catch (err) {
      // Materials collection might not exist
      console.log('[LMS Lesson] Materials collection not available');
    }

    // Get navigation (previous/next lessons)
    let navigation = {
      previousLesson: undefined as { id: string; title: string } | undefined,
      nextLesson: undefined as { id: string; title: string } | undefined,
    };

    if (module?.id) {
      try {
        const lessonsResult = await payload.find({
          collection: 'lessons' as any,
          where: {
            module: { equals: module.id },
          },
          sort: 'order',
        });

        const currentIndex = lessonsResult.docs.findIndex(
          (l: any) => String(l.id) === String(lessonId)
        );

        if (currentIndex > 0) {
          const prev = lessonsResult.docs[currentIndex - 1] as any;
          navigation.previousLesson = { id: prev.id, title: prev.title };
        }

        if (currentIndex < lessonsResult.docs.length - 1) {
          const next = lessonsResult.docs[currentIndex + 1] as any;
          navigation.nextLesson = { id: next.id, title: next.title };
        }
      } catch (err) {
        console.log('[LMS Lesson] Navigation fetch failed');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lesson: {
          id: lesson.id,
          title: (lesson as any).title,
          description: (lesson as any).description,
          content: (lesson as any).content,
          order: (lesson as any).order || 1,
          estimatedMinutes: (lesson as any).estimatedMinutes || 0,
          isMandatory: (lesson as any).isMandatory || false,
          videoUrl: (lesson as any).video?.url || (lesson as any).videoUrl,
          videoDuration: (lesson as any).videoDuration,
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

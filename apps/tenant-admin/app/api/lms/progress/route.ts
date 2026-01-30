/**
 * LMS Progress API Routes
 *
 * Exposes progress tracking functionality from @akademate/lms
 *
 * NOTE: LMS collections (lesson-progress, enrollments) are planned but not yet in Payload config.
 * Custom interfaces are defined below until Task AKD-XXX: Create LMS Collections is completed.
 */

import type { Payload } from 'payload';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ============================================================================
// Type Definitions for LMS Collections (planned but not yet in Payload config)
// ============================================================================

/** Enrollment record linking a user to a course run */
interface Enrollment {
    id: string;
    user: string;
    courseRun: string;
    status: 'active' | 'completed' | 'dropped' | 'pending';
    lastAccessAt?: string;
    createdAt: string;
    updatedAt: string;
}

/** Individual lesson progress record */
interface LessonProgress {
    id: string;
    enrollment: string;
    lesson: string;
    isCompleted: boolean;
    completedAt?: string | null;
    timeSpent: number;
    lastPosition: number;
    createdAt: string;
    updatedAt: string;
}

/** Payload find response for lesson progress */
interface LessonProgressFindResult {
    docs: LessonProgress[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
}

/** Request body for POST /api/lms/progress */
interface ProgressUpdateBody {
    enrollmentId: string;
    lessonId: string;
    isCompleted?: boolean;
    timeSpent?: number;
    lastPosition?: number;
}

/** Extended Payload client with LMS collections */
interface PayloadWithLMS {
    find(args: {
        collection: 'lesson-progress';
        where?: Record<string, unknown>;
        depth?: number;
        limit?: number;
    }): Promise<LessonProgressFindResult>;
    create(args: {
        collection: 'lesson-progress';
        data: Omit<LessonProgress, 'id' | 'createdAt' | 'updatedAt'>;
    }): Promise<LessonProgress>;
    update(args: {
        collection: 'lesson-progress';
        id: string;
        data: Partial<LessonProgress>;
    }): Promise<LessonProgress>;
}

/**
 * GET /api/lms/progress?enrollmentId=X
 *
 * Get progress summary for an enrollment
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const enrollmentId = searchParams.get('enrollmentId');

        if (!enrollmentId) {
            return NextResponse.json(
                { success: false, error: 'enrollmentId is required' },
                { status: 400 }
            );
        }

         
        const payload: Payload = await getPayloadHMR({ config: configPromise });

        // Get enrollment details
        const enrollment = await payload.findByID({
            collection: 'enrollments',
            id: enrollmentId,
            depth: 2,
        }) as unknown as Enrollment;

        if (!enrollment) {
            return NextResponse.json(
                { success: false, error: 'Enrollment not found' },
                { status: 404 }
            );
        }

        // Get all lesson progress for this enrollment
        // Note: lesson-progress collection is planned but not yet implemented
        const payloadLMS = payload as unknown as PayloadWithLMS;
        const lessonProgress = await payloadLMS.find({
            collection: 'lesson-progress',
            where: { enrollment: { equals: enrollmentId } },
            depth: 1,
            limit: 500,
        });

        // Calculate progress summary
        const completedLessons = lessonProgress.docs.filter(
            (lp: LessonProgress) => lp.isCompleted
        ).length;
        const totalLessons = lessonProgress.docs.length;
        const progressPercent = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        const totalTimeSpent = lessonProgress.docs.reduce(
            (acc: number, lp: LessonProgress) => acc + (lp.timeSpent ?? 0),
            0
        );

        return NextResponse.json({
            success: true,
            data: {
                enrollmentId,
                userId: enrollment.user,
                courseRunId: enrollment.courseRun,
                status: enrollment.status,
                completedLessons,
                totalLessons,
                progressPercent,
                totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
                lastAccessAt: enrollment.lastAccessAt,
                lessonProgress: lessonProgress.docs,
            },
        });
    } catch (error: unknown) {
        console.error('[LMS Progress] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch progress';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/lms/progress
 *
 * Update lesson progress
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ProgressUpdateBody;
        const { enrollmentId, lessonId, isCompleted, timeSpent, lastPosition } = body;

        if (!enrollmentId || !lessonId) {
            return NextResponse.json(
                { success: false, error: 'enrollmentId and lessonId are required' },
                { status: 400 }
            );
        }

         
        const payload: Payload = await getPayloadHMR({ config: configPromise });
        const payloadLMS = payload as unknown as PayloadWithLMS;

        // Check if progress record exists
        // Note: lesson-progress collection is planned but not yet implemented
        const existing = await payloadLMS.find({
            collection: 'lesson-progress',
            where: {
                and: [
                    { enrollment: { equals: enrollmentId } },
                    { lesson: { equals: lessonId } },
                ],
            },
            limit: 1,
        });

        let progress: LessonProgress;
        if (existing.docs.length > 0) {
            // Update existing
            const existingRecord = existing.docs[0];
            const updateData: Partial<LessonProgress> = {
                isCompleted: isCompleted ?? existingRecord.isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : existingRecord.completedAt,
                timeSpent: timeSpent ?? existingRecord.timeSpent,
                lastPosition: lastPosition ?? existingRecord.lastPosition,
            };
            progress = await payloadLMS.update({
                collection: 'lesson-progress',
                id: existingRecord.id,
                data: updateData,
            });
        } else {
            // Create new
            const createData: Omit<LessonProgress, 'id' | 'createdAt' | 'updatedAt'> = {
                enrollment: enrollmentId,
                lesson: lessonId,
                isCompleted: isCompleted ?? false,
                completedAt: isCompleted ? new Date().toISOString() : null,
                timeSpent: timeSpent ?? 0,
                lastPosition: lastPosition ?? 0,
            };
            progress = await payloadLMS.create({
                collection: 'lesson-progress',
                data: createData,
            });
        }

        // Update enrollment lastAccessAt
        await payload.update({
            collection: 'enrollments',
            id: enrollmentId,
            data: {
                lastAccessAt: new Date().toISOString(),
            } as Partial<Enrollment>,
        });

        return NextResponse.json({
            success: true,
            data: progress,
            message: 'Progress updated successfully',
        });
    } catch (error: unknown) {
        console.error('[LMS Progress] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update progress';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

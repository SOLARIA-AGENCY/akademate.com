/**
 * LMS Progress API Routes
 *
 * Exposes progress tracking functionality from @akademate/lms
 *
 * NOTE: LMS collections (lesson-progress, enrollments) are planned but not yet in Payload config.
 * Type assertions (as any) are required until Task AKD-XXX: Create LMS Collections is completed.
 * This is documented technical debt, not a code smell.
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

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

        const payload = await getPayloadHMR({ config: configPromise });

        // Get enrollment details
        const enrollment = await payload.findByID({
            collection: 'enrollments',
            id: enrollmentId,
            depth: 2,
        }) as any;

        if (!enrollment) {
            return NextResponse.json(
                { success: false, error: 'Enrollment not found' },
                { status: 404 }
            );
        }

        // Get all lesson progress for this enrollment
        // Note: lesson-progress collection is planned but not yet implemented
        const lessonProgress = await (payload as any).find({
            collection: 'lesson-progress',
            where: { enrollment: { equals: enrollmentId } },
            depth: 1,
            limit: 500,
        });

        // Calculate progress summary
        const completedLessons = lessonProgress.docs.filter(
            (lp: any) => lp.isCompleted
        ).length;
        const totalLessons = lessonProgress.docs.length;
        const progressPercent = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        const totalTimeSpent = lessonProgress.docs.reduce(
            (acc: number, lp: any) => acc + (lp.timeSpent || 0),
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
    } catch (error: any) {
        console.error('[LMS Progress] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch progress' },
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
        const body = await request.json();
        const { enrollmentId, lessonId, isCompleted, timeSpent, lastPosition } = body;

        if (!enrollmentId || !lessonId) {
            return NextResponse.json(
                { success: false, error: 'enrollmentId and lessonId are required' },
                { status: 400 }
            );
        }

        const payload = await getPayloadHMR({ config: configPromise });

        // Check if progress record exists
        // Note: lesson-progress collection is planned but not yet implemented
        const existing = await (payload as any).find({
            collection: 'lesson-progress',
            where: {
                and: [
                    { enrollment: { equals: enrollmentId } },
                    { lesson: { equals: lessonId } },
                ],
            },
            limit: 1,
        });

        let progress;
        if (existing.docs.length > 0) {
            // Update existing
            const updateData = {
                isCompleted: isCompleted ?? existing.docs[0].isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : existing.docs[0].completedAt,
                timeSpent: timeSpent ?? existing.docs[0].timeSpent,
                lastPosition: lastPosition ?? existing.docs[0].lastPosition,
            };
            progress = await (payload as any).update({
                collection: 'lesson-progress',
                id: existing.docs[0].id,
                data: updateData,
            });
        } else {
            // Create new
            const createData = {
                enrollment: enrollmentId,
                lesson: lessonId,
                isCompleted: isCompleted ?? false,
                completedAt: isCompleted ? new Date().toISOString() : null,
                timeSpent: timeSpent ?? 0,
                lastPosition: lastPosition ?? 0,
            };
            progress = await (payload as any).create({
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
            } as any,
        });

        return NextResponse.json({
            success: true,
            data: progress,
            message: 'Progress updated successfully',
        });
    } catch (error: any) {
        console.error('[LMS Progress] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update progress' },
            { status: 500 }
        );
    }
}

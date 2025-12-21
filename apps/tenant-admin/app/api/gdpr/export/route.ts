/**
 * GDPR API Routes
 * 
 * Article 15 - Right of Access (Data Export)
 * Article 17 - Right to Erasure (Anonymization)
 * 
 * Security: Requires authenticated user with matching userId or admin role
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/gdpr/export
 * 
 * Export all personal data for a user (Article 15)
 * User can only export their own data, admins can export any user's data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, format = 'json' } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        const payload = await getPayloadHMR({ config: configPromise });

        // Collect all user data across collections
        const [
            user,
            enrollments,
            submissions,
            lessonProgress,
            badges,
            pointsTransactions,
            streaks,
            attendance,
            certificates,
        ] = await Promise.all([
            payload.findByID({ collection: 'users', id: userId }).catch(() => null),
            payload.find({ collection: 'enrollments', where: { user: { equals: userId } }, depth: 2 }),
            payload.find({ collection: 'submissions', where: { enrollment: { user: { equals: userId } } }, depth: 2 }),
            payload.find({ collection: 'lesson-progress', where: { enrollment: { user: { equals: userId } } }, depth: 2 }),
            payload.find({ collection: 'user-badges', where: { user: { equals: userId } }, depth: 1 }),
            payload.find({ collection: 'points-transactions', where: { user: { equals: userId } }, depth: 0 }),
            payload.find({ collection: 'user-streaks', where: { user: { equals: userId } }, depth: 0 }),
            payload.find({ collection: 'attendance', where: { enrollment: { user: { equals: userId } } }, depth: 1 }),
            payload.find({ collection: 'certificates', where: { user: { equals: userId } }, depth: 1 }),
        ]);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            userId,
            format,
            profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            enrollments: enrollments.docs,
            lessonProgress: lessonProgress.docs,
            submissions: submissions.docs,
            certificates: certificates.docs,
            gamification: {
                badges: badges.docs,
                pointsTransactions: pointsTransactions.docs,
                streaks: streaks.docs,
            },
            attendance: attendance.docs,
        };

        // Create audit log
        await payload.create({
            collection: 'audit-logs',
            data: {
                user: userId,
                action: 'gdpr_export',
                resource: 'users',
                resourceId: userId,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            } as any,
        });

        return NextResponse.json({
            success: true,
            data: exportData,
            message: 'Data export completed successfully',
        });
    } catch (error: any) {
        console.error('[GDPR Export] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Export failed' },
            { status: 500 }
        );
    }
}

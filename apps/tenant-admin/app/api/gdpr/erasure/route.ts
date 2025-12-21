/**
 * GDPR Erasure API Routes
 * 
 * Article 17 - Right to Erasure (Right to be Forgotten)
 * 
 * Anonymizes user PII while preserving academic records for compliance.
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * POST /api/gdpr/erasure
 * 
 * Anonymize user data (Article 17)
 * Requires explicit confirmation
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, confirmDeletion, reason } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        if (confirmDeletion !== true) {
            return NextResponse.json(
                { success: false, error: 'You must set confirmDeletion to true to proceed' },
                { status: 400 }
            );
        }

        const payload = await getPayloadHMR({ config: configPromise });

        // Verify user exists
        const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already anonymized
        if (user.email?.endsWith('@deleted.local')) {
            return NextResponse.json(
                { success: false, error: 'User has already been anonymized' },
                { status: 400 }
            );
        }

        // Generate anonymized email
        const hash = createHash('sha256')
            .update(`anonymize:${userId}`)
            .digest('hex')
            .substring(0, 12);
        const anonymizedEmail = `anonymized-${hash}@deleted.local`;

        // Get counts for reporting
        const [enrollments, certificates, submissions] = await Promise.all([
            payload.count({ collection: 'enrollments', where: { user: { equals: userId } } }),
            payload.count({ collection: 'certificates', where: { user: { equals: userId } } }),
            payload.count({ collection: 'submissions', where: { enrollment: { user: { equals: userId } } } }),
        ]);

        // Perform anonymization
        await payload.update({
            collection: 'users',
            id: userId,
            data: {
                email: anonymizedEmail,
                name: 'Deleted User',
            } as any,
        });

        // Clear gamification data
        await Promise.all([
            payload.delete({ collection: 'user-badges', where: { user: { equals: userId } } }),
            payload.delete({ collection: 'points-transactions', where: { user: { equals: userId } } }),
            payload.delete({ collection: 'user-streaks', where: { user: { equals: userId } } }),
        ]);

        // Create audit log
        const verificationToken = createHash('sha256')
            .update(`verify:${userId}:${Date.now()}`)
            .digest('hex')
            .substring(0, 32);

        await payload.create({
            collection: 'audit-logs',
            data: {
                user: userId,
                action: 'gdpr_erasure',
                resource: 'users',
                resourceId: userId,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                newValue: { reason, verificationToken },
            } as any,
        });

        return NextResponse.json({
            success: true,
            data: {
                userId,
                anonymizedAt: new Date().toISOString(),
                fieldsAnonymized: ['email', 'name'],
                recordsPreserved: {
                    enrollments: enrollments.totalDocs,
                    certificates: certificates.totalDocs,
                    submissions: submissions.totalDocs,
                },
                verificationToken,
            },
            message: 'User data has been anonymized in compliance with GDPR Article 17',
        });
    } catch (error: any) {
        console.error('[GDPR Erasure] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Erasure failed' },
            { status: 500 }
        );
    }
}

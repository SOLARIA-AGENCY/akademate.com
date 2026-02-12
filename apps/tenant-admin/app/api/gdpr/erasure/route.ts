/**
 * GDPR Erasure API Routes
 *
 * Article 17 - Right to Erasure (Right to be Forgotten)
 *
 * Anonymizes user PII while preserving academic records for compliance.
 *
 * NOTE: Some LMS collections referenced here are planned but not yet in Payload config.
 * Type assertions (as any) are required until Task AKD-XXX: Create LMS Collections is completed.
 * This is documented technical debt, not a code smell.
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
        const warnings: Array<{ collection: string; error: string }> = [];

        // Verify user exists
        const user = await payload.findByID({ collection: 'users', id: userId }).catch((error: unknown) => {
            console.error(`GDPR: Failed to find user ${userId}:`, error);
            return null;
        });

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
        // Note: Some collections (certificates, submissions) are planned but not yet implemented
        const [enrollments, certificates, submissions] = await Promise.all([
            payload.count({ collection: 'enrollments', where: { user: { equals: userId } } }).catch((error: unknown) => {
                console.error(`GDPR: Failed to count 'enrollments' for user ${userId}:`, error);
                warnings.push({ collection: 'enrollments', error: 'Count query failed' });
                return { totalDocs: 0 };
            }),
            (payload as any).count({ collection: 'certificates', where: { user: { equals: userId } } }).catch((error: unknown) => {
                console.error(`GDPR: Failed to count 'certificates' for user ${userId}:`, error);
                warnings.push({ collection: 'certificates', error: 'Count query failed' });
                return { totalDocs: 0 };
            }),
            (payload as any).count({ collection: 'submissions', where: { enrollment: { user: { equals: userId } } } }).catch((error: unknown) => {
                console.error(`GDPR: Failed to count 'submissions' for user ${userId}:`, error);
                warnings.push({ collection: 'submissions', error: 'Count query failed' });
                return { totalDocs: 0 };
            }),
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
        // Note: These collections are planned but not yet implemented
        await Promise.all([
            (payload as any).delete({ collection: 'user-badges', where: { user: { equals: userId } } }).catch((error: unknown) => {
                console.error(`GDPR: Failed to delete 'user-badges' for user ${userId}:`, error);
                warnings.push({ collection: 'user-badges', error: 'Delete failed' });
            }),
            (payload as any).delete({ collection: 'points-transactions', where: { user: { equals: userId } } }).catch((error: unknown) => {
                console.error(`GDPR: Failed to delete 'points-transactions' for user ${userId}:`, error);
                warnings.push({ collection: 'points-transactions', error: 'Delete failed' });
            }),
            (payload as any).delete({ collection: 'user-streaks', where: { user: { equals: userId } } }).catch((error: unknown) => {
                console.error(`GDPR: Failed to delete 'user-streaks' for user ${userId}:`, error);
                warnings.push({ collection: 'user-streaks', error: 'Delete failed' });
            }),
        ]);

        // Create audit log with verification token
        const verificationToken = createHash('sha256')
            .update(`verify:${userId}:${Date.now()}`)
            .digest('hex')
            .substring(0, 32);

        await payload.create({
            collection: 'audit-logs',
            data: {
                action: 'gdpr_erasure',
                collection_name: 'users',
                document_id: String(userId),
                user_id: Number(userId),
                ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
                changes: { after: { reason, verificationToken } },
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
            warnings,
            complete: warnings.length === 0,
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

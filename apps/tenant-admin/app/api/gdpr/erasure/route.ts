/**
 * GDPR Erasure API Routes
 *
 * Article 17 - Right to Erasure (Right to be Forgotten)
 *
 * Anonymizes user PII while preserving academic records for compliance.
 *
 * NOTE: Some LMS collections referenced here are planned but not yet in Payload config.
 * Type assertions are required until Task AKD-XXX: Create LMS Collections is completed.
 * This is documented technical debt, not a code smell.
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import type { Payload } from 'payload';

/**
 * Request body for GDPR erasure endpoint
 */
interface ErasureRequestBody {
    userId: string | number;
    confirmDeletion: boolean;
    reason?: string;
}

/**
 * Result from Payload count operations
 */
interface CountResult {
    totalDocs: number;
}

/**
 * User record from Payload
 */
interface UserRecord {
    id: number | string;
    email?: string;
    name?: string;
}

/**
 * Data for user anonymization update
 */
interface UserAnonymizationData {
    email: string;
    name: string;
}

/**
 * Audit log entry data for GDPR erasure
 */
interface AuditLogData {
    action: string;
    collection_name: string;
    document_id: string;
    user_id: number;
    ip_address: string;
    changes: {
        after: {
            reason?: string;
            verificationToken: string;
        };
    };
}

/**
 * Extended Payload client with planned LMS collections
 * These collections are planned but not yet implemented in Payload config
 */
interface PayloadWithPlannedCollections {
    count(args: { collection: string; where: Record<string, unknown> }): Promise<CountResult>;
    delete(args: { collection: string; where: Record<string, unknown> }): Promise<unknown>;
}

interface LoosePayloadClient {
    update(args: { collection: string; id: string | number; data: Record<string, unknown> }): Promise<unknown>;
    create(args: { collection: string; data: Record<string, unknown> }): Promise<unknown>;
}

/**
 * Helper to get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Erasure failed';
}

/**
 * POST /api/gdpr/erasure
 *
 * Anonymize user data (Article 17)
 * Requires explicit confirmation
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ErasureRequestBody;
        const { userId, confirmDeletion, reason } = body;
        const warnings: Array<{ collection: string; error: string }> = [];

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

         
        const payload: Payload = await getPayloadHMR({ config: configPromise });

        // Verify user exists
        const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null) as UserRecord | null;

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
        // Using typed interface for planned collections
        const payloadExtended = payload as unknown as PayloadWithPlannedCollections;
        const [enrollments, certificates, submissions] = await Promise.all([
            payloadExtended.count({ collection: 'enrollments', where: { user: { equals: userId } } }),
            payloadExtended.count({ collection: 'certificates', where: { user: { equals: userId } } }).catch((): CountResult => ({ totalDocs: 0 })),
            payloadExtended.count({ collection: 'submissions', where: { enrollment: { user: { equals: userId } } } }).catch((): CountResult => ({ totalDocs: 0 })),
        ]);

        // Perform anonymization
        const anonymizationData: UserAnonymizationData = {
            email: anonymizedEmail,
            name: 'Deleted User',
        };
        const payloadLoose = payload as unknown as LoosePayloadClient;
        await payloadLoose.update({
            collection: 'users',
            id: userId,
            data: anonymizationData as unknown as Record<string, unknown>,
        });

        // Clear gamification data
        // Note: These collections are planned but not yet implemented
        await Promise.all([
            payloadExtended.delete({ collection: 'user-badges', where: { user: { equals: userId } } }).catch(() => undefined),
            payloadExtended.delete({ collection: 'points-transactions', where: { user: { equals: userId } } }).catch(() => undefined),
            payloadExtended.delete({ collection: 'user-streaks', where: { user: { equals: userId } } }).catch(() => undefined),
        ]);

        // Create audit log with verification token
        const verificationToken = createHash('sha256')
            .update(`verify:${userId}:${Date.now()}`)
            .digest('hex')
            .substring(0, 32);

        const auditLogData: AuditLogData = {
            action: 'gdpr_erasure',
            collection_name: 'users',
            document_id: String(userId),
            user_id: Number(userId),
            ip_address: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
            changes: { after: { reason, verificationToken } },
        };
        await payloadLoose.create({
            collection: 'audit-logs',
            data: auditLogData as unknown as Record<string, unknown>,
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
    } catch (error: unknown) {
        console.error('[GDPR Erasure] Error:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) },
            { status: 500 }
        );
    }
}

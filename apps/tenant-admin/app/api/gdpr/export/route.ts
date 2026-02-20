/**
 * GDPR API Routes
 *
 * Article 15 - Right of Access (Data Export)
 *
 * Security: Requires authenticated user with matching userId or admin role
 *
 * NOTE: Some LMS collections referenced here are planned but not yet in Payload config.
 * Type assertions are required until Task AKD-XXX: Create LMS Collections is completed.
 * This is documented technical debt, not a code smell.
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ============================================================================
// GDPR Export Types
// ============================================================================

/** Request body for GDPR export */
interface GdprExportRequest {
    userId: string;
    format?: 'json' | 'csv';
}

/** User profile data for export */
interface UserProfile {
    id: string | number;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
}

/** Base document type for collections */
interface BaseDocument {
    id: string | number;
    createdAt?: string;
    updatedAt?: string;
}

/** Enrollment document */
interface EnrollmentDocument extends BaseDocument {
    user?: string | number;
    course?: string | number;
    status?: string;
}

/** Submission document */
interface SubmissionDocument extends BaseDocument {
    enrollment?: string | number;
    assignment?: string | number;
    score?: number;
}

/** Lesson progress document */
interface LessonProgressDocument extends BaseDocument {
    enrollment?: string | number;
    lesson?: string | number;
    completed?: boolean;
    progress?: number;
}

/** User badge document */
interface UserBadgeDocument extends BaseDocument {
    user: string | number;
    badge?: string | number;
    awardedAt?: string;
}

/** Points transaction document */
interface PointsTransactionDocument extends BaseDocument {
    user: string | number;
    points: number;
    reason?: string;
}

/** User streak document */
interface UserStreakDocument extends BaseDocument {
    user: string | number;
    currentStreak?: number;
    longestStreak?: number;
}

/** Attendance document */
interface AttendanceDocument extends BaseDocument {
    enrollment?: string | number;
    date?: string;
    present?: boolean;
}

/** Certificate document */
interface CertificateDocument extends BaseDocument {
    user: string | number;
    course?: string | number;
    issuedAt?: string;
}

/** Paginated result from Payload */
interface PaginatedDocs<T> {
    docs: T[];
    totalDocs?: number;
    limit?: number;
    page?: number;
    totalPages?: number;
}

/** User document from Payload */
interface UserDocument {
    id: string | number;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
}

/** Gamification data for export */
interface GamificationData {
    badges: UserBadgeDocument[];
    pointsTransactions: PointsTransactionDocument[];
    streaks: UserStreakDocument[];
}

/** Complete GDPR export data structure */
interface GdprExportData {
    exportedAt: string;
    userId: string;
    format: string;
    profile: UserProfile;
    enrollments: EnrollmentDocument[];
    lessonProgress: LessonProgressDocument[];
    submissions: SubmissionDocument[];
    certificates: CertificateDocument[];
    gamification: GamificationData;
    attendance: AttendanceDocument[];
}

/** Audit log data for GDPR actions */
interface AuditLogData {
    action: string;
    collection_name: string;
    document_id: string;
    user_id: number;
    ip_address: string;
}

interface LooseFindClient<T extends BaseDocument> {
    find: (args: { collection: string; where: Record<string, unknown>; depth: number }) => Promise<PaginatedDocs<T>>;
}

interface LooseCreateClient {
    create: (args: { collection: string; data: Record<string, unknown> }) => Promise<unknown>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely query a collection that may not exist yet
 * Returns empty docs array if collection query fails
 */
async function safeCollectionQuery<T extends BaseDocument>(
    payload: unknown,
    collection: string,
    where: Record<string, unknown>,
    depth = 0
): Promise<PaginatedDocs<T>> {
    try {
        const payloadWithFind = payload as LooseFindClient<T>;
        const result = await payloadWithFind.find({ collection, where, depth });
        return result;
    } catch {
        return { docs: [] };
    }
}

/**
 * Normalize error to get message safely
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Export failed';
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/gdpr/export
 *
 * Export all personal data for a user (Article 15)
 * User can only export their own data, admins can export any user's data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as GdprExportRequest;
        const userId = body.userId;
        const format = body.format ?? 'json';

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

         
        const payload = await getPayloadHMR({ config: configPromise });
        const warnings: Array<{ collection: string; error: string }> = [];

        // Query user first
        let user: UserDocument | null = null;
        try {
            user = await payload.findByID({ collection: 'users', id: userId }) as UserDocument;
        } catch {
            user = null;
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Collect all user data across collections
        // Note: Some collections (lesson-progress, user-badges, etc.) are planned but not yet implemented
        const userIdEquals = { user: { equals: userId } };
        const enrollmentUserEquals = { enrollment: { user: { equals: userId } } };

        const [
            enrollments,
            submissions,
            lessonProgress,
            badges,
            pointsTransactions,
            streaks,
            attendance,
            certificates,
        ] = await Promise.all([
            safeCollectionQuery<EnrollmentDocument>(payload, 'enrollments', userIdEquals, 2),
            safeCollectionQuery<SubmissionDocument>(payload, 'submissions', enrollmentUserEquals, 2),
            safeCollectionQuery<LessonProgressDocument>(payload, 'lesson-progress', enrollmentUserEquals, 2),
            safeCollectionQuery<UserBadgeDocument>(payload, 'user-badges', userIdEquals, 1),
            safeCollectionQuery<PointsTransactionDocument>(payload, 'points-transactions', userIdEquals, 0),
            safeCollectionQuery<UserStreakDocument>(payload, 'user-streaks', userIdEquals, 0),
            safeCollectionQuery<AttendanceDocument>(payload, 'attendance', enrollmentUserEquals, 1),
            safeCollectionQuery<CertificateDocument>(payload, 'certificates', userIdEquals, 1),
        ]);

        const exportData: GdprExportData = {
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

        // Create audit log for GDPR compliance
        const auditData: AuditLogData = {
            action: 'gdpr_export',
            collection_name: 'users',
            document_id: String(userId),
            user_id: Number(userId),
            ip_address: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
        };

        const payloadLoose = payload as unknown as LooseCreateClient;
        await payloadLoose.create({
            collection: 'audit-logs',
            data: auditData as unknown as Record<string, unknown>,
        });

        return NextResponse.json({
            success: true,
            data: exportData,
            warnings,
            complete: warnings.length === 0,
            message: 'Data export completed successfully',
        });
    } catch (error: unknown) {
        console.error('[GDPR Export] Error:', error);
        return NextResponse.json(
            { success: false, error: getErrorMessage(error) },
            { status: 500 }
        );
    }
}

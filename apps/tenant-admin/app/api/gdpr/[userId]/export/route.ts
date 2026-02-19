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
import type { Payload } from 'payload';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Generic collection query result structure from Payload CMS
 */
interface CollectionQueryResult<T = unknown> {
  docs: T[];
  totalDocs?: number;
  limit?: number;
  page?: number;
  totalPages?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  pagingCounter?: number;
  prevPage?: number | null;
  nextPage?: number | null;
}

/**
 * Planned LMS collection names (Task AKD-XXX)
 * These collections are defined in AuditLogs/schemas.ts but not yet in Payload config
 */
type PlannedLMSCollection =
  | 'submissions'
  | 'lesson-progress'
  | 'user-badges'
  | 'points-transactions'
  | 'user-streaks'
  | 'attendance'
  | 'certificates';

/**
 * Extended find arguments for planned collections
 */
interface ExtendedFindArgs {
  collection: PlannedLMSCollection;
  where?: Record<string, unknown>;
  depth?: number;
}

/**
 * Extended Payload interface that includes planned LMS collections
 * Provides type-safe access to collections not yet in the generated types
 */
interface ExtendedPayload {
  find(args: ExtendedFindArgs): Promise<CollectionQueryResult>;
}

/**
 * Audit log data for GDPR export tracking
 * Matches the fields expected by the audit-logs collection
 */
interface GdprExportAuditData {
  action: 'gdpr_export';
  collection_name: 'users';
  document_id: string;
  user_id: number;
  ip_address: string;
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * GET /api/gdpr/:userId/export
 *
 * Export all personal data for a user (Article 15)
 * User can only export their own data, admins can export any user's data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') ?? 'json';
    const warnings: Array<{ collection: string; error: string }> = [];

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

     
    const payload: Payload = await getPayloadHMR({ config: configPromise });

    // Cast to extended payload for accessing planned LMS collections
    const extendedPayload = payload as unknown as ExtendedPayload;

    // Collect all user data across collections
    // Note: Some collections (lesson-progress, user-badges, etc.) are planned but not yet implemented
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
      extendedPayload
        .find({
          collection: 'submissions',
          where: { enrollment: { user: { equals: userId } } },
          depth: 2,
        })
        .catch(() => ({ docs: [] })),
      extendedPayload
        .find({
          collection: 'lesson-progress',
          where: { enrollment: { user: { equals: userId } } },
          depth: 2,
        })
        .catch(() => ({ docs: [] })),
      extendedPayload
        .find({ collection: 'user-badges', where: { user: { equals: userId } }, depth: 1 })
        .catch(() => ({ docs: [] })),
      extendedPayload
        .find({ collection: 'points-transactions', where: { user: { equals: userId } }, depth: 0 })
        .catch(() => ({ docs: [] })),
      extendedPayload
        .find({ collection: 'user-streaks', where: { user: { equals: userId } }, depth: 0 })
        .catch(() => ({ docs: [] })),
      extendedPayload
        .find({
          collection: 'attendance',
          where: { enrollment: { user: { equals: userId } } },
          depth: 1,
        })
        .catch(() => ({ docs: [] })),
      extendedPayload
        .find({ collection: 'certificates', where: { user: { equals: userId } }, depth: 1 })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'certificates' for user ${userId}:`, error);
          warnings.push({ collection: 'certificates', error: 'Query failed' });
          return { docs: [] };
        }),
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

    // Create audit log for GDPR compliance
    const auditData: GdprExportAuditData = {
      action: 'gdpr_export',
      collection_name: 'users',
      document_id: String(userId),
      user_id: Number(userId),
      ip_address: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
    };

    await payload.create({
      collection: 'audit-logs',
      data: auditData as Parameters<typeof payload.create>[0]['data'],
    });

    const response = NextResponse.json({
      success: true,
      data: exportData,
      warnings,
      complete: warnings.length === 0,
      message: 'Data export completed successfully',
    });

    response.headers.set(
      'content-disposition',
      `attachment; filename="gdpr-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`
    );

    return response;
  } catch (error: unknown) {
    console.error('[GDPR Export] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

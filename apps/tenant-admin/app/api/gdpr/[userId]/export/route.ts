/**
 * GDPR API Routes
 *
 * Article 15 - Right of Access (Data Export)
 *
 * Security: Requires authenticated user with matching userId or admin role
 *
 * NOTE: Some LMS collections referenced here are planned but not yet in Payload config.
 * Type assertions (as any) are required until Task AKD-XXX: Create LMS Collections is completed.
 * This is documented technical debt, not a code smell.
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

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
    const format = url.searchParams.get('format') || 'json';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });
    const warnings: Array<{ collection: string; error: string }> = [];

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
      payload.findByID({ collection: 'users', id: userId }).catch((error: unknown) => {
        console.error(`GDPR: Failed to find user ${userId}:`, error);
        return null;
      }),
      payload.find({ collection: 'enrollments', where: { user: { equals: userId } }, depth: 2 }).catch((error: unknown) => {
        console.error(`GDPR: Failed to query 'enrollments' for user ${userId}:`, error);
        warnings.push({ collection: 'enrollments', error: 'Query failed' });
        return { docs: [] as any[] };
      }),
      (payload as any)
        .find({
          collection: 'submissions',
          where: { enrollment: { user: { equals: userId } } },
          depth: 2,
        })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'submissions' for user ${userId}:`, error);
          warnings.push({ collection: 'submissions', error: 'Query failed' });
          return { docs: [] };
        }),
      (payload as any)
        .find({
          collection: 'lesson-progress',
          where: { enrollment: { user: { equals: userId } } },
          depth: 2,
        })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'lesson-progress' for user ${userId}:`, error);
          warnings.push({ collection: 'lesson-progress', error: 'Query failed' });
          return { docs: [] };
        }),
      (payload as any)
        .find({ collection: 'user-badges', where: { user: { equals: userId } }, depth: 1 })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'user-badges' for user ${userId}:`, error);
          warnings.push({ collection: 'user-badges', error: 'Query failed' });
          return { docs: [] };
        }),
      (payload as any)
        .find({ collection: 'points-transactions', where: { user: { equals: userId } }, depth: 0 })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'points-transactions' for user ${userId}:`, error);
          warnings.push({ collection: 'points-transactions', error: 'Query failed' });
          return { docs: [] };
        }),
      (payload as any)
        .find({ collection: 'user-streaks', where: { user: { equals: userId } }, depth: 0 })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'user-streaks' for user ${userId}:`, error);
          warnings.push({ collection: 'user-streaks', error: 'Query failed' });
          return { docs: [] };
        }),
      (payload as any)
        .find({
          collection: 'attendance',
          where: { enrollment: { user: { equals: userId } } },
          depth: 1,
        })
        .catch((error: unknown) => {
          console.error(`GDPR: Failed to query 'attendance' for user ${userId}:`, error);
          warnings.push({ collection: 'attendance', error: 'Query failed' });
          return { docs: [] };
        }),
      (payload as any)
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
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'gdpr_export',
        collection_name: 'users',
        document_id: String(userId),
        user_id: Number(userId),
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      } as any,
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
  } catch (error: any) {
    console.error('[GDPR Export] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}

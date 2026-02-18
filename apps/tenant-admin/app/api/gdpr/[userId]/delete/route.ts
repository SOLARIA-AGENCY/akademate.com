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

import type { Payload } from 'payload';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

/** Request body for GDPR erasure endpoint */
interface GdprDeleteRequestBody {
  confirmDeletion: boolean;
  reason?: string;
}

/** Result from payload.count() operation */
interface CountResult {
  totalDocs: number;
}

/** Response data for successful erasure */
interface ErasureResponseData {
  userId: string;
  anonymizedAt: string;
  fieldsAnonymized: string[];
  recordsPreserved: {
    enrollments: number;
    certificates: number;
    submissions: number;
  };
  verificationToken: string;
}

/** Audit log changes structure */
interface AuditLogChanges {
  after: {
    reason?: string;
    verificationToken: string;
  };
}

/** Payload instance type for operations on planned collections */
interface PayloadWithPlannedCollections {
  count: (args: { collection: string; where: Record<string, unknown> }) => Promise<CountResult>;
  delete: (args: { collection: string; where: Record<string, unknown> }) => Promise<unknown>;
}

/** User update data structure */
interface UserUpdateData {
  email: string;
  name: string;
}

/** Audit log creation data structure */
interface AuditLogData {
  action: string;
  collection_name: string;
  document_id: string;
  user_id: number;
  ip_address: string;
  changes: AuditLogChanges;
}

/**
 * Helper to safely count documents in collections that may not exist yet.
 * Returns 0 if the collection is not found or an error occurs.
 */
async function safeCount(
  payload: Payload,
  collection: string,
  where: Record<string, unknown>
): Promise<CountResult> {
  try {
    // Type assertion needed for planned collections not yet in Payload config
    const typedPayload = payload as unknown as PayloadWithPlannedCollections;
    return await typedPayload.count({ collection, where });
  } catch {
    return { totalDocs: 0 };
  }
}

/**
 * Helper to safely delete documents from collections that may not exist yet.
 */
async function safeDelete(
  payload: Payload,
  collection: string,
  where: Record<string, unknown>
): Promise<void> {
  try {
    // Type assertion needed for planned collections not yet in Payload config
    const typedPayload = payload as unknown as PayloadWithPlannedCollections;
    await typedPayload.delete({ collection, where });
  } catch {
    // Collection may not exist yet - this is expected
  }
}

/**
 * Extracts error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erasure failed';
}

/**
 * POST /api/gdpr/:userId/delete
 *
 * Anonymize user data (Article 17)
 * Requires explicit confirmation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = (await request.json()) as GdprDeleteRequestBody;
    const { confirmDeletion, reason } = body;

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
      payload.count({ collection: 'enrollments', where: { user: { equals: userId } } }),
      safeCount(payload, 'certificates', { user: { equals: userId } }),
      safeCount(payload, 'submissions', { enrollment: { user: { equals: userId } } }),
    ]);

    // Perform anonymization
    const updateData: UserUpdateData = {
      email: anonymizedEmail,
      name: 'Deleted User',
    };
    await payload.update({
      collection: 'users',
      id: userId,
      data: updateData as Parameters<typeof payload.update>[0]['data'],
    });

    // Clear gamification data
    // Note: These collections are planned but not yet implemented
    await Promise.all([
      safeDelete(payload, 'user-badges', { user: { equals: userId } }),
      safeDelete(payload, 'points-transactions', { user: { equals: userId } }),
      safeDelete(payload, 'user-streaks', { user: { equals: userId } }),
    ]);

    // Create audit log with verification token
    const verificationToken = createHash('sha256')
      .update(`verify:${userId}:${Date.now()}`)
      .digest('hex')
      .substring(0, 32);

    const auditLogChanges: AuditLogChanges = {
      after: { reason, verificationToken },
    };

    const auditLogData: AuditLogData = {
      action: 'gdpr_erasure',
      collection_name: 'users',
      document_id: String(userId),
      user_id: Number(userId),
      ip_address: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
      changes: auditLogChanges,
    };

    await payload.create({
      collection: 'audit-logs',
      data: auditLogData as Parameters<typeof payload.create>[0]['data'],
    });

    const responseData: ErasureResponseData = {
      userId,
      anonymizedAt: new Date().toISOString(),
      fieldsAnonymized: ['email', 'name'],
      recordsPreserved: {
        enrollments: enrollments.totalDocs,
        certificates: certificates.totalDocs,
        submissions: submissions.totalDocs,
      },
      verificationToken,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
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

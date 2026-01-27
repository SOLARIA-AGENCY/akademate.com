/**
 * GDPR Consent API Routes
 *
 * Article 7 - Conditions for Consent
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

const DEFAULT_CONSENTS = {
  marketing_email: false,
  marketing_sms: false,
  marketing_phone: false,
  analytics: false,
  third_party_sharing: false,
  profiling: false,
  newsletter: false,
};

/**
 * GET /api/gdpr/:userId/consent
 *
 * Returns current consent status for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

    const logs = await payload.find({
      collection: 'audit-logs',
      where: {
        and: [
          { collection_name: { equals: 'users' } },
          { document_id: { equals: String(userId) } },
          { action: { equals: 'update' } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    });

    const latest = logs.docs?.[0] as any;
    const consentState = latest?.changes?.after?.consents || DEFAULT_CONSENTS;
    const updatedAt = latest?.createdAt || new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: {
        userId,
        consents: consentState,
        updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[GDPR Consent] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Consent lookup failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gdpr/:userId/consent
 *
 * Updates consent status for a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const consents = body?.consents;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!consents || typeof consents !== 'object') {
      return NextResponse.json(
        { success: false, error: 'consents object is required' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });
    const updatedAt = new Date().toISOString();

    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'update',
        collection_name: 'users',
        document_id: String(userId),
        user_id: Number(userId),
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        changes: { after: { consents, updatedAt } },
        metadata: {
          source: 'gdpr_consent',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      } as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        consents: { ...DEFAULT_CONSENTS, ...consents },
        updatedAt,
      },
      message: 'Consent updated successfully',
    });
  } catch (error: any) {
    console.error('[GDPR Consent] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Consent update failed' },
      { status: 500 }
    );
  }
}

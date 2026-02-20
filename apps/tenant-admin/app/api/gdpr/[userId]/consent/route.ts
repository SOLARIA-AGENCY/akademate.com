/**
 * GDPR Consent API Routes
 *
 * Article 7 - Conditions for Consent
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

interface ConsentState {
  marketing_email: boolean;
  marketing_sms: boolean;
  marketing_phone: boolean;
  analytics: boolean;
  third_party_sharing: boolean;
  profiling: boolean;
  newsletter: boolean;
}

interface AuditLogChanges {
  after?: {
    consents?: ConsentState;
    updatedAt?: string;
  };
}

interface AuditLogRecord {
  changes?: AuditLogChanges;
  createdAt?: string;
}

interface AuditLogCreateData {
  action: string;
  collection_name: string;
  document_id: string;
  user_id: number;
  ip_address: string;
  changes: {
    after: {
      consents: Partial<ConsentState>;
      updatedAt: string;
    };
  };
  metadata: {
    source: string;
    userAgent: string;
  };
}

interface ConsentRequestBody {
  consents?: Partial<ConsentState>;
}

interface LoosePayloadClient {
  create: (args: { collection: string; data: Record<string, unknown> }) => Promise<unknown>;
}

const DEFAULT_CONSENTS: ConsentState = {
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

    const latest = logs.docs?.[0] as AuditLogRecord | undefined;
    const consentState = latest?.changes?.after?.consents ?? DEFAULT_CONSENTS;
    const updatedAt = latest?.createdAt ?? new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: {
        userId,
        consents: consentState,
        updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error('[GDPR Consent] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Consent lookup failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
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
    const body = (await request.json()) as ConsentRequestBody;
    const consents: Partial<ConsentState> | undefined = body?.consents;

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

    const auditLogData: AuditLogCreateData = {
      action: 'update',
      collection_name: 'users',
      document_id: String(userId),
      user_id: Number(userId),
      ip_address: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
      changes: { after: { consents, updatedAt } },
      metadata: {
        source: 'gdpr_consent',
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      },
    };

    const payloadLoose = payload as unknown as LoosePayloadClient;
    await payloadLoose.create({
      collection: 'audit-logs',
      data: auditLogData as unknown as Record<string, unknown>,
    });

    const mergedConsents: ConsentState = { ...DEFAULT_CONSENTS, ...consents };

    return NextResponse.json({
      success: true,
      data: {
        userId,
        consents: mergedConsents,
        updatedAt,
      },
      message: 'Consent updated successfully',
    });
  } catch (error: unknown) {
    console.error('[GDPR Consent] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Consent update failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

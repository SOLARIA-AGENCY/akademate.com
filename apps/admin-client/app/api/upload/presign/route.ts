/**
 * Presigned upload URL endpoint
 * POST /api/upload/presign
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, UPLOAD_BUCKET, generateUniqueFilename, validateFile, MAX_FILE_SIZE } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, size } = body as {
      filename?: string;
      contentType?: string;
      size?: number;
    };

    const tenantId = request.headers.get('x-tenant-id')?.trim();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant header (x-tenant-id) is required' },
        { status: 400 }
      );
    }

    if (!filename || !contentType || typeof size !== 'number') {
      return NextResponse.json(
        { success: false, error: 'filename, contentType and size are required' },
        { status: 400 }
      );
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const validation = validateFile({
      name: filename,
      type: contentType,
      size,
    } as File);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const uniqueFilename = generateUniqueFilename(filename);
    const objectKey = `${tenantId}/${uniqueFilename}`;

    const command = new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        originalName: filename,
        tenantId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });

    return NextResponse.json({
      success: true,
      url,
      key: objectKey,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('Presign upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create presigned URL' },
      { status: 500 }
    );
  }
}

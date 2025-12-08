/**
 * File Upload API Route
 *
 * Handles file uploads to MinIO S3-compatible storage.
 * Validates file type and size before uploading.
 *
 * POST /api/upload
 * - Accepts multipart/form-data with 'file' field
 * - Returns JSON with upload success status and file URL
 *
 * @module app/api/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  s3Client,
  UPLOAD_BUCKET,
  generateUniqueFilename,
  validateFile,
} from '@/lib/s3';

/**
 * POST /api/upload
 *
 * Upload a file to MinIO S3 storage
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'file' field
 *
 * Response:
 * - Success (200): { success: true, filename: string, url: string }
 * - Error (400): { success: false, error: string }
 * - Error (500): { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    const command = new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Construct public URL
    // MinIO public URL format: http://minio:9000/bucket/key
    const minioPublicUrl = process.env.S3_PUBLIC_URL || 'http://localhost:9000';
    const fileUrl = `${minioPublicUrl}/${UPLOAD_BUCKET}/${filename}`;

    // TODO: Save file metadata to database
    // await db.insert(media).values({
    //   filename,
    //   originalName: file.name,
    //   mimeType: file.type,
    //   filesize: file.size,
    //   url: fileUrl,
    //   createdAt: new Date(),
    // });

    return NextResponse.json({
      success: true,
      filename,
      url: fileUrl,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'file-upload',
    bucket: UPLOAD_BUCKET,
  });
}

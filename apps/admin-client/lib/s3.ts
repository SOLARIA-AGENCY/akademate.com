/**
 * S3 Client Configuration for MinIO
 *
 * Provides S3-compatible storage client for file uploads.
 * Uses MinIO/R2 as S3-compatible object storage backend.
 *
 * @module lib/s3
 */

import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3 Client instance configured for MinIO
 *
 * Configuration:
 * - Endpoint: MinIO server (http://minio:9000 internal, configurable)
 * - Region: us-east-1 (MinIO requirement)
 * - forcePathStyle: true (required for MinIO compatibility)
 *
 * Environment Variables Required:
 * - S3_ENDPOINT: MinIO/R2 server endpoint
 * - S3_ACCESS_KEY_ID: Access key ID
 * - S3_SECRET_ACCESS_KEY: Secret access key
 */
export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  region: process.env.S3_REGION || 'us-east-1', // MinIO requires a region
  forcePathStyle: true, // Required for MinIO (path-style URLs: http://minio:9000/bucket/key)
});

/**
 * Default bucket name for file uploads
 */
export const UPLOAD_BUCKET = process.env.S3_BUCKET || 'akademate-assets';

/**
 * Maximum file size (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

/**
 * Allowed MIME types for uploads
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * Generate unique filename with timestamp
 *
 * @param originalName - Original file name
 * @returns Unique filename with timestamp prefix
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${sanitized}`;
}

/**
 * Validate file type and size
 *
 * @param file - File to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

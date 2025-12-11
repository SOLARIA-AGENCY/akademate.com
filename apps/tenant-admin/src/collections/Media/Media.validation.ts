import { z } from 'zod';

/**
 * Media Collection Validation Schemas
 *
 * Purpose:
 * - Validate media metadata (alt, caption, folder, focal point)
 * - Enforce file type and size restrictions
 * - Prevent security vulnerabilities (path traversal, executable uploads)
 *
 * Security Considerations:
 * - Reject executable file types (.exe, .sh, .bat, .dll, .app)
 * - Sanitize folder paths (no directory traversal)
 * - Sanitize filenames (no path injection, null bytes)
 * - Enforce maximum file size (50MB)
 * - Validate MIME type against file extension
 *
 * Validation Layers:
 * 1. Zod schemas (runtime validation)
 * 2. Payload field validators (client + API)
 * 3. Hooks (business logic validation)
 */

// ============================================================================
// FIELD VALIDATION SCHEMAS
// ============================================================================

/**
 * Alt Text Validation
 * - Required for accessibility (WCAG 2.1)
 * - Minimum 3 characters (meaningful description)
 * - Maximum 500 characters (concise description)
 */
export const altSchema = z
  .string()
  .min(3, 'Alt text must be at least 3 characters for accessibility')
  .max(500, 'Alt text must not exceed 500 characters')
  .trim();

/**
 * Caption Validation
 * - Optional extended description
 * - Maximum 1000 characters
 */
export const captionSchema = z
  .string()
  .max(1000, 'Caption must not exceed 1000 characters')
  .trim()
  .optional();

/**
 * Folder Validation
 * - Lowercase alphanumeric with hyphens and slashes
 * - No directory traversal (../)
 * - No leading/trailing slashes
 * - Format: courses/images, blog/2025, campaigns/meta-ads
 */
export const folderSchema = z
  .string()
  .regex(
    /^[a-z0-9]+([/-][a-z0-9]+)*$/,
    'Folder must be lowercase alphanumeric with hyphens/slashes only (e.g., courses/images)'
  )
  .refine(
    (folder) => !folder.includes('..'),
    'Folder cannot contain directory traversal sequences (..)'
  )
  .refine(
    (folder) => !folder.startsWith('/') && !folder.endsWith('/'),
    'Folder cannot start or end with slashes'
  )
  .optional();

/**
 * Focal Point X Coordinate Validation
 * - Percentage from left (0 = left edge, 100 = right edge)
 * - Used for smart image cropping
 */
export const focalXSchema = z
  .number()
  .min(0, 'Focal X must be between 0 and 100')
  .max(100, 'Focal X must be between 0 and 100')
  .optional();

/**
 * Focal Point Y Coordinate Validation
 * - Percentage from top (0 = top edge, 100 = bottom edge)
 * - Used for smart image cropping
 */
export const focalYSchema = z
  .number()
  .min(0, 'Focal Y must be between 0 and 100')
  .max(100, 'Focal Y must be between 0 and 100')
  .optional();

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Allowed MIME Types
 * - Images: PNG, JPEG, WebP, GIF, SVG
 * - Videos: MP4, WebM, MOV
 * - Documents: PDF
 * - SECURITY: Executables are REJECTED
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  // Documents
  'application/pdf',
] as const;

/**
 * Blocked MIME Types (Security)
 * - Executables and scripts
 * - Potentially dangerous file types
 */
export const BLOCKED_MIME_TYPES = [
  'application/x-msdownload', // .exe
  'application/x-executable', // Generic executable
  'application/x-sh', // Shell script
  'application/x-bat', // Batch script
  'application/x-dll', // DLL
  'application/x-app', // macOS app
  'application/x-deb', // Debian package
  'application/x-rpm', // RPM package
  'application/x-msi', // Windows installer
  'application/octet-stream', // Generic binary (too risky)
] as const;

/**
 * Dangerous File Extensions
 * - Even if MIME type is safe, reject these extensions
 * - Prevents MIME type spoofing attacks
 */
export const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.app',
  '.deb',
  '.rpm',
  '.msi',
  '.scr',
  '.vbs',
  '.js', // JavaScript can be dangerous
  '.jar', // Java archive
  '.py', // Python script
  '.rb', // Ruby script
  '.pl', // Perl script
  '.php', // PHP script
] as const;

/**
 * Maximum File Size: 50MB
 * - Prevents DoS attacks
 * - Reasonable limit for web media
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Filename Validation
 * - No path traversal (../)
 * - No null bytes (\x00)
 * - No control characters
 * - No leading/trailing whitespace
 */
export const filenameSchema = z
  .string()
  .min(1, 'Filename cannot be empty')
  .trim()
  .refine(
    (filename) => !filename.includes('..'),
    'Filename cannot contain directory traversal sequences (..)'
  )
  .refine(
    (filename) => !filename.includes('\x00'),
    'Filename cannot contain null bytes'
  )
  .refine(
    (filename) => !/[\x00-\x1F\x7F]/.test(filename),
    'Filename cannot contain control characters'
  )
  .refine(
    (filename) => !filename.startsWith('/') && !filename.startsWith('\\'),
    'Filename cannot start with path separators'
  );

/**
 * MIME Type Validation
 * - Must be in allowed list
 * - Must NOT be in blocked list
 */
export const mimeTypeSchema = z
  .string()
  .refine(
    (mimeType) => ALLOWED_MIME_TYPES.includes(mimeType as any),
    `MIME type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`
  )
  .refine(
    (mimeType) => !BLOCKED_MIME_TYPES.includes(mimeType as any),
    'Executable and script file types are not allowed for security reasons'
  );

/**
 * File Size Validation
 * - Must be greater than 0 (no empty files)
 * - Must not exceed MAX_FILE_SIZE (50MB)
 */
export const filesizeSchema = z
  .number()
  .positive('File size must be greater than 0')
  .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`);

// ============================================================================
// SECURITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Filename Extension Against MIME Type
 * - Prevents MIME type spoofing attacks
 * - Example: image.png.exe with MIME type image/png should be rejected
 */
export const validateFilenameExtension = (filename: string, mimeType: string): true | string => {
  const lowerFilename = filename.toLowerCase();

  // Check for dangerous extensions
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lowerFilename.endsWith(ext)) {
      return `File extension ${ext} is not allowed for security reasons`;
    }
    // Check for double extensions (e.g., .png.exe)
    if (lowerFilename.includes(ext + '.') || lowerFilename.includes('.' + ext.substring(1))) {
      return `File contains dangerous extension ${ext} in the filename`;
    }
  }

  // Validate extension matches MIME type
  const extensionMap: Record<string, string[]> = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'image/svg+xml': ['.svg'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'application/pdf': ['.pdf'],
  };

  const expectedExtensions = extensionMap[mimeType];
  if (expectedExtensions) {
    const hasValidExtension = expectedExtensions.some((ext) => lowerFilename.endsWith(ext));
    if (!hasValidExtension) {
      return `File extension does not match MIME type ${mimeType}. Expected: ${expectedExtensions.join(' or ')}`;
    }
  }

  return true;
};

/**
 * Sanitize Folder Path
 * - Remove leading/trailing slashes
 * - Remove directory traversal sequences
 * - Convert to lowercase
 */
export const sanitizeFolderPath = (folder: string | undefined): string | undefined => {
  if (!folder) return undefined;

  return folder
    .toLowerCase()
    .replace(/\.\./g, '') // Remove ..
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .replace(/\/+/g, '/'); // Collapse multiple slashes
};

/**
 * Sanitize Filename
 * - Remove null bytes
 * - Remove control characters
 * - Remove path separators
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/^[/\\]+/, '') // Remove leading path separators
    .trim();
};

// ============================================================================
// COMPLETE MEDIA VALIDATION SCHEMA
// ============================================================================

/**
 * Complete Media Object Validation
 * - All fields combined
 * - Runtime type safety
 */
export const mediaSchema = z.object({
  alt: altSchema,
  caption: captionSchema,
  folder: folderSchema,
  focalX: focalXSchema,
  focalY: focalYSchema,
  filename: filenameSchema,
  mimeType: mimeTypeSchema,
  filesize: filesizeSchema,
});

export type MediaValidation = z.infer<typeof mediaSchema>;

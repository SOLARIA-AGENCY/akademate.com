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
/**
 * Alt Text Validation
 * - Required for accessibility (WCAG 2.1)
 * - Minimum 3 characters (meaningful description)
 * - Maximum 500 characters (concise description)
 */
export declare const altSchema: z.ZodString;
/**
 * Caption Validation
 * - Optional extended description
 * - Maximum 1000 characters
 */
export declare const captionSchema: z.ZodOptional<z.ZodString>;
/**
 * Folder Validation
 * - Lowercase alphanumeric with hyphens and slashes
 * - No directory traversal (../)
 * - No leading/trailing slashes
 * - Format: courses/images, blog/2025, campaigns/meta-ads
 */
export declare const folderSchema: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
/**
 * Focal Point X Coordinate Validation
 * - Percentage from left (0 = left edge, 100 = right edge)
 * - Used for smart image cropping
 */
export declare const focalXSchema: z.ZodOptional<z.ZodNumber>;
/**
 * Focal Point Y Coordinate Validation
 * - Percentage from top (0 = top edge, 100 = bottom edge)
 * - Used for smart image cropping
 */
export declare const focalYSchema: z.ZodOptional<z.ZodNumber>;
/**
 * Allowed MIME Types
 * - Images: PNG, JPEG, WebP, GIF, SVG
 * - Videos: MP4, WebM, MOV
 * - Documents: PDF
 * - SECURITY: Executables are REJECTED
 */
export declare const ALLOWED_MIME_TYPES: readonly ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "video/webm", "video/quicktime", "application/pdf"];
/**
 * Blocked MIME Types (Security)
 * - Executables and scripts
 * - Potentially dangerous file types
 */
export declare const BLOCKED_MIME_TYPES: readonly ["application/x-msdownload", "application/x-executable", "application/x-sh", "application/x-bat", "application/x-dll", "application/x-app", "application/x-deb", "application/x-rpm", "application/x-msi", "application/octet-stream"];
/**
 * Dangerous File Extensions
 * - Even if MIME type is safe, reject these extensions
 * - Prevents MIME type spoofing attacks
 */
export declare const DANGEROUS_EXTENSIONS: readonly [".exe", ".dll", ".bat", ".cmd", ".sh", ".bash", ".app", ".deb", ".rpm", ".msi", ".scr", ".vbs", ".js", ".jar", ".py", ".rb", ".pl", ".php"];
/**
 * Maximum File Size: 50MB
 * - Prevents DoS attacks
 * - Reasonable limit for web media
 */
export declare const MAX_FILE_SIZE: number;
/**
 * Filename Validation
 * - No path traversal (../)
 * - No null bytes (\x00)
 * - No control characters
 * - No leading/trailing whitespace
 */
export declare const filenameSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>;
/**
 * MIME Type Validation
 * - Must be in allowed list
 * - Must NOT be in blocked list
 */
export declare const mimeTypeSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * File Size Validation
 * - Must be greater than 0 (no empty files)
 * - Must not exceed MAX_FILE_SIZE (50MB)
 */
export declare const filesizeSchema: z.ZodNumber;
/**
 * Validate Filename Extension Against MIME Type
 * - Prevents MIME type spoofing attacks
 * - Example: image.png.exe with MIME type image/png should be rejected
 */
export declare const validateFilenameExtension: (filename: string, mimeType: string) => true | string;
/**
 * Sanitize Folder Path
 * - Remove leading/trailing slashes
 * - Remove directory traversal sequences
 * - Convert to lowercase
 */
export declare const sanitizeFolderPath: (folder: string | undefined) => string | undefined;
/**
 * Sanitize Filename
 * - Remove null bytes
 * - Remove control characters
 * - Remove path separators
 */
export declare const sanitizeFilename: (filename: string) => string;
/**
 * Complete Media Object Validation
 * - All fields combined
 * - Runtime type safety
 */
export declare const mediaSchema: z.ZodObject<{
    alt: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    folder: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    focalX: z.ZodOptional<z.ZodNumber>;
    focalY: z.ZodOptional<z.ZodNumber>;
    filename: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>;
    mimeType: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    filesize: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    alt: string;
    filename: string;
    filesize: number;
    mimeType: string;
    caption?: string | undefined;
    folder?: string | undefined;
    focalX?: number | undefined;
    focalY?: number | undefined;
}, {
    alt: string;
    filename: string;
    filesize: number;
    mimeType: string;
    caption?: string | undefined;
    folder?: string | undefined;
    focalX?: number | undefined;
    focalY?: number | undefined;
}>;
export type MediaValidation = z.infer<typeof mediaSchema>;
//# sourceMappingURL=Media.validation.d.ts.map
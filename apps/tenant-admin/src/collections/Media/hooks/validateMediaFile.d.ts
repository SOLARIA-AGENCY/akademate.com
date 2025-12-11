import type { CollectionBeforeChangeHook } from 'payload';
/**
 * Hook: Validate Media File (beforeChange)
 *
 * Purpose:
 * - Validate file MIME type (reject executables)
 * - Validate file size (enforce 50MB limit)
 * - Validate filename (prevent path injection, null bytes)
 * - Validate extension matches MIME type (prevent spoofing)
 * - Sanitize filename (remove dangerous characters)
 * - Validate file content matches declared MIME type (magic byte validation)
 * - Sanitize SVG files to prevent XSS/XXE attacks
 *
 * Security Defenses:
 * - Reject executable file types (.exe, .sh, .bat, etc.)
 * - Prevent MIME type spoofing (magic byte validation)
 * - Prevent path traversal attacks (../ in filename)
 * - Prevent null byte injection (\x00 in filename)
 * - Enforce file size limits (prevent DoS)
 * - SVG sanitization (prevent XSS, XXE, SSRF)
 * - Enhanced double extension detection
 *
 * Security Fixes Applied:
 * - FIX #1 (HIGH): SVG XSS/XXE - Sanitize SVG content with DOMPurify
 * - FIX #2 (HIGH): MIME Spoofing - Validate magic bytes with file-type
 * - FIX #3 (MEDIUM): Double Extension - Improved regex detection
 *
 * Execution:
 * - Runs AFTER field validation
 * - Runs BEFORE database write
 * - Throws error if validation fails
 *
 * No PII Logging (SP-004):
 * - Logs only filename, MIME type, file size (metadata only)
 * - NEVER logs file content or buffer data
 */
export declare const validateMediaFile: CollectionBeforeChangeHook;
//# sourceMappingURL=validateMediaFile.d.ts.map
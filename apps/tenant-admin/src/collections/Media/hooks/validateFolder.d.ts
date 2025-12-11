import type { FieldHook } from 'payload';
/**
 * Hook: Validate Folder (beforeChange)
 *
 * Purpose:
 * - Validate folder path format (lowercase, alphanumeric, hyphens, slashes)
 * - Sanitize folder path (remove ../, leading/trailing slashes)
 * - Prevent directory traversal attacks
 * - Organize media files in logical folder structure
 *
 * Security Defenses:
 * - Reject directory traversal sequences (../)
 * - Remove leading/trailing slashes
 * - Enforce lowercase alphanumeric format
 * - Prevent path injection attacks
 *
 * Folder Format Examples:
 * - Valid: courses/images, blog/2025, campaigns/meta-ads
 * - Invalid: ../etc/passwd, /var/www, UPPERCASE, folder with spaces
 *
 * Execution:
 * - Runs AFTER field validation
 * - Runs BEFORE database write
 *
 * No PII Logging (SP-004):
 * - Logs only folder path (non-sensitive metadata)
 * - No user data or file content logged
 */
export declare const validateFolder: FieldHook;
//# sourceMappingURL=validateFolder.d.ts.map
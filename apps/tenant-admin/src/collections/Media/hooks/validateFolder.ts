import type { FieldHook } from 'payload';
import { sanitizeFolderPath } from '../Media.validation';

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
export const validateFolder: FieldHook = ({ value, data, operation }) => {
  // Folder is optional, allow undefined
  if (value === undefined || value === null) {
    return undefined;
  }

  // Must be a string
  if (typeof value !== 'string') {
    throw new Error('Folder must be a string');
  }

  // Empty string is treated as undefined (no folder)
  if (value.trim().length === 0) {
    return undefined;
  }

  const folder = value.trim();

  console.log('[Folder Validation] Validating folder path', {
    folder,
    operation,
  });

  // ============================================================================
  // 1. VALIDATE FOLDER FORMAT
  // ============================================================================

  // 1.1: No directory traversal
  if (folder.includes('..')) {
    throw new Error(
      'Invalid folder path: Directory traversal sequences (..) are not allowed for security reasons'
    );
  }

  // 1.2: No leading or trailing slashes
  if (folder.startsWith('/') || folder.endsWith('/')) {
    throw new Error('Invalid folder path: Cannot start or end with slashes');
  }

  // 1.3: Must be lowercase alphanumeric with hyphens and slashes
  if (!/^[a-z0-9]+([/-][a-z0-9]+)*$/.test(folder)) {
    throw new Error(
      'Invalid folder path: Must be lowercase alphanumeric with hyphens/slashes only (e.g., courses/images)'
    );
  }

  // ============================================================================
  // 2. SANITIZE FOLDER PATH
  // ============================================================================

  const sanitized = sanitizeFolderPath(folder);

  if (sanitized !== folder) {
    console.log('[Folder Validation] Folder path sanitized', {
      original: folder,
      sanitized,
    });
  }

  // ============================================================================
  // VALIDATION PASSED
  // ============================================================================

  console.log('[Folder Validation] Folder validation passed', {
    folder: sanitized,
  });

  return sanitized;
};

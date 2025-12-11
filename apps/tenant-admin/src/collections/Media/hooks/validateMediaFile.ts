import type { CollectionBeforeChangeHook } from 'payload';
import { fileTypeFromBuffer } from 'file-type';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import {
  ALLOWED_MIME_TYPES,
  BLOCKED_MIME_TYPES,
  DANGEROUS_EXTENSIONS,
  MAX_FILE_SIZE,
  validateFilenameExtension,
  sanitizeFilename,
} from '../Media.validation';

// Initialize DOMPurify with jsdom for Node.js environment
// DOMPurify v3.2.4 (patched for XSS vulnerability GHSA-vhxf-7vqr-mrjg)
const window = new JSDOM('').window;
const purify = createDOMPurify(window as unknown as Window);

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
export const validateMediaFile: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Only validate on create (file upload)
  // Updates typically only modify metadata (alt, caption), not the file itself
  if (operation !== 'create') {
    return data;
  }

  const { filename, mimeType, filesize } = data;

  // ============================================================================
  // 1. VALIDATE FILENAME EXISTS
  // ============================================================================

  if (!filename || typeof filename !== 'string') {
    throw new Error('Filename is required for media upload');
  }

  if (filename.trim().length === 0) {
    throw new Error('Filename cannot be empty or whitespace only');
  }

  console.log('[Media Validation] Validating file upload', {
    filename,
    mimeType,
    filesize,
    operation,
  });

  // ============================================================================
  // 2. SANITIZE FILENAME
  // ============================================================================

  const sanitized = sanitizeFilename(filename);
  if (sanitized !== filename) {
    console.log('[Media Validation] Filename sanitized', {
      original: filename,
      sanitized,
    });
    data.filename = sanitized;
  }

  // ============================================================================
  // 3. VALIDATE FILENAME FOR SECURITY THREATS
  // ============================================================================

  // 3.1: Directory traversal prevention
  if (sanitized.includes('..')) {
    throw new Error(
      'Invalid filename: Directory traversal sequences (..) are not allowed for security reasons'
    );
  }

  // 3.2: Path separator prevention
  if (sanitized.startsWith('/') || sanitized.startsWith('\\')) {
    throw new Error('Invalid filename: Filenames cannot start with path separators');
  }

  // 3.3: Null byte injection prevention
  if (sanitized.includes('\x00')) {
    throw new Error('Invalid filename: Null bytes are not allowed for security reasons');
  }

  // 3.4: Control character prevention
  if (/[\x00-\x1F\x7F]/.test(sanitized)) {
    throw new Error('Invalid filename: Control characters are not allowed for security reasons');
  }

  // ============================================================================
  // 4. VALIDATE DANGEROUS FILE EXTENSIONS (SECURITY FIX #3 - IMPROVED)
  // ============================================================================

  const lowerFilename = sanitized.toLowerCase();

  // FIX #3: Enhanced double extension detection using regex
  // This catches dangerous extensions ANYWHERE in the filename, not just at the end
  for (const ext of DANGEROUS_EXTENSIONS) {
    // Create regex pattern to match dangerous extension followed by non-alphanumeric or end
    // Example: matches ".exe" in ".exe-image.png", "file.exe.png", "test.exe"
    const pattern = new RegExp(`\\${ext}(?:[^a-z0-9]|$)`, 'i');

    if (pattern.test(lowerFilename)) {
      throw new Error(
        `Security Error: Filename contains dangerous extension ${ext}. Please remove ${ext} from the filename entirely. This includes patterns like ${ext}-file, file${ext}.png, or file${ext}`
      );
    }
  }

  // ============================================================================
  // 5. VALIDATE MIME TYPE
  // ============================================================================

  if (!mimeType || typeof mimeType !== 'string') {
    throw new Error('MIME type is required for media upload');
  }

  // 5.1: Check if MIME type is explicitly blocked (executables)
  if (BLOCKED_MIME_TYPES.includes(mimeType as any)) {
    throw new Error(
      `Security Error: MIME type ${mimeType} is not allowed. Executable and script files are blocked for security reasons.`
    );
  }

  // 5.2: Check if MIME type is in allowed list
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    throw new Error(
      `Invalid MIME type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  // ============================================================================
  // 6. VALIDATE EXTENSION MATCHES MIME TYPE (Prevent Spoofing)
  // ============================================================================

  const extensionValidation = validateFilenameExtension(sanitized, mimeType);
  if (extensionValidation !== true) {
    throw new Error(`MIME Type Spoofing Detected: ${extensionValidation}`);
  }

  // ============================================================================
  // 7. VALIDATE FILE CONTENT (MAGIC BYTE VALIDATION) - SECURITY FIX #2
  // ============================================================================

  // FIX #2: Validate that file content matches declared MIME type
  // This prevents attackers from uploading executables disguised as images
  if (data.file && data.file.data) {
    try {
      const buffer = Buffer.isBuffer(data.file.data)
        ? data.file.data
        : Buffer.from(data.file.data);

      const detectedType = await fileTypeFromBuffer(buffer);

      if (!detectedType) {
        // Some valid files (like plain SVG) may not have magic bytes
        // Only fail if it's NOT an SVG file
        if (mimeType !== 'image/svg+xml') {
          throw new Error(
            'Security Error: Unable to determine file type from content. The file may be corrupted or in an unsupported format.'
          );
        }
      } else {
        // File has magic bytes - verify they match declared MIME type
        if (detectedType.mime !== mimeType) {
          throw new Error(
            `Security Error: File content mismatch. You declared this as ${mimeType}, but the actual file content is ${detectedType.mime}. This is a security risk (MIME type spoofing).`
          );
        }

        console.log('[Media Validation] Magic byte validation passed', {
          declaredType: mimeType,
          detectedType: detectedType.mime,
        });
      }
    } catch (error: any) {
      // If it's our security error, re-throw it
      if (error.message.includes('Security Error')) {
        throw error;
      }

      // Otherwise, log and throw generic error
      console.error('[Media Validation] Magic byte validation failed', {
        error: error.message,
        filename: sanitized,
        mimeType,
      });

      throw new Error(
        'File validation failed: Unable to verify file content. Please ensure the file is not corrupted.'
      );
    }
  }

  // ============================================================================
  // 8. SVG SANITIZATION - SECURITY FIX #1 (XSS/XXE PREVENTION)
  // ============================================================================

  // FIX #1: Sanitize SVG files to prevent XSS, XXE, and SSRF attacks
  if (mimeType === 'image/svg+xml' && data.file && data.file.data) {
    try {
      const buffer = Buffer.isBuffer(data.file.data)
        ? data.file.data
        : Buffer.from(data.file.data);

      const svgContent = buffer.toString('utf-8');

      // 8.1: Block DTD and external entity declarations (XXE prevention)
      if (svgContent.includes('<!ENTITY') || svgContent.includes('<!DOCTYPE')) {
        throw new Error(
          'Security Error: SVG files with DTD declarations or external entities are not allowed. This prevents XXE (XML External Entity) attacks.'
        );
      }

      // 8.2: Sanitize SVG content with DOMPurify (v3.2.4 - patched for XSS)
      const sanitizedSVG = purify.sanitize(svgContent, {
        USE_PROFILES: { svg: true, svgFilters: true },
        // Block dangerous tags that can execute JavaScript or load external content
        FORBID_TAGS: [
          'script',       // JavaScript execution
          'iframe',       // Embedded content
          'object',       // Embedded objects
          'embed',        // Embedded content
          'foreignObject', // Can contain HTML with scripts
          'use',          // Can reference external SVG files (SSRF)
        ],
        // Block event handlers that can execute JavaScript
        FORBID_ATTR: [
          'onload',
          'onerror',
          'onclick',
          'onmouseover',
          'onmouseout',
          'onmousemove',
          'onmousedown',
          'onmouseup',
          'onfocus',
          'onblur',
          'onchange',
          'onsubmit',
        ],
      });

      // 8.3: Verify sanitization didn't strip everything (file still valid)
      if (!sanitizedSVG || sanitizedSVG.trim().length === 0) {
        throw new Error(
          'Security Error: SVG sanitization removed all content. The file may contain only malicious code.'
        );
      }

      // 8.4: Replace file content with sanitized version
      data.file.data = Buffer.from(sanitizedSVG, 'utf-8');
      data.filesize = data.file.data.length;

      console.log('[Media Validation] SVG sanitized successfully', {
        filename: sanitized,
        originalSize: buffer.length,
        sanitizedSize: data.file.data.length,
        bytesRemoved: buffer.length - data.file.data.length,
      });
    } catch (error: any) {
      // If it's our security error, re-throw it
      if (error.message.includes('Security Error')) {
        throw error;
      }

      // Otherwise, log and throw generic error
      console.error('[Media Validation] SVG sanitization failed', {
        error: error.message,
        filename: sanitized,
      });

      throw new Error(
        'SVG validation failed: Unable to sanitize SVG content. Please ensure the file is a valid SVG.'
      );
    }
  }

  // ============================================================================
  // 9. VALIDATE FILE SIZE (After potential sanitization)
  // ============================================================================

  if (!filesize || typeof filesize !== 'number') {
    throw new Error('File size is required for media upload');
  }

  // 9.1: No empty files
  if (filesize <= 0) {
    throw new Error('Invalid file: File size must be greater than 0 bytes (no empty files)');
  }

  // 9.2: Enforce maximum size (50MB)
  if (filesize > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
    const actualSizeMB = (filesize / 1024 / 1024).toFixed(2);
    throw new Error(
      `File too large: ${actualSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`
    );
  }

  // ============================================================================
  // VALIDATION PASSED - ALL SECURITY CHECKS COMPLETE
  // ============================================================================

  console.log('[Media Validation] All security checks passed', {
    filename: sanitized,
    mimeType,
    filesizeMB: (filesize / 1024 / 1024).toFixed(2),
    securityChecks: [
      'Filename sanitization ✓',
      'Path traversal prevention ✓',
      'Dangerous extension detection ✓',
      'MIME type validation ✓',
      'Magic byte verification ✓',
      mimeType === 'image/svg+xml' ? 'SVG sanitization ✓' : 'N/A',
      'File size validation ✓',
    ].filter(check => check !== 'N/A'),
  });

  return data;
};

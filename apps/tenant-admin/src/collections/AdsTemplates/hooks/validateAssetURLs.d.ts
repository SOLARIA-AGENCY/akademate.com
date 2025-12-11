import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: Validate Asset URLs (beforeValidate)
 *
 * Purpose:
 * - Validate all asset URL fields (cta_url, images, videos)
 * - Ensure URLs are properly formatted (http/https)
 * - Prevent XSS attacks via malformed URLs
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Validation Rules:
 * - All URLs must start with http:// or https://
 * - cta_url: Call-to-action destination URL
 * - primary_image_url: Main creative image
 * - secondary_image_url: Secondary image
 * - video_url: Video asset
 * - thumbnail_url: Video/image thumbnail
 *
 * Security Considerations:
 * - URL validation prevents javascript: and data: URI XSS attacks
 * - Only http/https protocols allowed
 * - No sensitive data in error messages (SP-004)
 *
 * No PII Logging:
 * - Logs only template.id (non-sensitive)
 * - NEVER logs URLs (may contain tracking parameters)
 */
export declare const validateAssetURLs: CollectionBeforeValidateHook;
//# sourceMappingURL=validateAssetURLs.d.ts.map
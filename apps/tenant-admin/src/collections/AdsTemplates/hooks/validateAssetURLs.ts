import type { CollectionBeforeValidateHook } from 'payload';
import { validateURL } from '../AdsTemplates.validation';

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
export const validateAssetURLs: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  // Only validate on create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  // Validate cta_url
  if (data.cta_url) {
    const ctaUrlResult = validateURL(data.cta_url, 'CTA URL');
    if (ctaUrlResult !== true) {
      throw new Error(ctaUrlResult);
    }
  }

  // Validate primary_image_url
  if (data.primary_image_url) {
    const primaryImageResult = validateURL(data.primary_image_url, 'Primary image URL');
    if (primaryImageResult !== true) {
      throw new Error(primaryImageResult);
    }
  }

  // Validate secondary_image_url
  if (data.secondary_image_url) {
    const secondaryImageResult = validateURL(data.secondary_image_url, 'Secondary image URL');
    if (secondaryImageResult !== true) {
      throw new Error(secondaryImageResult);
    }
  }

  // Validate video_url
  if (data.video_url) {
    const videoUrlResult = validateURL(data.video_url, 'Video URL');
    if (videoUrlResult !== true) {
      throw new Error(videoUrlResult);
    }
  }

  // Validate thumbnail_url
  if (data.thumbnail_url) {
    const thumbnailResult = validateURL(data.thumbnail_url, 'Thumbnail URL');
    if (thumbnailResult !== true) {
      throw new Error(thumbnailResult);
    }
  }

  return data;
};

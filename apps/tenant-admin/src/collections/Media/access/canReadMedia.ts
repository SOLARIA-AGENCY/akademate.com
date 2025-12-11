import type { Access } from 'payload';

/**
 * Access Control: Read Media
 *
 * Who can view media files:
 * - Public: YES (public website needs to display images)
 * - Lectura: YES (read-only access to all content)
 * - Asesor: YES (need to view media for leads)
 * - Marketing: YES (need to view media for campaigns)
 * - Gestor: YES (full content management)
 * - Admin: YES (full system access)
 *
 * Business Logic:
 * - Media files are public assets (served on website)
 * - No sensitive PII stored in media metadata
 * - Public access enables CDN caching and performance
 */
export const canReadMedia: Access = () => {
  // Everyone can read media files (including public)
  // This is necessary for serving images on the public website
  return true;
};

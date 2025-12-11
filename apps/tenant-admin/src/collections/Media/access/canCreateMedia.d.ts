import type { Access } from 'payload';
/**
 * Access Control: Create Media
 *
 * Who can upload media files:
 * - Public: NO (unauthenticated users cannot upload)
 * - Lectura: NO (read-only role)
 * - Asesor: YES (can upload for lead follow-up)
 * - Marketing: YES (can upload for campaigns/ads)
 * - Gestor: YES (full content management)
 * - Admin: YES (full system access)
 *
 * Security:
 * - Requires authentication
 * - No public uploads (prevents spam/abuse)
 */
export declare const canCreateMedia: Access;
//# sourceMappingURL=canCreateMedia.d.ts.map
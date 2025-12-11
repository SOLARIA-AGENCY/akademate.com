/**
 * Media Collection - Access Control Functions
 *
 * 6-Tier RBAC Implementation:
 * - Admin: Full CRUD (including delete)
 * - Gestor: Full CRUD (except delete)
 * - Marketing: Create, read all, update own only
 * - Asesor: Create and read (upload but not modify)
 * - Lectura: Read only
 * - Public: Read only (for serving images on website)
 *
 * Security Considerations:
 * - Only Admin can delete (prevents accidental data loss)
 * - Marketing has ownership-based update permissions
 * - Public read access enables CDN caching
 */

export { canCreateMedia } from './canCreateMedia';
export { canReadMedia } from './canReadMedia';
export { canUpdateMedia } from './canUpdateMedia';
export { canDeleteMedia } from './canDeleteMedia';

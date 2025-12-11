import type { Access } from 'payload';
/**
 * Access control for managing Campuses
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 *
 * All other roles: Read-only access
 *
 * Uses role hierarchy for clean permission checks.
 *
 * Use cases:
 * - Admin can create, update, and delete campuses
 * - Gestor can create, update, and delete campuses
 * - Marketing, Asesor, and Lectura roles can only read campuses
 * - Public (unauthenticated) users can read campuses
 */
export declare const canManageCampuses: Access;
//# sourceMappingURL=canManageCampuses.d.ts.map
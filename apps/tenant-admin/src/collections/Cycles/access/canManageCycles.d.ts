import type { Access } from 'payload';
/**
 * Access control for managing Cycles
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 *
 * All other roles: Read-only access
 *
 * Uses role hierarchy for clean permission checks.
 */
export declare const canManageCycles: Access;
//# sourceMappingURL=canManageCycles.d.ts.map
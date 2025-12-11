import type { Access } from 'payload';
/**
 * Access Control: Can Create Users
 *
 * Determines who can create new user records.
 *
 * Rules:
 * - SuperAdmin: Can create ANY user in ANY tenant (including other superadmins)
 * - Admin: Can create any user within their tenant (including other admins, NOT superadmin)
 * - Gestor: Can create non-admin users within their tenant only
 * - Marketing/Asesor/Lectura: Cannot create users
 *
 * Security Notes:
 * - Only SuperAdmin can create other SuperAdmin accounts
 * - Prevents privilege escalation by limiting who can create higher roles
 * - Tenant-aware: Users can only create within their tenant
 *
 * @param req - Payload request object containing authenticated user
 * @param data - User data being created (contains role)
 * @returns Boolean indicating if creation is allowed
 */
export declare const canCreateUsers: Access;
//# sourceMappingURL=canCreateUsers.d.ts.map
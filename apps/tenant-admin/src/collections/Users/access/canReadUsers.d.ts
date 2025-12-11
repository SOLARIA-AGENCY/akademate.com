import type { Access } from 'payload';
/**
 * Access Control: Can Read Users
 *
 * Determines who can read user records.
 *
 * Rules:
 * - SuperAdmin: Can read ALL users across ALL tenants
 * - Admin: Can read all users within their tenant
 * - Gestor: Can read all users within their tenant
 * - Marketing/Asesor/Lectura: Can only read themselves
 *
 * Implementation:
 * - Returns `true` for superadmin (global access)
 * - Returns tenant filter for admin/gestor
 * - Returns query constraint for others (filter to self only)
 *
 * @param req - Payload request object containing authenticated user
 * @returns Boolean true for full access, or query constraint object
 */
export declare const canReadUsers: Access;
//# sourceMappingURL=canReadUsers.d.ts.map
import type { Access } from 'payload';
/**
 * Access Control: Can Delete Users
 *
 * Determines who can delete user records.
 *
 * Rules:
 * - SuperAdmin: Can delete ANY user EXCEPT themselves (across ALL tenants)
 * - Admin: Can delete any user within their tenant EXCEPT themselves and superadmins
 * - All other roles: Cannot delete any users
 *
 * Security Notes:
 * - Prevents users from deleting themselves (could lock themselves out)
 * - Prevents accidental deletion of the last admin (enforced in beforeDelete hook)
 * - Admin cannot delete SuperAdmin users
 * - Only SuperAdmin has cross-tenant delete privileges
 *
 * Implementation:
 * - Checks if user is superadmin or admin
 * - Checks if trying to delete self (denied)
 * - Returns tenant filter for admin
 * - Additional check in beforeDelete hook prevents deleting last admin
 *
 * @param req - Payload request object containing authenticated user
 * @param id - ID of user being deleted
 * @returns Boolean indicating if deletion is allowed, or query constraint
 */
export declare const canDeleteUsers: Access;
//# sourceMappingURL=canDeleteUsers.d.ts.map
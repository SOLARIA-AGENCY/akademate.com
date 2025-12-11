import { Access } from 'payload';
/**
 * Access control for managing Leads
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 * - Asesor: Can view and add notes to leads, but not delete
 *
 * Marketing and Lectura: No direct access to leads (GDPR)
 */
export declare const canManageLeads: Access;
/**
 * Access control for deleting Leads
 *
 * Only Admin and Gestor can delete leads (GDPR compliance)
 */
export declare const canDeleteLeads: Access;
//# sourceMappingURL=canManageLeads.d.ts.map
import type { Access } from 'payload';
/**
 * Access Control: Who can DELETE campaigns
 *
 * Campaign deletion is restricted to supervisors and admins.
 * Marketing users should use status='archived' for soft delete.
 *
 * Allowed Roles:
 * - Gestor: YES ✅ (supervisors can delete campaigns)
 * - Admin: YES ✅ (system admins can delete campaigns)
 *
 * Denied Roles:
 * - Public: NO ❌ (unauthenticated users)
 * - Lectura: NO ❌ (read-only role)
 * - Asesor: NO ❌ (advisors cannot delete campaigns)
 * - Marketing: NO ❌ (use status='archived' instead for soft delete)
 *
 * Rationale:
 * - Hard deletes remove historical data needed for analytics
 * - Marketing users should archive campaigns instead of deleting
 * - Only supervisors/admins delete for data cleanup or compliance
 */
export declare const canDeleteCampaign: Access;
//# sourceMappingURL=canDeleteCampaign.d.ts.map
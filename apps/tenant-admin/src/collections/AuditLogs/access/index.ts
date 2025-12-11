/**
 * AuditLogs Collection - Access Control Functions
 *
 * Centralized export for all audit log access control functions.
 *
 * ACCESS CONTROL SUMMARY:
 *
 * CREATE:
 * - System only (via hooks)
 * - Admin in development mode (testing)
 *
 * READ:
 * - Admin: All logs ✅
 * - Gestor: All logs ✅
 * - Marketing: Own actions only ✅
 * - Asesor: Own actions only ✅
 * - Lectura: NO ACCESS ❌
 * - Public: NO ACCESS ❌
 *
 * UPDATE:
 * - NO ONE ❌ (immutable audit trail)
 *
 * DELETE:
 * - Admin: YES ✅ (GDPR right to erasure)
 * - All others: NO ❌
 */

export { canCreateAuditLog } from './canCreateAuditLog';
export { canReadAuditLogs } from './canReadAuditLogs';
export { canUpdateAuditLog } from './canUpdateAuditLog';
export { canDeleteAuditLog } from './canDeleteAuditLog';

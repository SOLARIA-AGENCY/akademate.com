/**
 * AuditLogs Collection - Hooks
 *
 * Centralized export for all audit log hooks.
 *
 * HOOK EXECUTION ORDER:
 *
 * CREATE Operation:
 * 1. beforeValidate:
 *    - autoPopulateAuditMetadata: Auto-capture IP, user agent, user email/role
 *    - validateAuditLogData: Validate collection name, user existence, sanitize changes
 * 2. (Payload's built-in validation runs)
 * 3. beforeChange:
 *    - preventAuditLogUpdates: Block updates (only on update operations)
 * 4. (Database write)
 * 5. afterChange:
 *    - (Future: createMetaAuditLog for audit log of audit log creation)
 *
 * UPDATE Operation:
 * 1. beforeChange:
 *    - preventAuditLogUpdates: THROW ERROR (blocks all updates)
 * 2. (Operation aborted, never reaches database)
 *
 * DELETE Operation:
 * - Allowed only for Admin role (via access control)
 * - Should create audit log entry for the deletion (future enhancement)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (all fields are immutable)
 * - SP-002: GDPR Critical Fields (ip_address, timestamps are immutable)
 * - SP-004: PII Data Handling (no PII logging in hooks)
 */

export { autoPopulateAuditMetadata } from './autoPopulateAuditMetadata';
export { preventAuditLogUpdates } from './preventAuditLogUpdates';
export { validateAuditLogData } from './validateAuditLogData';

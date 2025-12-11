import { CollectionAfterChangeHook } from 'payload';
/**
 * Creates an audit log entry for GDPR compliance
 *
 * This hook records:
 * - Entity type and ID
 * - Action performed (create, update, delete)
 * - User responsible
 * - Timestamp
 * - IP address (from request)
 * - Before/after snapshots for updates
 *
 * @param operation - The operation type (create, update, delete)
 * @returns Payload hook function
 */
export declare function createAuditLogHook(operation: 'create' | 'update' | 'delete'): CollectionAfterChangeHook;
/**
 * Audit log hook for create operations
 */
export declare const auditCreate: CollectionAfterChangeHook;
/**
 * Audit log hook for update operations
 */
export declare const auditUpdate: CollectionAfterChangeHook;
/**
 * Audit log hook for delete operations
 */
export declare const auditDelete: CollectionAfterChangeHook;
//# sourceMappingURL=auditLog.d.ts.map
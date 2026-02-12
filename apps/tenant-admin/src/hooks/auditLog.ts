import type { CollectionAfterChangeHook } from 'payload';
import { VALID_COLLECTION_NAMES } from '../collections/AuditLogs/schemas';

type ValidCollectionName = (typeof VALID_COLLECTION_NAMES)[number];

/**
 * Audit log data structure for hook creation
 * Note: user_email, user_role, and status are auto-populated by beforeValidate hooks
 */
interface AuditLogHookData {
  action: 'create' | 'update' | 'delete';
  collection_name: ValidCollectionName;
  document_id: string;
  user_id?: number;
  ip_address: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
}

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
export function createAuditLogHook(
  operation: 'create' | 'update' | 'delete'
): CollectionAfterChangeHook {
  return async ({ doc, req, previousDoc, collection }) => {
    try {
      // Get user ID (if authenticated)
      const userId = req.user?.id;

      // Get IP address from request headers
      const xForwardedFor = req.headers?.get?.('x-forwarded-for');
      const ipAddress =
        typeof xForwardedFor === 'string' ? (xForwardedFor.split(',')[0]?.trim() ?? '127.0.0.1') : '127.0.0.1';

      // Validate collection name is in allowed list
      const collectionSlug = collection.slug as ValidCollectionName;
      if (!VALID_COLLECTION_NAMES.includes(collectionSlug)) {
        // Skip audit for collections not in the allowed list
        return doc;
      }

      // Create audit log entry
      // Note: user_email, user_role, and status are auto-populated by beforeValidate hooks
      const auditData: AuditLogHookData = {
        action: operation,
        collection_name: collectionSlug,
        document_id: String(doc.id),
        user_id: userId ?? undefined,
        ip_address: ipAddress,
        changes: operation === 'update' ? { before: previousDoc, after: doc } : undefined,
      };

      await req.payload.create({
        collection: 'audit-logs',
        data: auditData as Record<string, unknown>,
      });
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to create audit log:', error);
    }

    return doc;
  };
}

/**
 * Audit log hook for create operations
 */
export const auditCreate = createAuditLogHook('create');

/**
 * Audit log hook for update operations
 */
export const auditUpdate = createAuditLogHook('update');

/**
 * Audit log hook for delete operations
 */
export const auditDelete = createAuditLogHook('delete');

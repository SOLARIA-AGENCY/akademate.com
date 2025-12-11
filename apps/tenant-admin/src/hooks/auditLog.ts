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
export function createAuditLogHook(operation: 'create' | 'update' | 'delete'): CollectionAfterChangeHook {
  return async ({ doc, req, previousDoc, collection }) => {
    try {
      // Get user ID (if authenticated)
      const userId = req.user?.id;

      // Get IP address from request headers
      const xForwardedFor = req.headers?.get?.('x-forwarded-for');
      const ipAddress = typeof xForwardedFor === 'string'
        ? xForwardedFor.split(',')[0].trim()
        : 'unknown';

      // Create audit log entry
      // Note: user_email, user_role, and status are auto-populated by beforeValidate hooks
      await req.payload.create({
        collection: 'audit-logs',
        data: {
          action: operation,
          collection_name: collection.slug as any,
          document_id: String(doc.id),
          user_id: userId ?? undefined,
          ip_address: ipAddress,
          changes: operation === 'update' ? { before: previousDoc, after: doc } : undefined,
        } as any, // Type assertion: hooks will populate required fields
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

import type { CollectionAfterReadHook } from 'payload';

/**
 * Audit log for lead access (GDPR compliance)
 *
 * Every time a lead record is accessed, we log:
 * - Who accessed it
 * - When it was accessed
 * - From what IP address
 *
 * This is required for GDPR compliance to track access to personal data.
 */
export const auditLeadAccess: CollectionAfterReadHook = async ({ doc, req }) => {
  try {
    // Only log if user is authenticated
    if (!req.user) return doc;

    // Get IP address from request
    const ipAddress =
      (req as any).ip ||
      (req.headers as any)?.['x-forwarded-for'] ||
      (req.headers as any)?.get?.('x-forwarded-for') ||
      'unknown';

    // Create audit log entry
    await req.payload.create({
      collection: 'audit-logs' as any,
      data: {
        entity_type: 'leads',
        entity_id: doc.id,
        action: 'read',
        user_id: req.user.id,
        ip_address: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
        changes: null,
      } as any,
    });
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to audit lead access:', error);
  }

  return doc;
};

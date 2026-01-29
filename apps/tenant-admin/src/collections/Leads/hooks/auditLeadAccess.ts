import type { CollectionAfterReadHook, PayloadRequest } from 'payload';
import type { AuditLog, Lead } from '../../../payload-types';

/**
 * Request headers interface for extracting IP address
 * Supports both standard Headers API (with get method) and plain object access
 */
interface RequestHeaders {
  'x-forwarded-for'?: string | string[];
  'x-real-ip'?: string;
  get?(name: string): string | null;
}

/**
 * Extended request interface for accessing IP information
 */
interface ExtendedRequest {
  ip?: string;
  headers?: RequestHeaders;
}

/**
 * Audit log data for read operations
 * Note: user_email, user_role, and status are auto-populated by beforeValidate hooks
 */
interface AuditLogReadData {
  action: 'read';
  collection_name: 'leads';
  document_id: string;
  user_id: number;
  ip_address: string;
  changes: null;
}

/**
 * Options for creating audit log entries
 */
interface AuditLogCreateOptions {
  collection: 'audit-logs';
  data: Partial<AuditLog>;
}

/**
 * Extracts IP address from request with proper type safety
 *
 * @param req - Payload request object
 * @returns IP address string or 'unknown'
 */
function getIpAddress(req: PayloadRequest): string {
  // Cast to extended request to access potential IP properties
  const extReq = req as unknown as ExtendedRequest;

  // Try direct IP property (Node.js/Express)
  if (extReq.ip) {
    return extReq.ip;
  }

  // Try x-forwarded-for header via get method (standard Headers API)
  if (extReq.headers?.get) {
    const headerValue = extReq.headers.get('x-forwarded-for');
    if (headerValue) {
      return headerValue.split(',')[0]?.trim() ?? 'unknown';
    }
  }

  // Try x-forwarded-for header via object access (plain object headers)
  const forwardedFor = extReq.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
    }
    if (Array.isArray(forwardedFor) && forwardedFor[0]) {
      return forwardedFor[0];
    }
  }

  return 'unknown';
}

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
export const auditLeadAccess: CollectionAfterReadHook<Lead> = async ({ doc, req }) => {
  try {
    // Only log if user is authenticated
    if (!req.user) return doc;

    // Get IP address from request
    const ipAddress = getIpAddress(req);

    // Create audit log entry
    // Note: user_email, user_role, and status are auto-populated by beforeValidate hooks
    const auditData: AuditLogReadData = {
      action: 'read',
      collection_name: 'leads',
      document_id: String(doc.id),
      user_id: req.user.id,
      ip_address: ipAddress,
      changes: null,
    };

    // Type assertion is required because:
    // 1. beforeValidate hooks auto-populate: user_email, user_role, status
    // 2. Payload's strict typing expects all required fields upfront
    const createOptions: AuditLogCreateOptions = {
      collection: 'audit-logs',
      data: auditData as unknown as Partial<AuditLog>,
    };

    await (req.payload.create as (options: AuditLogCreateOptions) => Promise<AuditLog>)(
      createOptions
    );
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to audit lead access:', error);
  }

  return doc;
};

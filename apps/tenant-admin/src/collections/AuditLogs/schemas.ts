import { z } from 'zod';

/**
 * AuditLogs Collection - Validation Schemas
 *
 * This file contains Zod schemas for validating audit log data.
 *
 * KEY VALIDATIONS:
 * - IPv4 and IPv6 address formats
 * - Email RFC 5322 compliance
 * - Collection name must match existing Payload collections
 * - Action type enum validation
 * - Status enum validation
 * - User role enum validation
 *
 * GDPR COMPLIANCE:
 * - Article 30: Records of processing activities
 * - 7-year retention for Spain
 * - Immutable audit trail (no updates)
 */

// ============================================================================
// IP ADDRESS VALIDATION (IPv4 + IPv6)
// ============================================================================

/**
 * IPv4 format: 0-255.0-255.0-255.0-255
 * Examples:
 * - 192.168.1.1 ✅
 * - 148.230.118.124 ✅
 * - 256.0.0.1 ❌ (out of range)
 * - 192.168.1 ❌ (incomplete)
 */
export const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv6 format: 8 groups of 4 hex digits separated by colons
 * Supports compressed notation (::)
 * Examples:
 * - 2a02:4780:28:b773::1 ✅
 * - 2001:0db8:85a3:0000:0000:8a2e:0370:7334 ✅
 * - ::1 ✅ (localhost)
 * - fe80::1 ✅
 */
export const ipv6Regex =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

/**
 * Combined IP address schema (IPv4 or IPv6)
 */
export const ipAddressSchema = z
  .string()
  .refine(
    (val) => ipv4Regex.test(val) || ipv6Regex.test(val),
    'IP address must be valid IPv4 or IPv6 format'
  );

// ============================================================================
// EMAIL VALIDATION - RFC 5322
// ============================================================================

/**
 * Email validation using Zod's built-in email validator (RFC 5322)
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be 255 characters or less');

// ============================================================================
// COLLECTION NAME VALIDATION
// ============================================================================

/**
 * Valid Payload CMS collection slugs
 * IMPORTANT: Keep this synchronized with actual collections in the system
 */
export const VALID_COLLECTION_NAMES = [
  'users',
  'cycles',
  'campuses',
  'courses',
  'course-runs',
  'leads',
  'enrollments',
  'students',
  'campaigns',
  'ads-templates',
  'blog-posts',
  'faqs',
  'media',
  'audit-logs', // Self-referential for meta-auditing
] as const;

export const collectionNameSchema = z.enum(VALID_COLLECTION_NAMES, {
  errorMap: () => ({ message: 'Invalid collection name' }),
});

// ============================================================================
// ACTION TYPE VALIDATION
// ============================================================================

/**
 * Audit action types covering CRUD + security events
 */
export const VALID_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'login',
  'logout',
  'permission_change',
] as const;

export const actionSchema = z.enum(VALID_ACTIONS, {
  errorMap: () => ({ message: 'Invalid action type' }),
});

// ============================================================================
// USER ROLE VALIDATION
// ============================================================================

/**
 * Valid user roles in the system
 * Must match Users collection role enum
 */
export const VALID_USER_ROLES = ['admin', 'gestor', 'marketing', 'asesor', 'lectura'] as const;

export const userRoleSchema = z.enum(VALID_USER_ROLES, {
  errorMap: () => ({ message: 'Invalid user role' }),
});

// ============================================================================
// STATUS VALIDATION
// ============================================================================

/**
 * Audit log status enum
 */
export const VALID_STATUSES = ['success', 'failure', 'blocked'] as const;

export const statusSchema = z.enum(VALID_STATUSES, {
  errorMap: () => ({ message: 'Invalid status value' }),
});

// ============================================================================
// UUID VALIDATION (for relationships)
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

// ============================================================================
// CHANGES OBJECT VALIDATION
// ============================================================================

/**
 * Changes object structure for update operations
 * Contains before/after snapshots (without PII)
 */
export const changesSchema = z
  .object({
    before: z.record(z.unknown()).optional(),
    after: z.record(z.unknown()).optional(),
  })
  .optional();

// ============================================================================
// METADATA OBJECT VALIDATION
// ============================================================================

/**
 * Metadata object for additional context
 * Can contain request headers, query params, etc.
 */
export const metadataSchema = z.record(z.unknown()).optional();

// ============================================================================
// MAIN AUDIT LOG SCHEMA
// ============================================================================

/**
 * Complete Audit Log validation schema
 *
 * REQUIRED FIELDS:
 * - action: CRUD operation or security event
 * - collection_name: Target collection slug
 * - user_id: Who performed the action
 * - user_email: Snapshot of user email
 * - user_role: User role at time of action
 * - ip_address: Client IP address (IPv4 or IPv6)
 * - status: Operation outcome (success/failure/blocked)
 *
 * OPTIONAL FIELDS:
 * - document_id: ID of affected document (null for bulk operations)
 * - user_agent: Browser/client information
 * - changes: Before/after snapshots for updates
 * - metadata: Additional context (headers, query params)
 * - error_message: Error details if status = failure
 */
export const AuditLogSchema = z.object({
  // ============================================================================
  // REQUIRED FIELDS
  // ============================================================================

  action: actionSchema,

  collection_name: collectionNameSchema,

  user_id: uuidSchema, // Relationship to users collection

  user_email: emailSchema, // Snapshot for deleted users

  user_role: userRoleSchema,

  ip_address: ipAddressSchema, // IPv4 or IPv6

  status: statusSchema,

  // ============================================================================
  // OPTIONAL FIELDS
  // ============================================================================

  document_id: z.string().optional(), // Can be UUID or other ID format

  user_agent: z.string().max(1000).optional(), // Browser/client info

  changes: changesSchema,

  metadata: metadataSchema,

  error_message: z.string().max(2000).optional(), // Error details
});

/**
 * Type inference from schema
 */
export type AuditLogInput = z.infer<typeof AuditLogSchema>;

/**
 * Validation helper function
 *
 * @param data - Raw data to validate
 * @returns Validated audit log data
 * @throws ZodError if validation fails
 */
export const validateAuditLogData = (data: unknown): AuditLogInput => {
  return AuditLogSchema.parse(data);
};

/**
 * Safe validation helper (returns result object)
 *
 * @param data - Raw data to validate
 * @returns { success: boolean, data?: AuditLogInput, error?: ZodError }
 */
export const safeValidateAuditLogData = (data: unknown) => {
  return AuditLogSchema.safeParse(data);
};

/**
 * Partial schema for updates (SHOULD NEVER BE USED - audit logs are immutable)
 * This schema will always throw an error to enforce immutability
 */
export const AuditLogUpdateSchema = z.never({
  errorMap: () => ({
    message: 'Audit logs are immutable and cannot be updated. This is a GDPR compliance requirement.',
  }),
});

export type AuditLogUpdateInput = z.infer<typeof AuditLogUpdateSchema>;

/**
 * Format validation errors for API responses
 *
 * @param error - Zod error object
 * @returns Formatted error array for Payload CMS
 */
export const formatValidationErrors = (error: z.ZodError) => {
  return error.errors.map((err) => ({
    message: err.message,
    field: err.path.join('.'),
  }));
};

/**
 * Sanitize changes object to remove PII before logging
 * Removes sensitive fields like passwords, emails, phone numbers
 *
 * @param changes - Raw changes object
 * @returns Sanitized changes object without PII
 */
export const sanitizeChanges = (changes: { before?: any; after?: any }) => {
  const sensitiveFields = [
    'password',
    'hash',
    'salt',
    'token',
    'secret',
    'api_key',
    'consent_ip_address', // PII
    'consent_timestamp', // Sensitive audit data
  ];

  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = { ...obj };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  };

  return {
    before: sanitize(changes.before),
    after: sanitize(changes.after),
  };
};

/**
 * Extract IP address from request headers
 * Handles proxied requests (X-Forwarded-For)
 *
 * @param req - Payload request object
 * @returns IP address string or undefined
 */
export const extractIPAddress = (req: any): string | undefined => {
  if (!req) return undefined;

  // Try X-Forwarded-For header first (if behind proxy/load balancer)
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can be comma-separated list, take first IP
    const ips = Array.isArray(forwardedFor) ? forwardedFor : forwardedFor.split(',');
    const ip = ips[0].trim();

    // Validate IP format before returning
    if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
      return ip;
    }
  }

  // Try X-Real-IP header (alternative proxy header)
  const realIP = req.headers?.['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    if (ipv4Regex.test(realIP) || ipv6Regex.test(realIP)) {
      return realIP;
    }
  }

  // Fallback to req.ip (direct connection)
  if (req.ip) {
    // req.ip might have IPv6 prefix like ::ffff:192.168.1.1
    const cleanIP = req.ip.replace(/^::ffff:/, '');
    if (ipv4Regex.test(cleanIP) || ipv6Regex.test(cleanIP)) {
      return cleanIP;
    }
  }

  // Fallback to req.socket.remoteAddress
  if (req.socket?.remoteAddress) {
    const cleanIP = req.socket.remoteAddress.replace(/^::ffff:/, '');
    if (ipv4Regex.test(cleanIP) || ipv6Regex.test(cleanIP)) {
      return cleanIP;
    }
  }

  // Last resort: use localhost for development
  return '127.0.0.1';
};

/**
 * Extract user agent from request headers
 *
 * @param req - Payload request object
 * @returns User agent string or undefined
 */
export const extractUserAgent = (req: any): string | undefined => {
  if (!req?.headers) return undefined;
  const userAgent = req.headers['user-agent'];
  return typeof userAgent === 'string' ? userAgent.slice(0, 1000) : undefined; // Limit length
};

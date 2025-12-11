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
/**
 * IPv4 format: 0-255.0-255.0-255.0-255
 * Examples:
 * - 192.168.1.1 ✅
 * - 148.230.118.124 ✅
 * - 256.0.0.1 ❌ (out of range)
 * - 192.168.1 ❌ (incomplete)
 */
export declare const ipv4Regex: RegExp;
/**
 * IPv6 format: 8 groups of 4 hex digits separated by colons
 * Supports compressed notation (::)
 * Examples:
 * - 2a02:4780:28:b773::1 ✅
 * - 2001:0db8:85a3:0000:0000:8a2e:0370:7334 ✅
 * - ::1 ✅ (localhost)
 * - fe80::1 ✅
 */
export declare const ipv6Regex: RegExp;
/**
 * Combined IP address schema (IPv4 or IPv6)
 */
export declare const ipAddressSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Email validation using Zod's built-in email validator (RFC 5322)
 */
export declare const emailSchema: z.ZodString;
/**
 * Valid Payload CMS collection slugs
 * IMPORTANT: Keep this synchronized with actual collections in the system
 */
export declare const VALID_COLLECTION_NAMES: readonly ["users", "cycles", "campuses", "courses", "course-runs", "leads", "enrollments", "students", "campaigns", "ads-templates", "blog-posts", "faqs", "media", "audit-logs"];
export declare const collectionNameSchema: z.ZodEnum<["users", "cycles", "campuses", "courses", "course-runs", "leads", "enrollments", "students", "campaigns", "ads-templates", "blog-posts", "faqs", "media", "audit-logs"]>;
/**
 * Audit action types covering CRUD + security events
 */
export declare const VALID_ACTIONS: readonly ["create", "read", "update", "delete", "export", "login", "logout", "permission_change"];
export declare const actionSchema: z.ZodEnum<["create", "read", "update", "delete", "export", "login", "logout", "permission_change"]>;
/**
 * Valid user roles in the system
 * Must match Users collection role enum
 */
export declare const VALID_USER_ROLES: readonly ["admin", "gestor", "marketing", "asesor", "lectura"];
export declare const userRoleSchema: z.ZodEnum<["admin", "gestor", "marketing", "asesor", "lectura"]>;
/**
 * Audit log status enum
 */
export declare const VALID_STATUSES: readonly ["success", "failure", "blocked"];
export declare const statusSchema: z.ZodEnum<["success", "failure", "blocked"]>;
export declare const uuidSchema: z.ZodString;
/**
 * Changes object structure for update operations
 * Contains before/after snapshots (without PII)
 */
export declare const changesSchema: z.ZodOptional<z.ZodObject<{
    before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    after?: Record<string, unknown> | undefined;
    before?: Record<string, unknown> | undefined;
}, {
    after?: Record<string, unknown> | undefined;
    before?: Record<string, unknown> | undefined;
}>>;
/**
 * Metadata object for additional context
 * Can contain request headers, query params, etc.
 */
export declare const metadataSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
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
export declare const AuditLogSchema: z.ZodObject<{
    action: z.ZodEnum<["create", "read", "update", "delete", "export", "login", "logout", "permission_change"]>;
    collection_name: z.ZodEnum<["users", "cycles", "campuses", "courses", "course-runs", "leads", "enrollments", "students", "campaigns", "ads-templates", "blog-posts", "faqs", "media", "audit-logs"]>;
    user_id: z.ZodString;
    user_email: z.ZodString;
    user_role: z.ZodEnum<["admin", "gestor", "marketing", "asesor", "lectura"]>;
    ip_address: z.ZodEffects<z.ZodString, string, string>;
    status: z.ZodEnum<["success", "failure", "blocked"]>;
    document_id: z.ZodOptional<z.ZodString>;
    user_agent: z.ZodOptional<z.ZodString>;
    changes: z.ZodOptional<z.ZodObject<{
        before: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        after: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        after?: Record<string, unknown> | undefined;
        before?: Record<string, unknown> | undefined;
    }, {
        after?: Record<string, unknown> | undefined;
        before?: Record<string, unknown> | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error_message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "success" | "failure" | "blocked";
    action: "export" | "read" | "delete" | "logout" | "create" | "login" | "update" | "permission_change";
    collection_name: "media" | "courses" | "course-runs" | "faqs" | "campaigns" | "leads" | "enrollments" | "campuses" | "users" | "cycles" | "students" | "audit-logs" | "ads-templates" | "blog-posts";
    user_id: string;
    user_email: string;
    user_role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
    ip_address: string;
    metadata?: Record<string, unknown> | undefined;
    document_id?: string | undefined;
    user_agent?: string | undefined;
    changes?: {
        after?: Record<string, unknown> | undefined;
        before?: Record<string, unknown> | undefined;
    } | undefined;
    error_message?: string | undefined;
}, {
    status: "success" | "failure" | "blocked";
    action: "export" | "read" | "delete" | "logout" | "create" | "login" | "update" | "permission_change";
    collection_name: "media" | "courses" | "course-runs" | "faqs" | "campaigns" | "leads" | "enrollments" | "campuses" | "users" | "cycles" | "students" | "audit-logs" | "ads-templates" | "blog-posts";
    user_id: string;
    user_email: string;
    user_role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
    ip_address: string;
    metadata?: Record<string, unknown> | undefined;
    document_id?: string | undefined;
    user_agent?: string | undefined;
    changes?: {
        after?: Record<string, unknown> | undefined;
        before?: Record<string, unknown> | undefined;
    } | undefined;
    error_message?: string | undefined;
}>;
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
export declare const validateAuditLogData: (data: unknown) => AuditLogInput;
/**
 * Safe validation helper (returns result object)
 *
 * @param data - Raw data to validate
 * @returns { success: boolean, data?: AuditLogInput, error?: ZodError }
 */
export declare const safeValidateAuditLogData: (data: unknown) => z.SafeParseReturnType<{
    status: "success" | "failure" | "blocked";
    action: "export" | "read" | "delete" | "logout" | "create" | "login" | "update" | "permission_change";
    collection_name: "media" | "courses" | "course-runs" | "faqs" | "campaigns" | "leads" | "enrollments" | "campuses" | "users" | "cycles" | "students" | "audit-logs" | "ads-templates" | "blog-posts";
    user_id: string;
    user_email: string;
    user_role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
    ip_address: string;
    metadata?: Record<string, unknown> | undefined;
    document_id?: string | undefined;
    user_agent?: string | undefined;
    changes?: {
        after?: Record<string, unknown> | undefined;
        before?: Record<string, unknown> | undefined;
    } | undefined;
    error_message?: string | undefined;
}, {
    status: "success" | "failure" | "blocked";
    action: "export" | "read" | "delete" | "logout" | "create" | "login" | "update" | "permission_change";
    collection_name: "media" | "courses" | "course-runs" | "faqs" | "campaigns" | "leads" | "enrollments" | "campuses" | "users" | "cycles" | "students" | "audit-logs" | "ads-templates" | "blog-posts";
    user_id: string;
    user_email: string;
    user_role: "admin" | "gestor" | "marketing" | "asesor" | "lectura";
    ip_address: string;
    metadata?: Record<string, unknown> | undefined;
    document_id?: string | undefined;
    user_agent?: string | undefined;
    changes?: {
        after?: Record<string, unknown> | undefined;
        before?: Record<string, unknown> | undefined;
    } | undefined;
    error_message?: string | undefined;
}>;
/**
 * Partial schema for updates (SHOULD NEVER BE USED - audit logs are immutable)
 * This schema will always throw an error to enforce immutability
 */
export declare const AuditLogUpdateSchema: z.ZodNever;
export type AuditLogUpdateInput = z.infer<typeof AuditLogUpdateSchema>;
/**
 * Format validation errors for API responses
 *
 * @param error - Zod error object
 * @returns Formatted error array for Payload CMS
 */
export declare const formatValidationErrors: (error: z.ZodError) => {
    message: string;
    field: string;
}[];
/**
 * Sanitize changes object to remove PII before logging
 * Removes sensitive fields like passwords, emails, phone numbers
 *
 * @param changes - Raw changes object
 * @returns Sanitized changes object without PII
 */
export declare const sanitizeChanges: (changes: {
    before?: any;
    after?: any;
}) => {
    before: any;
    after: any;
};
/**
 * Extract IP address from request headers
 * Handles proxied requests (X-Forwarded-For)
 *
 * @param req - Payload request object
 * @returns IP address string or undefined
 */
export declare const extractIPAddress: (req: any) => string | undefined;
/**
 * Extract user agent from request headers
 *
 * @param req - Payload request object
 * @returns User agent string or undefined
 */
export declare const extractUserAgent: (req: any) => string | undefined;
//# sourceMappingURL=schemas.d.ts.map
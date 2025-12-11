import type { CollectionConfig } from 'payload';
/**
 * AuditLogs Collection - GDPR Compliance & Security Audit Trail
 *
 * This collection implements a comprehensive, immutable audit trail for GDPR Article 30 compliance.
 *
 * Database: PostgreSQL table 'audit_logs' (/infra/postgres/migrations/014_create_audit_logs.sql)
 *
 * ============================================================================
 * CRITICAL COMPLIANCE NOTICE
 * ============================================================================
 *
 * This collection is REQUIRED for GDPR Article 30 compliance:
 * "Records of processing activities"
 *
 * LEGAL REQUIREMENTS:
 * - Organizations must maintain comprehensive audit trails
 * - Must record: who, what, when, where for all data operations
 * - Audit logs must be immutable (tamper-proof)
 * - Retention period: 7 years (Spain)
 * - Must support right to erasure (Article 17)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (ALL fields are immutable after creation)
 * - SP-002: GDPR Critical Fields (ip_address, timestamps, user data)
 * - SP-004: PII Data Handling (NO PII logging in hooks, field-level access control)
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (5-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌ (System only)
 * - READ: NO ❌ (Contains PII)
 * - UPDATE: NO ❌ (Immutable)
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: NO ❌ (Privacy protection)
 * - UPDATE: NO ❌ (Immutable)
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌ (System only)
 * - READ: Own actions only ✅
 * - UPDATE: NO ❌ (Immutable)
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: NO ❌ (System only)
 * - READ: Own actions only ✅
 * - UPDATE: NO ❌ (Immutable)
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: NO ❌ (System only)
 * - READ: All logs ✅ (Audit capability)
 * - UPDATE: NO ❌ (Immutable)
 * - DELETE: NO ❌
 *
 * Admin Role:
 * - CREATE: YES ✅ (Development mode only, for testing)
 * - READ: All logs ✅
 * - UPDATE: NO ❌ (Immutable - not even Admin can update)
 * - DELETE: YES ✅ (GDPR right to erasure, 7+ year old logs)
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Comprehensive Audit Trail:
 * - Records all CRUD operations across collections
 * - Captures security events (login, logout, permission changes)
 * - Before/after snapshots for update operations
 * - Success/failure/blocked status tracking
 *
 * GDPR Compliance:
 * - Article 30: Records of processing activities
 * - Article 17: Right to erasure support (Admin can delete)
 * - Immutable audit trail (no updates allowed)
 * - 7-year retention period (Spain)
 * - PII protection (IP addresses, emails have access control)
 *
 * Security Features:
 * - Immutable entries (defense in depth: UI + API + Hook + Database)
 * - IP address tracking for forensics
 * - User agent logging for device identification
 * - Field-level access control for PII
 * - Meta-auditing (audit logs create audit logs)
 *
 * Performance Optimization:
 * - Strategic indexes on: user_id, collection_name, action, ip_address, created_at
 * - Efficient queries for compliance reports
 * - Scalable for millions of log entries
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS (CRITICAL)
 * ============================================================================
 *
 * Immutability (SP-001: Defense in Depth):
 * ALL fields are immutable after creation:
 * - Layer 1 (UX): admin.readOnly = true
 * - Layer 2 (API Security): access.update = false (collection + field level)
 * - Layer 3 (Business Logic): preventAuditLogUpdates hook throws error
 * - Layer 4 (Database): CHECK constraints and triggers (future enhancement)
 *
 * GDPR Critical Fields (SP-002):
 * - ip_address: PII, immutable, only Admin/Gestor can read
 * - user_email: Snapshot for deleted users, immutable
 * - user_role: Snapshot at time of action, immutable
 * - created_at: Auto-generated timestamp, immutable
 *
 * PII Protection (SP-004):
 * - NO logging of PII in hooks (emails, IPs, names)
 * - Field-level access control on ip_address (Admin/Gestor only)
 * - Changes object sanitized (passwords removed)
 * - Only log non-PII identifiers (IDs, booleans)
 *
 * ============================================================================
 * FIELD-LEVEL ACCESS CONTROL SUMMARY
 * ============================================================================
 *
 * ip_address:
 * - Read: Admin, Gestor only ✅
 * - Update: NO ONE ❌ (immutable)
 *
 * user_email:
 * - Read: Admin, Gestor only ✅
 * - Update: NO ONE ❌ (immutable)
 *
 * changes, metadata:
 * - Read: Admin, Gestor only ✅ (may contain sensitive data)
 * - Update: NO ONE ❌ (immutable)
 *
 * ALL OTHER FIELDS:
 * - Read: Based on collection-level access control
 * - Update: NO ONE ❌ (all fields are immutable)
 *
 * ============================================================================
 * INTEGRATION WITH OTHER COLLECTIONS
 * ============================================================================
 *
 * Other collections should create audit log entries via afterChange hooks:
 *
 * Example integration:
 * ```typescript
 * export const auditStudentChanges: CollectionAfterChangeHook = async ({
 *   doc, req, operation, previousDoc
 * }) => {
 *   await req.payload.create({
 *     collection: 'audit-logs',
 *     data: {
 *       action: operation,
 *       collection_name: 'students',
 *       document_id: doc.id,
 *       user_id: req.user.id,
 *       changes: operation === 'update' ? { before: previousDoc, after: doc } : null,
 *       status: 'success',
 *     },
 *   });
 * };
 * ```
 *
 * NOTE: Do NOT implement integration hooks yet - this is Phase 2
 */
export declare const AuditLogs: CollectionConfig;
//# sourceMappingURL=AuditLogs.d.ts.map
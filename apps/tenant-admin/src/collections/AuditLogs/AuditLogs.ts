import type { CollectionConfig } from 'payload';
import {
  canCreateAuditLog,
  canReadAuditLogs,
  canUpdateAuditLog,
  canDeleteAuditLog,
} from './access';
import {
  autoPopulateAuditMetadata,
  preventAuditLogUpdates,
  validateAuditLogData,
} from './hooks';
import {
  VALID_ACTIONS,
  VALID_COLLECTION_NAMES,
  VALID_USER_ROLES,
  VALID_STATUSES,
} from './schemas';

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
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',

  labels: {
    singular: 'Audit Log',
    plural: 'Audit Logs',
  },

  admin: {
    useAsTitle: 'id', // Use ID since no human-readable title field
    defaultColumns: ['action', 'collection_name', 'user_email', 'status', 'createdAt'],
    group: 'System',
    description:
      'Immutable audit trail for GDPR Article 30 compliance. Logs all system operations.',
    // Hide from main nav for non-admin users (reduce clutter)
    hidden: ({ user }) => {
      return !user || !['admin', 'gestor'].includes(user.role);
    },
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateAuditLog, // System only (Admin in dev mode)
    read: canReadAuditLogs, // Admin, Gestor (all), Asesor/Marketing (own), Lectura (no)
    update: canUpdateAuditLog, // NO ONE (immutable)
    delete: canDeleteAuditLog, // Admin only (GDPR right to erasure)
  },

  fields: [
    // ============================================================================
    // ACTION TYPE (REQUIRED, INDEXED)
    // ============================================================================

    {
      name: 'action',
      type: 'select',
      required: true,
      index: true, // For filtering by action type
      options: VALID_ACTIONS.map((action) => ({
        label: action
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: action,
      })),
      admin: {
        description: 'CRUD operation or security event',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
      },
      access: {
        read: () => true, // All authenticated users can read
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    // ============================================================================
    // COLLECTION NAME (REQUIRED, INDEXED)
    // ============================================================================

    {
      name: 'collection_name',
      type: 'select',
      required: true,
      index: true, // For filtering by collection
      options: VALID_COLLECTION_NAMES.map((collection) => ({
        label: collection
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: collection,
      })),
      admin: {
        description: 'Target Payload collection slug',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    // ============================================================================
    // DOCUMENT ID (OPTIONAL, INDEXED)
    // ============================================================================

    {
      name: 'document_id',
      type: 'text',
      index: true, // For looking up logs for specific document
      maxLength: 255,
      admin: {
        description: 'ID of affected document (null for bulk operations)',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    // ============================================================================
    // USER INFORMATION (REQUIRED, INDEXED)
    // ============================================================================

    {
      name: 'user_id',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true, // For filtering by user
      admin: {
        description: 'User who performed the action',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
        position: 'sidebar',
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    {
      name: 'user_email',
      type: 'email',
      required: true,
      index: true, // For compliance reports by user
      admin: {
        description:
          'Snapshot of user email (preserved if user is deleted) - IMMUTABLE',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
        position: 'sidebar',
      },
      // SECURITY Layer 2 (API): Field-level access control
      // Email is PII - only Admin and Gestor can read
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
        update: () => false, // Immutable
      },
    },

    {
      name: 'user_role',
      type: 'select',
      required: true,
      options: VALID_USER_ROLES.map((role) => ({
        label: role.charAt(0).toUpperCase() + role.slice(1),
        value: role,
      })),
      admin: {
        description: 'User role at time of action (snapshot) - IMMUTABLE',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
        position: 'sidebar',
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    // ============================================================================
    // REQUEST METADATA (REQUIRED FOR GDPR)
    // ============================================================================

    {
      name: 'ip_address',
      type: 'text',
      required: true,
      index: true, // For security investigations
      maxLength: 45, // IPv6 max length
      admin: {
        description:
          'Client IP address (IPv4 or IPv6) - PII, IMMUTABLE, Admin/Gestor only',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
        position: 'sidebar',
      },
      // SECURITY Layer 2 (API): Field-level access control
      // IP address is PII - only Admin and Gestor can read
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
        update: () => false, // CRITICAL: Immutable for forensics
      },
    },

    {
      name: 'user_agent',
      type: 'textarea',
      maxLength: 1000,
      admin: {
        description: 'Browser/client information - IMMUTABLE',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
        position: 'sidebar',
      },
      access: {
        read: () => true, // Not PII, useful for troubleshooting
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    // ============================================================================
    // OPERATION DETAILS (OPTIONAL)
    // ============================================================================

    {
      name: 'changes',
      type: 'json',
      admin: {
        description:
          'Before/after snapshots for updates (sanitized, no passwords) - IMMUTABLE',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
      },
      // SECURITY Layer 2 (API): Field-level access control
      // Changes may contain sensitive data - only Admin and Gestor
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
        update: () => false, // Immutable
      },
    },

    {
      name: 'metadata',
      type: 'json',
      admin: {
        description:
          'Additional context (headers, query params, custom data) - IMMUTABLE',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
      },
      // SECURITY Layer 2 (API): Field-level access control
      // Metadata may contain sensitive data - only Admin and Gestor
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
        update: () => false, // Immutable
      },
    },

    // ============================================================================
    // OPERATION STATUS (REQUIRED)
    // ============================================================================

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'success',
      options: VALID_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      admin: {
        description: 'Operation outcome (success/failure/blocked)',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },

    {
      name: 'error_message',
      type: 'textarea',
      maxLength: 2000,
      admin: {
        description: 'Error details if status = failure (no PII) - IMMUTABLE',
        readOnly: true, // SECURITY Layer 1 (UX): Immutable
        condition: (data) => data?.status === 'failure', // Only show if failure
      },
      access: {
        read: () => true,
        update: () => false, // SECURITY Layer 2 (API): Immutable
      },
    },
  ],

  /**
   * Hooks - Business logic and validation
   */
  hooks: {
    /**
     * Before Validate: Run before Payload's built-in validation
     * Order matters: Execute in sequence
     */
    beforeValidate: [
      autoPopulateAuditMetadata, // 1. Auto-capture IP, user agent, user email/role
      validateAuditLogData, // 2. Validate collection name, user existence, sanitize changes
    ],

    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      preventAuditLogUpdates, // 3. Block ALL update operations (immutability enforcement)
    ],

    /**
     * After Change: Run after database write
     * Future enhancement: Create meta-audit log (audit log of audit log creation)
     */
    // afterChange: [
    //   createMetaAuditLog, // TODO: Implement in Phase 2
    // ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   * Note: updatedAt should never change since updates are blocked
   */
  timestamps: true,
};

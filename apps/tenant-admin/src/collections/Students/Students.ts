import type { CollectionConfig } from 'payload';
import {
  canCreateStudent,
  canReadStudents,
  canUpdateStudent,
  canDeleteStudent,
} from './access';
import {
  captureStudentConsentMetadata,
  validateStudentData,
  validateStudentRelationships,
  trackStudentCreator,
} from './hooks';
import { VALID_STUDENT_STATUSES, VALID_GENDERS, VALID_RELATIONSHIPS } from './Students.validation';

/**
 * Students Collection - Learner Profile Management
 *
 * This collection manages complete student/learner profiles with maximum PII sensitivity.
 *
 * Database: PostgreSQL table 'students' (/infra/postgres/migrations/008_create_students.sql)
 *
 * ============================================================================
 * CRITICAL SECURITY NOTICE
 * ============================================================================
 *
 * This is the MOST PII-SENSITIVE collection in the system with 15+ PII fields:
 * - Personal: first_name, last_name, email, phone, dni, date_of_birth, gender
 * - Contact: address, city, postal_code, country
 * - Emergency: emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
 * - Audit: consent_ip_address
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (created_by)
 * - SP-002: GDPR Critical Fields (gdpr_consent, privacy_policy_accepted, consent_timestamp, consent_ip_address)
 * - SP-004: PII Data Handling (NO logging, field-level access control)
 *
 * ALL PII FIELDS HAVE FIELD-LEVEL ACCESS CONTROL
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌ (Students created via enrollment process, not public forms)
 * - READ: NO ❌ (PII protection)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: Limited fields only (NO PII: email, phone, DNI, address, emergency contact) ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: YES ✅
 * - READ: All fields ✅
 * - UPDATE: Limited (notes, status) ✅
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: Most fields (NO sensitive PII: DNI, emergency contact) ✅
 * - UPDATE: Very limited (notes only) ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All fields ✅
 * - UPDATE: All fields (except immutable) ✅
 * - DELETE: YES (GDPR right to be forgotten) ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All fields ✅
 * - UPDATE: All fields (except immutable) ✅
 * - DELETE: YES (GDPR right to be forgotten) ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Student Profile Management:
 * - Complete personal information with PII
 * - Spanish-specific validations (DNI format)
 * - Emergency contact information
 * - Status tracking (active, inactive, suspended, graduated)
 *
 * GDPR Compliance:
 * - Mandatory consent enforcement (CHECK constraints)
 * - Immutable consent metadata (timestamp, IP address)
 * - Right to be forgotten (Admin/Gestor delete)
 * - Field-level access control for PII
 *
 * Data Validation:
 * - Email: RFC 5322 compliance
 * - Phone: Spanish format (+34 XXX XXX XXX)
 * - DNI: 8 digits + checksum letter
 * - Age: Must be >= 16 years old
 * - Emergency contact: Same validations as primary contact
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS (CRITICAL)
 * ============================================================================
 *
 * Immutable Fields (SP-001: Defense in Depth):
 * - created_by: Auto-populated on create, immutable after creation
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Hook enforces immutability
 *
 * GDPR Critical Fields (SP-002: Immutable Consent):
 * - gdpr_consent: Must be true, immutable after creation
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Database): CHECK constraint
 *
 * - privacy_policy_accepted: Must be true, immutable
 *   - Same 3-layer defense
 *
 * - consent_timestamp: Auto-captured, immutable
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *
 * - consent_ip_address: Auto-captured, immutable
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *
 * PII Protection (SP-004):
 * - NO logging of PII in ANY hook
 * - Field-level access control on ALL PII fields
 * - Public NEVER has access to student data
 * - Lectura cannot read: email, phone, dni, address, emergency contacts
 * - Marketing cannot read: dni, emergency contacts
 *
 * ============================================================================
 * FIELD-LEVEL ACCESS CONTROL SUMMARY
 * ============================================================================
 *
 * email, phone, address, city, postal_code:
 * - Lectura: NO ❌
 * - Asesor, Marketing, Gestor, Admin: YES ✅
 *
 * dni:
 * - Lectura, Marketing: NO ❌
 * - Asesor, Gestor, Admin: YES ✅
 *
 * emergency_contact_*:
 * - Lectura, Marketing: NO ❌
 * - Asesor, Gestor, Admin: YES ✅
 *
 * gdpr_consent, privacy_policy_accepted, consent_timestamp, consent_ip_address, created_by:
 * - Read: All authenticated users ✅
 * - Update: NO ONE ❌ (immutable)
 */
export const Students: CollectionConfig = {
  slug: 'students',

  labels: {
    singular: 'Student',
    plural: 'Students',
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['first_name', 'last_name', 'email', 'status', 'createdAt'],
    group: 'Academic',
    description: 'Student/learner profiles with complete PII and GDPR compliance',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateStudent, // Asesor, Marketing, Gestor, Admin
    read: canReadStudents, // All authenticated users (field-level access applies)
    update: canUpdateStudent, // Asesor (limited), Marketing (very limited), Gestor, Admin
    delete: canDeleteStudent, // Gestor, Admin only (GDPR)
  },

  fields: [
    // ============================================================================
    // PERSONAL INFORMATION (PII) - Required
    // ============================================================================

    {
      name: 'first_name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Student first name (PII)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'First name is required';
        if (val.length > 100) return 'First name must be 100 characters or less';
        return true;
      },
      // FIELD-LEVEL ACCESS: Lectura cannot read names
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          // Lectura can read non-PII fields only
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          // Only Gestor and Admin can update PII
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'last_name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Student last name (PII)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Last name is required';
        if (val.length > 100) return 'Last name must be 100 characters or less';
        return true;
      },
      // FIELD-LEVEL ACCESS: Same as first_name
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Student email address (PII - unique, GDPR protected)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Email is required';
        if (val.length > 255) return 'Email must be 255 characters or less';
        return true;
      },
      // FIELD-LEVEL ACCESS: Lectura cannot read email
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          // Email is sensitive PII
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'phone',
      type: 'text',
      required: true,
      maxLength: 20,
      admin: {
        description: 'Phone number in Spanish format: +34 XXX XXX XXX (PII)',
      },
      // FIELD-LEVEL ACCESS: Lectura cannot read phone
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // SPANISH ID DOCUMENT (OPTIONAL BUT HIGHLY SENSITIVE)
    // ============================================================================

    {
      name: 'dni',
      type: 'text',
      unique: true, // Must be unique if provided
      index: true,
      maxLength: 20,
      admin: {
        description: 'Spanish DNI/NIE (8 digits + letter) - HIGHLY SENSITIVE PII',
      },
      // FIELD-LEVEL ACCESS: Only Asesor, Gestor, Admin can read
      // Marketing and Lectura CANNOT read DNI
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          // DNI is HIGHLY sensitive - only Asesor, Gestor, Admin
          return ['asesor', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // CONTACT INFORMATION (PII)
    // ============================================================================

    {
      name: 'address',
      type: 'textarea',
      maxLength: 500,
      admin: {
        description: 'Street address (PII)',
      },
      // FIELD-LEVEL ACCESS: Lectura cannot read address
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'city',
      type: 'text',
      maxLength: 100,
      admin: {
        description: 'City (PII)',
      },
      // FIELD-LEVEL ACCESS: Lectura cannot read city
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'postal_code',
      type: 'text',
      maxLength: 10,
      admin: {
        description: 'Postal/ZIP code (PII)',
      },
      // FIELD-LEVEL ACCESS: Lectura cannot read postal code
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'country',
      type: 'text',
      defaultValue: 'España',
      maxLength: 100,
      admin: {
        description: 'Country (default: España)',
      },
      access: {
        read: () => true, // Country is not sensitive PII
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // DEMOGRAPHICS (OPTIONAL PII)
    // ============================================================================

    {
      name: 'date_of_birth',
      type: 'date',
      admin: {
        description: 'Date of birth (must be >= 16 years old) - PII',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
      // FIELD-LEVEL ACCESS: Marketing can read (for age-based campaigns)
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'gender',
      type: 'select',
      options: VALID_GENDERS.map((gender) => ({
        label: gender
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: gender,
      })),
      admin: {
        description: 'Gender (optional)',
      },
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // EMERGENCY CONTACT (HIGHLY SENSITIVE PII)
    // ============================================================================

    {
      name: 'emergency_contact_name',
      type: 'text',
      maxLength: 200,
      admin: {
        description: 'Emergency contact full name (HIGHLY SENSITIVE PII)',
      },
      // FIELD-LEVEL ACCESS: Only Asesor, Gestor, Admin
      // Marketing and Lectura CANNOT read emergency contacts
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          // Emergency contact is HIGHLY sensitive
          return ['asesor', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'emergency_contact_phone',
      type: 'text',
      maxLength: 20,
      admin: {
        description: 'Emergency contact phone: +34 XXX XXX XXX (HIGHLY SENSITIVE PII)',
      },
      // FIELD-LEVEL ACCESS: Only Asesor, Gestor, Admin
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'emergency_contact_relationship',
      type: 'select',
      options: VALID_RELATIONSHIPS.map((rel) => ({
        label: rel.charAt(0).toUpperCase() + rel.slice(1),
        value: rel,
      })),
      admin: {
        description: 'Relationship to student (parent, spouse, etc.)',
      },
      // FIELD-LEVEL ACCESS: Only Asesor, Gestor, Admin
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // GDPR COMPLIANCE FIELDS (CRITICAL - IMMUTABLE)
    // ============================================================================

    {
      name: 'gdpr_consent',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'REQUIRED: GDPR consent (immutable after creation)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true, // All authenticated can read
        update: () => false, // IMMUTABLE - no one can update
      },
      validate: (val: boolean | undefined) => {
        if (val !== true) {
          return 'GDPR consent is required and must be explicitly accepted';
        }
        return true;
      },
    },

    {
      name: 'privacy_policy_accepted',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'REQUIRED: Privacy policy acceptance (immutable)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE
      },
      validate: (val: boolean | undefined) => {
        if (val !== true) {
          return 'You must accept the privacy policy';
        }
        return true;
      },
    },

    {
      name: 'marketing_consent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'OPTIONAL: Consent to receive marketing communications',
      },
      // Marketing consent CAN be updated (opt-in/opt-out)
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['gestor', 'admin'].includes(user.role);
        },
      },
    },

    {
      name: 'consent_timestamp',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Auto-captured: When consent was given (ISO 8601) - IMMUTABLE',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
      // SECURITY Layer 2 (Security): Audit trail must be immutable for GDPR compliance
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE
      },
    },

    {
      name: 'consent_ip_address',
      type: 'text',
      maxLength: 45, // IPv6 max length
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Auto-captured: IP address when consent was given (PII) - IMMUTABLE',
      },
      // SECURITY Layer 2 (Security): PII audit trail must be immutable
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          // IP address is PII - only Admin and Gestor
          return ['gestor', 'admin'].includes(user.role);
        },
        update: () => false, // IMMUTABLE
      },
    },

    // ============================================================================
    // STUDENT STATUS
    // ============================================================================

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      index: true,
      options: VALID_STUDENT_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      admin: {
        position: 'sidebar',
        description: 'Current student status',
      },
      // Status can be updated by Asesor, Gestor, Admin
      access: {
        read: () => true, // All can read status
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // INTERNAL NOTES
    // ============================================================================

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this student (not visible to student)',
      },
      // Notes can be updated by Asesor, Marketing, Gestor, Admin
      access: {
        read: ({ req: { user } }) => {
          if (!user) return false;
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
        update: ({ req: { user } }) => {
          if (!user) return false;
          // Marketing can update notes (most limited write access)
          return ['asesor', 'marketing', 'gestor', 'admin'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // AUDIT TRAIL (IMMUTABLE)
    // ============================================================================

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'User who created this student (auto-populated, immutable)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true, // All can read who created the student
        update: () => false, // IMMUTABLE - created_by never changes
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
      captureStudentConsentMetadata, // 1. Auto-capture GDPR consent metadata (timestamp, IP)
      validateStudentData, // 2. Validate email, phone, DNI, age, emergency contact
      validateStudentRelationships, // 3. Validate created_by user exists
    ],

    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      trackStudentCreator, // 4. Auto-populate and protect created_by field
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};

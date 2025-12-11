import type { CollectionConfig } from 'payload';
import {
  canCreateLead,
  canReadLeads,
  canUpdateLead,
  canDeleteLead,
} from './access';
import {
  captureConsentMetadata,
  validateLeadRelationships,
  preventDuplicateLead,
  calculateLeadScore,
  triggerLeadCreatedJob,
} from './hooks';
import { spanishPhoneRegex } from './Leads.validation';
import { tenantField, isSuperAdmin, getUserTenantId } from '../../access/tenantAccess';

/**
 * Leads Collection - GDPR Compliant Lead Management
 *
 * This collection manages lead submissions from website forms with strict GDPR compliance.
 *
 * Database: PostgreSQL table 'leads' (/infra/postgres/migrations/004_create_leads.sql)
 *
 * ============================================================================
 * CRITICAL GDPR REQUIREMENTS (TOP PRIORITY)
 * ============================================================================
 *
 * Database-Level Enforcement:
 * - gdpr_consent MUST be true (CHECK constraint)
 * - privacy_policy_accepted MUST be true (CHECK constraint)
 * - consent_timestamp auto-captured (ISO 8601)
 * - consent_ip_address auto-captured (for audit)
 *
 * PII Fields (Protected):
 * - first_name, last_name, email, phone
 * - message, notes
 * - consent_ip_address
 *
 * ============================================================================
 * ACCESS CONTROL MODEL
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: YES (form submission) ✅
 * - READ: NO (privacy protection) ❌
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: NO (no lead access) ❌
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: YES ✅
 * - READ: Only assigned leads ✅
 * - UPDATE: Only assigned leads ✅
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: All leads ✅
 * - UPDATE: All leads ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All leads ✅
 * - UPDATE: All leads ✅
 * - DELETE: YES (for spam/GDPR) ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All leads ✅
 * - UPDATE: All leads ✅
 * - DELETE: YES (GDPR right to be forgotten) ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Lead Capture:
 * - Public form submission (no authentication required)
 * - Spanish phone format validation: +34 XXX XXX XXX
 * - Email RFC 5322 validation
 * - GDPR consent enforcement
 * - Duplicate prevention (24-hour window)
 *
 * Lead Management:
 * - Status tracking (new → contacted → qualified → converted)
 * - Priority levels (low, medium, high, urgent)
 * - Lead assignment to users
 * - Automatic lead scoring (0-100)
 * - Notes and internal comments
 *
 * Marketing Attribution:
 * - UTM parameter tracking (source, medium, campaign, term, content)
 * - Course and campus relationships
 * - Campaign tracking
 *
 * GDPR Compliance:
 * - Mandatory consent capture
 * - Consent metadata (timestamp, IP address)
 * - Right to access (users can read their data)
 * - Right to be forgotten (admin can delete)
 * - Audit trail logging
 *
 * External Integrations:
 * - MailChimp subscriber management
 * - WhatsApp notifications
 * - Email automation (via BullMQ jobs)
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 *
 * - Rate limiting should be implemented at API gateway level
 * - CAPTCHA should be added to public forms to prevent spam
 * - All PII access is logged for audit purposes
 * - Consent cannot be modified after creation
 * - Delete operations trigger audit log entries
 */
export const Leads: CollectionConfig = {
  slug: 'leads',

  labels: {
    singular: 'Lead',
    plural: 'Leads',
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['first_name', 'last_name', 'email', 'status', 'lead_score', 'assigned_to', 'createdAt'],
    group: 'Marketing',
    description: 'Lead submissions with GDPR compliance and automated scoring',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateLead, // Public + authenticated users
    read: canReadLeads, // Role-based: Asesor (assigned), Marketing (all), Gestor (all), Admin (all)
    update: canUpdateLead, // Marketing, Gestor, Admin, Asesor (assigned)
    delete: canDeleteLead, // Admin and Gestor only (GDPR right to be forgotten)
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
        description: 'First name of the lead (PII)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'First name is required';
        if (val.length > 100) return 'First name must be 100 characters or less';
        return true;
      },
    },

    {
      name: 'last_name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Last name of the lead (PII)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Last name is required';
        if (val.length > 100) return 'Last name must be 100 characters or less';
        return true;
      },
    },

    {
      name: 'email',
      type: 'email',
      required: true,
      unique: false, // Not unique - same person can request info about multiple courses
      index: true,
      admin: {
        description: 'Email address (PII - protected by GDPR)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Email is required';
        if (val.length > 255) return 'Email must be 255 characters or less';
        // Payload's email field already validates RFC 5322
        return true;
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
      validate: (val: string | undefined) => {
        if (!val) return 'Phone is required';
        if (!spanishPhoneRegex.test(val)) {
          return 'Phone must be in Spanish format: +34 XXX XXX XXX';
        }
        return true;
      },
    },

    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      admin: {
        description: 'Course the lead is interested in (optional)',
      },
    },

    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      admin: {
        description: 'Preferred campus location (optional)',
      },
    },

    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      admin: {
        description: 'Marketing campaign source (optional)',
      },
    },

    // ============================================================================
    // ADDITIONAL INFORMATION
    // ============================================================================

    {
      name: 'message',
      type: 'textarea',
      maxLength: 5000,
      admin: {
        description: 'Additional message or questions from the lead (PII)',
      },
    },

    {
      name: 'preferred_contact_method',
      type: 'select',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'WhatsApp', value: 'whatsapp' },
      ],
      admin: {
        description: 'How the lead prefers to be contacted',
      },
    },

    {
      name: 'preferred_contact_time',
      type: 'select',
      options: [
        { label: 'Morning (9am-12pm)', value: 'morning' },
        { label: 'Afternoon (12pm-6pm)', value: 'afternoon' },
        { label: 'Evening (6pm-9pm)', value: 'evening' },
        { label: 'Anytime', value: 'anytime' },
      ],
      defaultValue: 'anytime',
      admin: {
        description: 'Best time to contact the lead',
      },
    },

    // ============================================================================
    // GDPR COMPLIANCE FIELDS (CRITICAL)
    // ============================================================================

    {
      name: 'gdpr_consent',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'REQUIRED: GDPR consent to process personal data',
        readOnly: true, // UI protection: Cannot be changed after creation
      },
      // SECURITY: Field-level access control prevents API manipulation
      access: {
        read: () => true,
        update: () => false, // GDPR consent is immutable after creation
      },
      validate: (val: boolean | undefined) => {
        if (val !== true) {
          return 'GDPR consent is required to submit this form';
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
        description: 'REQUIRED: Privacy policy acceptance',
        readOnly: true, // UI protection: Cannot be changed after creation
      },
      // SECURITY: Field-level access control prevents API manipulation
      access: {
        read: () => true,
        update: () => false, // Privacy policy acceptance is immutable
      },
      validate: (val: boolean | undefined) => {
        if (val !== true) {
          return 'You must accept the privacy policy to submit this form';
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
    },

    {
      name: 'consent_timestamp',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-captured: When consent was given (ISO 8601)',
      },
      // SECURITY: Audit trail must be immutable for GDPR compliance
      access: {
        read: () => true,
        update: () => false, // Timestamp cannot be modified (audit trail)
      },
    },

    {
      name: 'consent_ip_address',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-captured: IP address when consent was given',
      },
      // SECURITY: PII audit trail must be immutable for GDPR compliance
      access: {
        read: () => true,
        update: () => false, // IP address cannot be modified (audit trail)
      },
    },

    // ============================================================================
    // LEAD MANAGEMENT FIELDS
    // ============================================================================

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Converted', value: 'converted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Spam', value: 'spam' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Current status of the lead',
      },
    },

    {
      name: 'assigned_to',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'User assigned to follow up with this lead',
      },
    },

    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Lead priority level',
      },
    },

    // ============================================================================
    // UTM TRACKING (Marketing Attribution)
    // ============================================================================

    {
      type: 'group',
      name: 'utm',
      label: 'UTM Tracking',
      fields: [
        {
          name: 'source',
          type: 'text',
          maxLength: 255,
          admin: {
            description: 'UTM source (e.g., google, facebook)',
          },
        },
        {
          name: 'medium',
          type: 'text',
          maxLength: 255,
          admin: {
            description: 'UTM medium (e.g., cpc, email)',
          },
        },
        {
          name: 'campaign',
          type: 'text',
          maxLength: 255,
          admin: {
            description: 'UTM campaign (e.g., summer-2025)',
          },
        },
        {
          name: 'term',
          type: 'text',
          maxLength: 255,
          admin: {
            description: 'UTM term (keywords)',
          },
        },
        {
          name: 'content',
          type: 'text',
          maxLength: 255,
          admin: {
            description: 'UTM content (ad variant)',
          },
        },
      ],
      admin: {
        description: 'Marketing attribution parameters',
      },
    },

    // ============================================================================
    // EXTERNAL SERVICE INTEGRATION
    // ============================================================================

    {
      name: 'mailchimp_subscriber_id',
      type: 'text',
      maxLength: 255,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'MailChimp subscriber ID (auto-populated)',
      },
      // SECURITY: External integration IDs must not be modified manually
      access: {
        read: () => true,
        update: () => false, // Only workers can set this via hooks
      },
    },

    {
      name: 'whatsapp_contact_id',
      type: 'text',
      maxLength: 255,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'WhatsApp contact ID (auto-populated)',
      },
      // SECURITY: External integration IDs must not be modified manually
      access: {
        read: () => true,
        update: () => false, // Only workers can set this via hooks
      },
    },

    // ============================================================================
    // LEAD SCORING
    // ============================================================================

    {
      name: 'lead_score',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Calculated lead score (0-100) - auto-computed',
      },
    },

    // ============================================================================
    // NOTES (Internal)
    // ============================================================================

    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Internal notes about this lead (not visible to lead)',
      },
    },

    // ============================================================================
    // TIMESTAMPS
    // ============================================================================

    {
      name: 'last_contacted_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When was this lead last contacted',
      },
    },

    {
      name: 'converted_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When the lead was converted (auto-set when status = converted)',
      },
      // SECURITY: Conversion metrics must not be manipulated
      access: {
        read: () => true,
        update: () => false, // Only hooks can set this automatically
      },
    },

    /**
     * Tenant - Multi-tenant support
     * Associates lead with a specific academy/organization
     * Auto-assigned based on campaign or form source
     */
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false, // Public submissions may not have tenant initially
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Academia/Organización propietaria',
        condition: (data: any, siblingData: any, { user }: { user: any }) => {
          return isSuperAdmin(user);
        },
      },
      access: {
        read: () => true,
        update: ({ req }) => isSuperAdmin(req.user),
      },
      hooks: {
        beforeChange: [
          ({ req, value }: { req: any; value: any }) => {
            // If value is set (by SuperAdmin), use it
            if (value) return value;

            // Otherwise, use user's tenant if authenticated
            if (req.user) {
              const tenantId = getUserTenantId(req.user);
              return tenantId || value;
            }

            return value;
          },
        ],
      },
    },
  ],

  /**
   * Hooks - Business logic and side effects
   */
  hooks: {
    /**
     * Before Validate: Run before Payload's built-in validation
     * Order matters: Execute in sequence
     */
    beforeValidate: [
      captureConsentMetadata, // 1. Capture GDPR consent metadata (timestamp, IP)
      validateLeadRelationships, // 2. Validate foreign keys exist
      preventDuplicateLead, // 3. Check for duplicates (same email+course within 24h)
      calculateLeadScore, // 4. Calculate lead score (0-100)
    ],

    /**
     * After Change: Triggered after successful create/update
     */
    afterChange: [
      triggerLeadCreatedJob, // Trigger async jobs (email, MailChimp, WhatsApp, etc.)
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};

import type { CollectionConfig } from 'payload';
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
export declare const Leads: CollectionConfig;
//# sourceMappingURL=Leads.d.ts.map
import type { CollectionConfig } from 'payload';
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
export declare const Students: CollectionConfig;
//# sourceMappingURL=Students.d.ts.map
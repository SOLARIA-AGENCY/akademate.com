import type { Access } from 'payload';

/**
 * Access Control: canUpdateStudent
 *
 * Determines who can update existing student records.
 *
 * BUSINESS RULES:
 * - Public (unauthenticated): NO ❌
 *   Student data can only be updated by authenticated staff.
 *
 * - Lectura: NO ❌
 *   Read-only role cannot modify student data.
 *
 * - Asesor: LIMITED ✅
 *   Can update:
 *   - notes (internal notes)
 *   - status (active, inactive, etc.)
 *   Cannot update:
 *   - PII fields (email, phone, DNI, address, etc.)
 *   - GDPR consent fields (immutable)
 *   - Audit fields (created_by, timestamps)
 *
 * - Marketing: LIMITED ✅
 *   Can update:
 *   - notes ONLY (for campaign tracking)
 *   Cannot update:
 *   - Status, PII, GDPR fields, audit fields
 *
 * - Gestor: YES ✅
 *   Can update all fields EXCEPT immutable fields:
 *   - gdpr_consent (immutable after creation)
 *   - privacy_policy_accepted (immutable)
 *   - consent_timestamp (immutable)
 *   - consent_ip_address (immutable)
 *   - created_by (immutable)
 *
 * - Admin: YES ✅
 *   Same as Gestor - can update all fields except immutable ones.
 *   Even Admin cannot revoke GDPR consent or modify audit trail.
 *
 * FIELD-LEVEL ACCESS CONTROL (Applied in Students.ts):
 * All immutable fields have `access.update: () => false`
 *
 * SECURITY CONSIDERATIONS (SP-001, SP-002):
 * - Immutable fields protected at field level (defense in depth)
 * - GDPR consent cannot be revoked via API (legal requirement)
 * - Audit trail (created_by, timestamps) is tamper-proof
 * - Marketing has most restricted update access
 *
 * @param req - Payload request object containing user information
 * @returns boolean - true if user can update students, false otherwise
 */
export const canUpdateStudent: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public cannot update students
  }

  // Role-based access control
  const allowedRoles = ['asesor', 'marketing', 'gestor', 'admin'];

  if (allowedRoles.includes(user.role)) {
    return true; // Collection-level update granted, field-level access applies per role
  }

  // Lectura and unknown roles: denied
  return false;
};

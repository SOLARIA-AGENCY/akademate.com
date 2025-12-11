import type { Access } from 'payload';

/**
 * Access Control: canReadStudents
 *
 * Determines who can read student records from the system.
 *
 * IMPORTANT: This is COLLECTION-LEVEL access control.
 * Field-level access control is applied separately for PII fields.
 *
 * BUSINESS RULES:
 * - Public (unauthenticated): NO ❌
 *   Student data is highly sensitive PII, never public.
 *
 * - Lectura: LIMITED ✅
 *   Can read records but NOT PII fields (email, phone, DNI, etc.).
 *   Field-level access control applies.
 *
 * - Asesor: YES ✅
 *   Can read all student information for advisory purposes.
 *
 * - Marketing: LIMITED ✅
 *   Can read most fields but NOT highly sensitive PII (DNI, emergency contacts).
 *   Field-level access control applies.
 *
 * - Gestor: YES ✅
 *   Full read access to all student information.
 *
 * - Admin: YES ✅
 *   Full read access to all student information.
 *
 * FIELD-LEVEL ACCESS CONTROL (Applied in Students.ts):
 * - email: Lectura cannot read
 * - phone: Lectura cannot read
 * - dni: Marketing and Lectura cannot read
 * - address, city, postal_code: Lectura cannot read
 * - emergency_contact_*: Marketing and Lectura cannot read
 *
 * SECURITY CONSIDERATIONS (SP-004: PII Data Handling):
 * - Students have maximum PII exposure (15+ PII fields)
 * - Field-level access control is CRITICAL
 * - Public access is ALWAYS denied
 * - Even authenticated users have restricted field access based on role
 *
 * @param req - Payload request object containing user information
 * @returns boolean | Where - true if user can read all students, false if denied,
 *                             or Where clause to filter accessible records
 */
export const canReadStudents: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public NEVER has access to student PII
  }

  // All authenticated users can read students (field-level access applies)
  const allowedRoles = ['lectura', 'asesor', 'marketing', 'gestor', 'admin'];

  if (allowedRoles.includes(user.role)) {
    return true; // Collection-level access granted, field-level access applies per role
  }

  // Unknown roles: denied
  return false;
};

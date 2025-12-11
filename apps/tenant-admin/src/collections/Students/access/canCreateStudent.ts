import type { Access } from 'payload';

/**
 * Access Control: canCreateStudent
 *
 * Determines who can create new students in the system.
 *
 * BUSINESS RULES:
 * - Public (unauthenticated): NO ❌
 *   Students are NOT created via public forms (unlike Leads).
 *   Students are created by staff during enrollment process.
 *
 * - Lectura: NO ❌
 *   Read-only role cannot create students.
 *
 * - Asesor: YES ✅
 *   Can create students during enrollment process.
 *
 * - Marketing: YES ✅
 *   Can create students from qualified leads.
 *
 * - Gestor: YES ✅
 *   Full management access, can create students.
 *
 * - Admin: YES ✅
 *   Full system access, can create students.
 *
 * SECURITY CONSIDERATIONS:
 * - Students contain highly sensitive PII (DNI, emergency contacts)
 * - Creation should only be by authenticated staff
 * - No public student creation (prevents spam/abuse)
 * - GDPR consent must be enforced during creation (handled by validation)
 *
 * @param req - Payload request object containing user information
 * @returns boolean - true if user can create students, false otherwise
 */
export const canCreateStudent: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public cannot create students
  }

  // Role-based access control
  const allowedRoles = ['asesor', 'marketing', 'gestor', 'admin'];

  if (allowedRoles.includes(user.role)) {
    return true; // Authorized role
  }

  // Lectura and any other roles: denied
  return false;
};

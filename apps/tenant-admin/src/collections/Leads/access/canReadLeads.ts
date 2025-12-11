import type { Access } from 'payload';

/**
 * Access Control: canReadLeads
 *
 * Role-based read access to leads (GDPR privacy protection):
 *
 * - Public: CANNOT read any leads (privacy protection)
 * - Lectura: CANNOT read leads (no lead access for read-only role)
 * - Asesor: Can ONLY read leads assigned to them
 * - Marketing: Can read ALL leads
 * - Gestor: Can read ALL leads
 * - Admin: Can read ALL leads
 *
 * PII Protection:
 * - Leads contain sensitive personal information (email, phone, etc.)
 * - Access is strictly controlled by role
 * - All read access is logged (via hooks)
 */
export const canReadLeads: Access = ({ req: { user } }) => {
  // Public cannot read leads (privacy protection)
  if (!user) {
    return false;
  }

  // Admin and Gestor can read all leads
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing can read all leads
  if (user.role === 'marketing') {
    return true;
  }

  // Asesor can only read leads assigned to them
  if (user.role === 'asesor') {
    return {
      assigned_to: {
        equals: user.id,
      },
    };
  }

  // Lectura role cannot access leads
  return false;
};

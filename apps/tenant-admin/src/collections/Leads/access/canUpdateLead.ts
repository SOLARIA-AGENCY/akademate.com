import type { Access } from 'payload';

/**
 * Access Control: canUpdateLead
 *
 * Role-based update access to leads:
 *
 * - Public: CANNOT update leads
 * - Lectura: CANNOT update leads
 * - Asesor: Can update leads assigned to them (limited fields: notes, status updates)
 * - Marketing: Can update ALL leads
 * - Gestor: Can update ALL leads
 * - Admin: Can update ALL leads
 *
 * Update restrictions:
 * - Cannot modify GDPR consent fields after creation
 * - Cannot modify consent_timestamp or consent_ip_address
 * - PII modifications should be logged for audit trail
 */
export const canUpdateLead: Access = ({ req: { user } }) => {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Admin and Gestor can update all leads
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing can update all leads
  if (user.role === 'marketing') {
    return true;
  }

  // Asesor can update leads assigned to them
  if (user.role === 'asesor') {
    return {
      assigned_to: {
        equals: user.id,
      },
    };
  }

  // Lectura role cannot update leads
  return false;
};

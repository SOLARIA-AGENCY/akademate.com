import type { Access } from 'payload';

/**
 * Access Control: Who can UPDATE ad templates
 *
 * Ownership-based permissions: Marketing users can only update their own templates.
 * Gestors and Admins can update any template.
 *
 * Allowed Roles:
 * - Marketing: YES (own templates only) ✅
 *   Returns query constraint: { created_by: { equals: user.id } }
 *
 * - Gestor: YES (all templates) ✅
 * - Admin: YES (all templates) ✅
 *
 * Denied Roles:
 * - Public: NO ❌ (unauthenticated users)
 * - Lectura: NO ❌ (read-only role)
 * - Asesor: NO ❌ (advisors view templates but don't modify them)
 *
 * Security Considerations:
 * - Marketing role: Ownership enforced via created_by relationship
 * - Prevents privilege escalation (Marketing cannot edit others' templates)
 * - Gestor/Admin: Can update any template
 * - Immutable fields (created_by, version, usage_count, timestamps) protected at field level
 */
export const canUpdateAdsTemplate: Access = ({ req: { user } }) => {
  // No authentication = no access
  if (!user) {
    return false;
  }

  // Admin and Gestor: unrestricted access
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing: ownership-based access (only own templates)
  if (user.role === 'marketing') {
    return {
      created_by: {
        equals: user.id,
      },
    };
  }

  // All other roles: no update access
  return false;
};

/**
 * Access Control - Update FAQ
 *
 * Determines who can update FAQs.
 *
 * Access Rules:
 * - Public: Cannot update ❌
 * - Lectura: Cannot update ❌
 * - Asesor: Cannot update ❌
 * - Marketing: Can update only own FAQs (created_by = user.id) ✅
 * - Gestor: Can update all FAQs ✅
 * - Admin: Can update all FAQs ✅
 *
 * Ownership-based permissions for Marketing role.
 */

import type { Access } from 'payload';

export const canUpdateFAQ: Access = ({ req: { user } }) => {
  // Public and unauthenticated users cannot update
  if (!user) {
    return false;
  }

  // Admin and Gestor can update all FAQs
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing can only update their own FAQs
  if (user.role === 'marketing') {
    return {
      created_by: {
        equals: user.id,
      },
    };
  }

  // All other roles denied (Lectura, Asesor)
  return false;
};

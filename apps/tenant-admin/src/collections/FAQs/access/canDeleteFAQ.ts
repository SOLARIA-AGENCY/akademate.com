/**
 * Access Control - Delete FAQ
 *
 * Determines who can delete FAQs.
 *
 * Allowed Roles:
 * - Gestor ✅
 * - Admin ✅
 *
 * Denied Roles:
 * - Public ❌
 * - Lectura ❌
 * - Asesor ❌
 * - Marketing ❌
 */

import type { Access } from 'payload';

export const canDeleteFAQ: Access = ({ req: { user } }) => {
  // Public and unauthenticated users cannot delete
  if (!user) {
    return false;
  }

  // Only Admin and Gestor can delete FAQs
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // All other roles denied (including Marketing)
  return false;
};

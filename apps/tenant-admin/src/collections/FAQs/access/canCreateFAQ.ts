/**
 * Access Control - Create FAQ
 *
 * Determines who can create FAQs.
 *
 * Allowed Roles:
 * - Marketing ✅
 * - Gestor ✅
 * - Admin ✅
 *
 * Denied Roles:
 * - Public ❌
 * - Lectura ❌
 * - Asesor ❌
 */

import type { Access } from 'payload';

export const canCreateFAQ: Access = ({ req: { user } }) => {
  // Public (no user) cannot create
  if (!user) {
    return false;
  }

  // Marketing, Gestor, Admin can create
  if (['marketing', 'gestor', 'admin'].includes(user.role)) {
    return true;
  }

  // All other roles denied
  return false;
};

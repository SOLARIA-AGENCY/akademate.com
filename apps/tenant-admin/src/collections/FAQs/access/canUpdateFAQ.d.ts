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
export declare const canUpdateFAQ: Access;
//# sourceMappingURL=canUpdateFAQ.d.ts.map
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
export declare const canDeleteFAQ: Access;
//# sourceMappingURL=canDeleteFAQ.d.ts.map
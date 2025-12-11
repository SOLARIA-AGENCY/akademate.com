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
export declare const canCreateFAQ: Access;
//# sourceMappingURL=canCreateFAQ.d.ts.map
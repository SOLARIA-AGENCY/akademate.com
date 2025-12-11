/**
 * Access Control - Read FAQs
 *
 * Determines who can read FAQs.
 *
 * Access Rules:
 * - Public: Can read published FAQs only (status = 'published')
 * - Lectura: Can read all FAQs
 * - Asesor: Can read all FAQs
 * - Marketing: Can read all FAQs
 * - Gestor: Can read all FAQs
 * - Admin: Can read all FAQs
 */
import type { Access } from 'payload';
export declare const canReadFAQs: Access;
//# sourceMappingURL=canReadFAQs.d.ts.map
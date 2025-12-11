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
export declare const canReadLeads: Access;
//# sourceMappingURL=canReadLeads.d.ts.map
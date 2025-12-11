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
export declare const canUpdateLead: Access;
//# sourceMappingURL=canUpdateLead.d.ts.map
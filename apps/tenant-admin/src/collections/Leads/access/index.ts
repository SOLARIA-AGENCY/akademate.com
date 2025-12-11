/**
 * Leads Collection - Access Control Functions
 *
 * This module exports all access control functions for the Leads collection.
 *
 * GDPR Compliance:
 * - Read access is strictly controlled to protect PII
 * - Only Admin can delete leads (right to be forgotten)
 * - All access should be logged for audit purposes
 *
 * Security Model:
 * - Public: Can CREATE only (form submission)
 * - Lectura: No access
 * - Asesor: Read/update assigned leads only
 * - Marketing: Read/update all leads
 * - Gestor: Read/update all leads
 * - Admin: Full access including delete
 */

export { canCreateLead } from './canCreateLead';
export { canReadLeads } from './canReadLeads';
export { canUpdateLead } from './canUpdateLead';
export { canDeleteLead } from './canDeleteLead';

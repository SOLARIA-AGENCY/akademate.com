import type { Access } from 'payload';
/**
 * Access Control: Who can READ campaigns
 *
 * Campaigns contain business intelligence data (budget, ROI, conversion rates).
 * Public access is denied to protect sensitive business data.
 *
 * Allowed Roles:
 * - Lectura: YES ✅ (read-only role - can view campaigns but not sensitive fields)
 * - Asesor: YES ✅ (advisors need to see campaign attribution)
 * - Marketing: YES ✅ (primary users)
 * - Gestor: YES ✅ (supervisors)
 * - Admin: YES ✅ (system admins)
 *
 * Denied Roles:
 * - Public: NO ❌ (business intelligence protection)
 *
 * Note: Field-level access control applies for sensitive business data
 * (budget, cost_per_lead, conversion_rate) - see Campaigns.ts field definitions
 */
export declare const canReadCampaigns: Access;
//# sourceMappingURL=canReadCampaigns.d.ts.map
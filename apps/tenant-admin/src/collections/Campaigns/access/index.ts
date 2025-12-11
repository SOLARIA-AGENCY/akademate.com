/**
 * Campaigns Collection - Access Control Functions
 *
 * This module exports all access control functions for the Campaigns collection.
 *
 * Access Control Model:
 * - Marketing: Create campaigns, update own campaigns only
 * - Gestor: Full access except immutable fields
 * - Admin: Full access except immutable fields
 * - Asesor, Lectura: Read-only access
 * - Public: No access (business intelligence protection)
 */

export { canCreateCampaign } from './canCreateCampaign';
export { canReadCampaigns } from './canReadCampaigns';
export { canUpdateCampaign } from './canUpdateCampaign';
export { canDeleteCampaign } from './canDeleteCampaign';

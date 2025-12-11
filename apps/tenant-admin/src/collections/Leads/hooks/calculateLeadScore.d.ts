import type { FieldHook } from 'payload';
/**
 * Hook: calculateLeadScore
 *
 * Automatically calculates a lead score (0-100) based on data completeness and quality.
 *
 * Scoring criteria:
 * - Required fields (40 points): first_name, last_name, email, phone
 * - Optional high-value fields (30 points): course, message, campus
 * - Contact preferences (10 points): preferred_contact_method, preferred_contact_time
 * - Marketing consent (20 points): marketing_consent = true
 *
 * Lead scoring benefits:
 * - Prioritize high-quality leads
 * - Auto-route to appropriate team members
 * - Measure lead quality over time
 * - Optimize marketing campaigns
 *
 * Score ranges:
 * - 80-100: Hot lead (complete info + marketing consent)
 * - 60-79: Warm lead (good info, some optional fields)
 * - 40-59: Cold lead (minimal info)
 * - 0-39: Very cold (incomplete required fields)
 */
export declare const calculateLeadScore: FieldHook;
//# sourceMappingURL=calculateLeadScore.d.ts.map
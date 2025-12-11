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
export const calculateLeadScore: FieldHook = ({ data, operation }) => {
  // Run on both create and update
  if (!data) {
    return data;
  }

  let score = 0;

  // ============================================================================
  // REQUIRED FIELDS (40 points total)
  // ============================================================================

  if (data.first_name && data.first_name.trim().length > 0) {
    score += 10;
  }

  if (data.last_name && data.last_name.trim().length > 0) {
    score += 10;
  }

  if (data.email && data.email.trim().length > 0) {
    score += 10;
  }

  if (data.phone && data.phone.trim().length > 0) {
    score += 10;
  }

  // ============================================================================
  // OPTIONAL HIGH-VALUE FIELDS (30 points total)
  // ============================================================================

  // Course selection is highly valuable (shows specific interest)
  if (data.course) {
    score += 15;
  }

  // Campus selection shows commitment to location
  if (data.campus) {
    score += 5;
  }

  // Detailed message shows engagement
  if (data.message && data.message.trim().length > 20) {
    score += 10;
  }

  // ============================================================================
  // CONTACT PREFERENCES (10 points total)
  // ============================================================================

  // Specified contact method
  if (data.preferred_contact_method) {
    score += 5;
  }

  // Specified contact time
  if (data.preferred_contact_time) {
    score += 5;
  }

  // ============================================================================
  // MARKETING CONSENT (20 points)
  // ============================================================================

  // Marketing consent is valuable for long-term engagement
  if (data.marketing_consent === true) {
    score += 20;
  }

  // ============================================================================
  // ENSURE SCORE IS WITHIN 0-100 RANGE
  // ============================================================================

  data.lead_score = Math.min(100, Math.max(0, score));

  // Log score calculation for analytics (NO PII)
  if (operation === 'create') {
    console.log(`[Lead Score] New lead scored ${data.lead_score}/100`);
    // SECURITY: Do NOT log email address (PII)
  }

  return data;
};

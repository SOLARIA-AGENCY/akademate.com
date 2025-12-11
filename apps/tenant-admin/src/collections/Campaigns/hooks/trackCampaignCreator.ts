import type { FieldHook } from 'payload';

/**
 * Hook: Track Campaign Creator (beforeChange)
 *
 * Purpose:
 * - Auto-populate created_by field with current user ID on create
 * - Enforce immutability: created_by cannot be changed after creation
 * - Prevent privilege escalation attacks
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Security Considerations:
 * - Layer 1 (UX): admin.readOnly = true (prevents UI edits)
 * - Layer 2 (Security): access.update = false (blocks API updates)
 * - Layer 3 (Business Logic): This hook enforces immutability
 *
 * No PII Logging:
 * - Logs only campaign.id and user.id (non-sensitive)
 * - NEVER logs campaign name or budget (business intelligence)
 */
export const trackCampaignCreator: FieldHook = ({ req, operation, value, originalDoc }) => {
  // Only apply on CREATE operation
  if (operation === 'create') {
    // Auto-populate created_by with current user
    if (req.user) {
      return req.user.id;
    }
  }

  // On UPDATE: preserve original created_by (immutability enforcement)
  if (operation === 'update') {
    if (originalDoc?.created_by) {
      // Ignore any attempt to change created_by
      return originalDoc.created_by;
    }
  }

  // Fallback: preserve existing value
  return value;
};

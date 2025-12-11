import type { FieldHook } from 'payload';

/**
 * Hook: Set Archived Timestamp (beforeChange)
 *
 * Purpose:
 * - Auto-set archived_at timestamp when status changes to 'archived'
 * - Enforce immutability: archived_at cannot be manually modified
 * - Track when templates were archived for audit purposes
 *
 * Security Pattern: SP-001 (Immutable Fields - System-managed timestamp)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Business Rules:
 * - archived_at is set ONLY when status becomes 'archived'
 * - Once set, archived_at cannot be changed
 * - Archived status is terminal (cannot transition from archived)
 *
 * No PII Logging:
 * - Logs only template.id and status (non-sensitive)
 * - NEVER logs template content (confidential)
 */
export const setArchivedTimestamp: FieldHook = ({ req, data, operation, originalDoc }) => {
  // Only process on create or update operations
  if (operation !== 'create' && operation !== 'update') {
    return undefined;
  }

  // If status is 'archived' and archived_at is not already set
  if (data?.status === 'archived' && !originalDoc?.archived_at) {
    // Auto-set archived_at to current timestamp
    return new Date().toISOString();
  }

  // Preserve existing archived_at if already set (immutability)
  if (originalDoc?.archived_at) {
    return originalDoc.archived_at;
  }

  // No archived_at if status is not archived
  return undefined;
};

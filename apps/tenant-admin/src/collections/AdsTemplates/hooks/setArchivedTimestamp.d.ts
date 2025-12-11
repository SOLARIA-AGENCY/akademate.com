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
export declare const setArchivedTimestamp: FieldHook;
//# sourceMappingURL=setArchivedTimestamp.d.ts.map
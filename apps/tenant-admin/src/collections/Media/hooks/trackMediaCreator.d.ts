import type { FieldHook } from 'payload';
/**
 * Hook: Track Media Creator (beforeChange)
 *
 * Purpose:
 * - Auto-populate created_by field with uploader's user ID
 * - Enforce immutability: created_by cannot be modified after upload
 * - Track ownership for access control
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Business Rules:
 * - created_by is set ONLY on upload (operation = 'create')
 * - Once set, created_by cannot be changed (even by Admin)
 * - Prevents ownership hijacking attacks
 *
 * No PII Logging (SP-004):
 * - Logs only user.id and operation (non-sensitive)
 * - NEVER logs filename or file content
 */
export declare const trackMediaCreator: FieldHook;
//# sourceMappingURL=trackMediaCreator.d.ts.map
import type { FieldHook } from 'payload';
/**
 * Hook: Track Template Creator (beforeChange)
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
 * - Logs only template.id and user.id (non-sensitive)
 * - NEVER logs template content or URLs (confidential marketing assets)
 */
export declare const trackTemplateCreator: FieldHook;
//# sourceMappingURL=trackTemplateCreator.d.ts.map
import type { FieldHook } from 'payload';
/**
 * Hook: validateLeadRelationships
 *
 * Validates that all relationship IDs (course, campus, campaign, assigned_to) exist.
 *
 * This hook ensures referential integrity before saving to the database.
 * While Payload CMS handles basic relationship validation, this hook provides:
 * - Better error messages
 * - Graceful handling of non-existent campaigns (optional collection)
 * - Audit logging for invalid relationships
 *
 * Relationships validated:
 * - course_id → courses table
 * - campus_id → campuses table
 * - campaign_id → campaigns table (optional, might not be implemented yet)
 * - assigned_to → users table
 */
export declare const validateLeadRelationships: FieldHook;
//# sourceMappingURL=validateLeadRelationships.d.ts.map
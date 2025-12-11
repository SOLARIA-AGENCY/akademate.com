/**
 * Hook: Generate Slug from Question
 *
 * Auto-generates URL-safe slug from FAQ question:
 * - Normalizes Spanish characters (á→a, ñ→n, ü→u, etc.)
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Handles duplicates with numeric suffix (-1, -2, etc.)
 * - Truncates to max 100 characters
 *
 * SECURITY (SP-004): No logging of question content
 *
 * @hook beforeValidate
 */
import type { FieldHook } from 'payload';
/**
 * Generate slug hook
 */
export declare const generateSlug: FieldHook;
//# sourceMappingURL=generateSlug.d.ts.map
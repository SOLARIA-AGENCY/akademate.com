/**
 * Hook: Track FAQ Creator
 *
 * Auto-populates created_by field with current user ID:
 * - On create: Sets created_by = req.user.id
 * - On update: Preserves original created_by (immutable)
 *
 * SECURITY PATTERN (SP-001 Layer 3):
 * - This is the business logic layer of immutability defense
 * - Layer 1: admin.readOnly = true (UX)
 * - Layer 2: access.update = false (Security)
 * - Layer 3: This hook (Business Logic)
 *
 * SECURITY (SP-004): No logging of user email or names
 *
 * @hook beforeChange
 */
import type { FieldHook } from 'payload';
export declare const trackFAQCreator: FieldHook;
//# sourceMappingURL=trackFAQCreator.d.ts.map
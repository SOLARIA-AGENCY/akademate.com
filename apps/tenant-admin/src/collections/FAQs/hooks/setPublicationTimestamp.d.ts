/**
 * Hook: Set Publication Timestamp
 *
 * Auto-sets published_at timestamp when status changes to 'published':
 * - On first publication: Sets published_at = current timestamp
 * - On subsequent updates: Preserves original published_at (immutable)
 * - If status changes from published: Keeps published_at (history)
 *
 * SECURITY PATTERN (SP-001 Layer 3):
 * - This is the business logic layer of immutability defense
 * - Layer 1: admin.readOnly = true (UX)
 * - Layer 2: access.update = false (Security)
 * - Layer 3: This hook (Business Logic)
 *
 * SECURITY (SP-004): No logging of FAQ content or timestamps
 *
 * @hook beforeChange
 */
import type { FieldHook } from 'payload';
export declare const setPublicationTimestamp: FieldHook;
//# sourceMappingURL=setPublicationTimestamp.d.ts.map
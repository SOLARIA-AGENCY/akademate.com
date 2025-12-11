/**
 * Hook: Set Archived Timestamp
 *
 * Auto-sets archived_at timestamp when status changes to 'archived':
 * - On first archive: Sets archived_at = current timestamp
 * - On subsequent updates: Preserves original archived_at (immutable)
 * - Archived is a terminal status (cannot change from archived)
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
export declare const setArchivedTimestamp: FieldHook;
//# sourceMappingURL=setArchivedTimestamp.d.ts.map
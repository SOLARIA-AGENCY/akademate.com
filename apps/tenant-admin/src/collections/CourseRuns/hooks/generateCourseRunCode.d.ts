import type { CollectionBeforeChangeHook } from 'payload';
/**
 * Hook: generateCourseRunCode
 *
 * Auto-generates a unique code for course runs (convocations) with format:
 * {CAMPUS_CODE}-{YEAR}-{SEQUENTIAL}
 *
 * Examples:
 * - NOR-2025-001 (CEP Norte, year 2025, first convocation)
 * - SC-2025-012 (CEP Santa Cruz, year 2025, 12th convocation)
 * - SUR-2026-003 (CEP Sur, year 2026, 3rd convocation)
 *
 * Logic:
 * 1. Extract year from start_date
 * 2. Get campus code from campus relationship
 * 3. Find highest sequential number for this campus-year combination
 * 4. Generate new code with next sequential number (padded to 3 digits)
 *
 * Special cases:
 * - If no campus assigned: uses "ONL" (Online)
 * - Code is only generated on create, not on update
 * - If codigo already exists, it's preserved (no regeneration)
 */
export declare const generateCourseRunCode: CollectionBeforeChangeHook;
//# sourceMappingURL=generateCourseRunCode.d.ts.map
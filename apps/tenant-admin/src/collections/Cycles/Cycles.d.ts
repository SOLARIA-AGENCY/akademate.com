import type { CollectionConfig } from 'payload';
/**
 * Cycles Collection
 *
 * Represents educational cycles (FP Básica, Grado Medio, Grado Superior, etc.)
 * that categorize courses offered by CEP Comunicación.
 *
 * Database: PostgreSQL table 'cycles'
 * Access Control:
 * - Read: Public (anonymous users can view cycles)
 * - Create/Update/Delete: Admin and Gestor roles only
 *
 * Key Features:
 * - Auto-slug generation from name if not provided
 * - Unique slug constraint enforced at database level
 * - Order display for sorting in frontend
 * - Level validation (enum)
 * - Timestamps (createdAt, updatedAt)
 * - Zod schema validation for type safety
 */
export declare const Cycles: CollectionConfig;
//# sourceMappingURL=Cycles.d.ts.map
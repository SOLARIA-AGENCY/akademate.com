import type { CollectionConfig } from 'payload';
/**
 * AreasFormativas Collection
 *
 * Represents knowledge areas for course categorization (e.g., Marketing, Development, Design)
 * Used for course code generation and filtering
 *
 * Database: PostgreSQL table 'areas_formativas'
 *
 * Access Control:
 * - Read: Public (anonymous users can view areas)
 * - Create/Update/Delete: Admin and Gestor roles only
 *
 * Key Features:
 * - Unique codigo field (3-4 uppercase letters, e.g., MKT, DEV, DIS)
 * - Color field for UI customization (hex format)
 * - Active/inactive status for soft delete
 * - Used in course code generation: {AREA_CODE}-{TIPO_CODE}-{SEQUENTIAL}
 */
export declare const AreasFormativas: CollectionConfig;
//# sourceMappingURL=AreasFormativas.d.ts.map
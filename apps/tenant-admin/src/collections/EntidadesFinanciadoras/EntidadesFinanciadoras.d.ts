import type { CollectionConfig } from 'payload';
/**
 * EntidadesFinanciadoras Collection
 *
 * Organizations that provide funding for courses (grants, subsidies, scholarships).
 * Examples: FUNDAE, SEPE, FSE, Ministerios, etc.
 *
 * Database: PostgreSQL table 'entidades_financiadoras'
 *
 * Key Features:
 * - Unique codigo for identification
 * - Logo upload to MinIO/S3
 * - Type classification (publica, privada, europea, autonomica)
 * - URL to official website
 *
 * Relationships:
 * - Many-to-Many: EntidadFinanciadora ↔ Courses (via curso_subvenciones)
 *
 * Access Control:
 * - Read: Public (for frontend display)
 * - Create/Update/Delete: Admin, Gestor
 */
export declare const EntidadesFinanciadoras: CollectionConfig;
//# sourceMappingURL=EntidadesFinanciadoras.d.ts.map
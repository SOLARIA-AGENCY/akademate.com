import type { CollectionConfig } from 'payload';
/**
 * Campuses Collection
 *
 * Represents physical locations (campuses) where CEP Comunicación operates
 * and offers courses. Each campus has contact information and location details.
 *
 * Database: PostgreSQL table 'campuses'
 * Access Control:
 * - Read: Public (anonymous users can view campuses)
 * - Create/Update/Delete: Admin and Gestor roles only
 *
 * Key Features:
 * - Auto-slug generation from name if not provided
 * - Unique slug constraint enforced at database level
 * - Email, phone, and postal code validation
 * - Google Maps URL support
 * - Timestamps (createdAt, updatedAt)
 * - Zod schema validation for type safety
 *
 * Validation Rules:
 * - Postal Code: Spanish format (5 digits)
 * - Phone: Spanish format (+34 XXX XXX XXX)
 * - Email: Standard email validation
 * - Maps URL: Valid URL format
 */
export declare const Campuses: CollectionConfig;
//# sourceMappingURL=Campuses.d.ts.map
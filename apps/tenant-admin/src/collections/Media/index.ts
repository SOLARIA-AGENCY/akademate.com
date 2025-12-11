/**
 * Media Collection - Main Export
 *
 * Purpose: File upload management with S3-compatible storage
 *
 * Key Features:
 * - Upload images, videos, documents
 * - S3-compatible object storage (MinIO)
 * - Metadata management (alt text, captions)
 * - Smart image cropping with focal points
 * - Automatic image resizing (thumbnail, card, hero)
 * - Folder-based organization
 *
 * Security:
 * - File type validation (reject executables)
 * - File size validation (max 50MB)
 * - Filename sanitization (prevent path injection)
 * - Folder path sanitization (prevent directory traversal)
 * - created_by immutability (SP-001)
 *
 * Access Control:
 * - Public: Read only
 * - Lectura: Read only
 * - Asesor: Read + upload
 * - Marketing: Read + upload + update own
 * - Gestor: Full CRUD except delete
 * - Admin: Full CRUD
 */

export { Media } from './Media';
export { default } from './Media';

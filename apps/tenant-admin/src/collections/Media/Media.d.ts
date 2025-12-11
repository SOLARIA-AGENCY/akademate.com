import type { CollectionConfig } from 'payload';
/**
 * Media Collection
 *
 * Purpose:
 * - File upload management with S3-compatible storage (MinIO)
 * - Images, videos, documents (PDFs)
 * - Metadata management (alt text, captions, folders)
 * - Smart image cropping with focal points
 *
 * Storage:
 * - S3-compatible object storage (MinIO)
 * - Bucket: cepcomunicacion
 * - Endpoint configured in payload.config.ts
 *
 * Access Control (6-tier RBAC):
 * - Public: Read only (for serving media on website)
 * - Lectura: Read only
 * - Asesor: Read + upload
 * - Marketing: Read + upload + update own
 * - Gestor: Full CRUD except delete
 * - Admin: Full CRUD (including delete)
 *
 * Security Patterns:
 * - SP-001: created_by field immutability (3-layer defense)
 * - SP-004: No file content logging (only metadata)
 * - File type validation: Reject executables
 * - File size validation: Max 50MB
 * - Filename sanitization: Prevent path injection
 * - Folder path sanitization: Prevent directory traversal
 *
 * Fields:
 * - filename: Auto-populated from upload
 * - alt: Required (accessibility, SEO) (3-500 chars)
 * - caption: Optional description (max 1000 chars)
 * - mimeType: Auto-populated (image/*, video/*, application/pdf)
 * - filesize: Auto-populated (max 50MB)
 * - width/height: Auto-populated for images
 * - url: S3 URL (auto-generated)
 * - created_by: Uploader user ID (immutable)
 * - focalX/focalY: Focal point for smart cropping (0-100)
 * - folder: Organization folder (e.g., courses/images)
 *
 * Relationships:
 * - Many-to-One: Media → User (created_by)
 *
 * Usage Examples:
 * - Course images and thumbnails
 * - Blog post featured images
 * - Campaign ad creatives
 * - PDF brochures and documents
 * - Video content
 */
export declare const Media: CollectionConfig;
export default Media;
//# sourceMappingURL=Media.d.ts.map
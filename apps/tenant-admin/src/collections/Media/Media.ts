import type { CollectionConfig } from 'payload';
import {
  canCreateMedia,
  canReadMedia,
  canUpdateMedia,
  canDeleteMedia,
} from './access';
import {
  trackMediaCreator,
  validateMediaFile,
  validateFolder,
} from './hooks';

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

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media File',
    plural: 'Media Files',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'created_by', 'createdAt'],
    description: 'Upload and manage media files (images, videos, documents)',
    group: 'Content',
  },
  upload: {
    // Enable file upload functionality
    // S3 storage configured in payload.config.ts via s3Storage plugin
    staticDir: '../uploads', // Fallback for local development
    mimeTypes: [
      // Images
      'image/*',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime',
      // Documents
      'application/pdf',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        fit: 'cover',
        position: 'center',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        fit: 'cover',
        position: 'center',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        fit: 'cover',
        position: 'center',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  access: {
    create: canCreateMedia,
    read: canReadMedia,
    update: canUpdateMedia,
    delete: canDeleteMedia,
  },
  hooks: {
    beforeChange: [validateMediaFile],
  },
  fields: [
    // ============================================================================
    // UPLOAD FIELDS (Auto-populated by Payload)
    // ============================================================================

    // filename, mimeType, filesize, width, height, url
    // These fields are automatically added by Payload's upload functionality
    // No need to define them explicitly

    // ============================================================================
    // METADATA FIELDS
    // ============================================================================

    {
      name: 'alt',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 500,
      admin: {
        description: 'Descriptive text for accessibility and SEO (3-500 characters)',
        placeholder: 'e.g., Student studying at CEP Formación campus',
      },
      // Validation: Required by WCAG 2.1 for accessibility
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Alt text is required for accessibility (WCAG 2.1)';
        }
        if (value.trim().length < 3) {
          return 'Alt text must be at least 3 characters for meaningful description';
        }
        if (value.length > 500) {
          return 'Alt text must not exceed 500 characters';
        }
        return true;
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      maxLength: 1000,
      admin: {
        description: 'Optional extended description or attribution (max 1000 characters)',
        placeholder: 'e.g., Photo credit: John Doe Photography',
      },
    },

    // ============================================================================
    // ORGANIZATION FIELDS
    // ============================================================================

    {
      name: 'folder',
      type: 'text',
      admin: {
        description: 'Organize files in folders (e.g., courses/images, blog/2025)',
        placeholder: 'e.g., courses/images',
      },
      hooks: {
        beforeChange: [validateFolder],
      },
      // Validation: Lowercase alphanumeric with hyphens and slashes
      validate: (value) => {
        if (!value) return true; // Optional field

        if (!/^[a-z0-9]+([/-][a-z0-9]+)*$/.test(value)) {
          return 'Folder must be lowercase alphanumeric with hyphens/slashes (e.g., courses/images)';
        }

        if (value.includes('..')) {
          return 'Folder cannot contain directory traversal sequences (..)';
        }

        if (value.startsWith('/') || value.endsWith('/')) {
          return 'Folder cannot start or end with slashes';
        }

        return true;
      },
    },

    // ============================================================================
    // IMAGE CROPPING FIELDS
    // ============================================================================

    {
      name: 'focalX',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Focal point X coordinate (0-100%, left to right) for smart cropping',
        placeholder: '50',
      },
      // Validation: 0-100 percentage
      validate: (value) => {
        if (value === undefined || value === null) return true; // Optional

        if (value < 0 || value > 100) {
          return 'Focal X must be between 0 and 100';
        }

        return true;
      },
    },
    {
      name: 'focalY',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Focal point Y coordinate (0-100%, top to bottom) for smart cropping',
        placeholder: '50',
      },
      // Validation: 0-100 percentage
      validate: (value) => {
        if (value === undefined || value === null) return true; // Optional

        if (value < 0 || value > 100) {
          return 'Focal Y must be between 0 and 100';
        }

        return true;
      },
    },

    // ============================================================================
    // TRACKING FIELDS
    // ============================================================================

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true, // Layer 1: UX (prevents UI manipulation)
        description: 'User who uploaded this file (auto-populated, IMMUTABLE)',
      },
      access: {
        read: () => true,
        update: () => false, // Layer 2: API Security (prevents API manipulation)
      },
      hooks: {
        beforeChange: [trackMediaCreator], // Layer 3: Business Logic (prevents hook bypass)
      },
    },
  ],
  timestamps: true, // Adds createdAt and updatedAt
};

export default Media;

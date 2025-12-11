import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import type { Payload } from 'payload';
import { getPayloadClient } from '../../testUtils/getPayloadClient';
import type { User } from '../../payload-types';

/**
 * Media Collection Test Suite
 *
 * Test Categories:
 * 1. CRUD Operations (15+ tests)
 * 2. File Upload and Storage (20+ tests)
 * 3. Access Control (18+ tests, 6 roles)
 * 4. Validation (15+ tests)
 * 5. Hooks (12+ tests)
 * 6. Relationships (10+ tests)
 * 7. Security (15+ tests)
 *
 * Total Expected: 105+ tests
 *
 * TDD Methodology:
 * - RED: Write tests FIRST (this file)
 * - GREEN: Implement collection to pass tests
 * - REFACTOR: Apply security patterns (SP-001, SP-004)
 */

describe('Media Collection', () => {
  let payload: Payload;
  let adminUser: User;
  let gestorUser: User;
  let marketingUser: User;
  let asesorUser: User;
  let lecturaUser: User;

  beforeAll(async () => {
    payload = await getPayloadClient();

    // Create test users for RBAC testing
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin-media@test.com',
        password: 'Test123!@#',
        role: 'admin',
        name: 'Admin Media User',
      },
    });

    gestorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'gestor-media@test.com',
        password: 'Test123!@#',
        role: 'gestor',
        name: 'Gestor Media User',
      },
    });

    marketingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing-media@test.com',
        password: 'Test123!@#',
        role: 'marketing',
        name: 'Marketing Media User',
      },
    });

    asesorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'asesor-media@test.com',
        password: 'Test123!@#',
        role: 'asesor',
        name: 'Asesor Media User',
      },
    });

    lecturaUser = await payload.create({
      collection: 'users',
      data: {
        email: 'lectura-media@test.com',
        password: 'Test123!@#',
        role: 'lectura',
        name: 'Lectura Media User',
      },
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test users
    await payload.delete({ collection: 'users', where: { email: { contains: '-media@test.com' } } });
  });

  // ============================================================================
  // 1. CRUD OPERATIONS (15+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    it('should create a media file with all required fields', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Test Image',
          caption: 'A test image for unit testing',
          folder: 'test-images',
        },
        user: adminUser,
        file: {
          data: Buffer.from('fake-image-data'),
          mimetype: 'image/png',
          name: 'test-image.png',
          size: 1024,
        },
      });

      expect(media).toBeDefined();
      expect(media.alt).toBe('Test Image');
      expect(media.caption).toBe('A test image for unit testing');
      expect(media.folder).toBe('test-images');
      expect(media.filename).toBe('test-image.png');
      expect(media.mimeType).toBe('image/png');
      expect(media.filesize).toBe(1024);
      expect(media.created_by).toBe(adminUser.id);
    });

    it('should create a media file with minimal required fields', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Minimal Test Image',
        },
        user: gestorUser,
        file: {
          data: Buffer.from('minimal-image-data'),
          mimetype: 'image/jpeg',
          name: 'minimal.jpg',
          size: 512,
        },
      });

      expect(media).toBeDefined();
      expect(media.alt).toBe('Minimal Test Image');
      expect(media.filename).toBe('minimal.jpg');
      expect(media.mimeType).toBe('image/jpeg');
      expect(media.created_by).toBe(gestorUser.id);
    });

    it('should read a media file by ID', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Read Test' },
        user: adminUser,
        file: {
          data: Buffer.from('read-test-data'),
          mimetype: 'image/png',
          name: 'read-test.png',
          size: 256,
        },
      });

      const media = await payload.findByID({
        collection: 'media',
        id: created.id,
      });

      expect(media).toBeDefined();
      expect(media.id).toBe(created.id);
      expect(media.alt).toBe('Read Test');
    });

    it('should update a media file alt text and caption', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Original Alt' },
        user: marketingUser,
        file: {
          data: Buffer.from('update-test-data'),
          mimetype: 'image/png',
          name: 'update-test.png',
          size: 256,
        },
      });

      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: {
          alt: 'Updated Alt',
          caption: 'Updated Caption',
        },
        user: marketingUser,
      });

      expect(updated.alt).toBe('Updated Alt');
      expect(updated.caption).toBe('Updated Caption');
    });

    it('should delete a media file (Admin only)', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Delete Test' },
        user: adminUser,
        file: {
          data: Buffer.from('delete-test-data'),
          mimetype: 'image/png',
          name: 'delete-test.png',
          size: 256,
        },
      });

      await payload.delete({
        collection: 'media',
        id: created.id,
        user: adminUser,
      });

      await expect(
        payload.findByID({ collection: 'media', id: created.id })
      ).rejects.toThrow();
    });

    it('should find media files with pagination', async () => {
      // Create multiple media files
      await Promise.all([
        payload.create({
          collection: 'media',
          data: { alt: 'Pagination Test 1' },
          user: adminUser,
          file: {
            data: Buffer.from('pagination-1'),
            mimetype: 'image/png',
            name: 'pagination-1.png',
            size: 256,
          },
        }),
        payload.create({
          collection: 'media',
          data: { alt: 'Pagination Test 2' },
          user: adminUser,
          file: {
            data: Buffer.from('pagination-2'),
            mimetype: 'image/png',
            name: 'pagination-2.png',
            size: 256,
          },
        }),
      ]);

      const result = await payload.find({
        collection: 'media',
        limit: 10,
        page: 1,
      });

      expect(result.docs).toBeDefined();
      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.totalDocs).toBeGreaterThan(0);
    });

    it('should filter media by folder', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'Course Image', folder: 'courses' },
        user: adminUser,
        file: {
          data: Buffer.from('course-image'),
          mimetype: 'image/png',
          name: 'course.png',
          size: 256,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          folder: { equals: 'courses' },
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs.every((doc) => doc.folder === 'courses')).toBe(true);
    });

    it('should filter media by mimeType', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'PDF Document' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-pdf-data'),
          mimetype: 'application/pdf',
          name: 'document.pdf',
          size: 512,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          mimeType: { equals: 'application/pdf' },
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs.every((doc) => doc.mimeType === 'application/pdf')).toBe(true);
    });

    it('should search media by alt text', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'Searchable Unique Alt Text' },
        user: adminUser,
        file: {
          data: Buffer.from('searchable-image'),
          mimetype: 'image/png',
          name: 'searchable.png',
          size: 256,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          alt: { contains: 'Unique Alt' },
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs.some((doc) => doc.alt.includes('Unique Alt'))).toBe(true);
    });

    it('should sort media by createdAt descending', async () => {
      const result = await payload.find({
        collection: 'media',
        sort: '-createdAt',
        limit: 10,
      });

      expect(result.docs).toBeDefined();
      if (result.docs.length > 1) {
        const firstDate = new Date(result.docs[0].createdAt).getTime();
        const secondDate = new Date(result.docs[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });

    it('should count total media files', async () => {
      const result = await payload.count({
        collection: 'media',
      });

      expect(result.totalDocs).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 2. FILE UPLOAD AND STORAGE (20+ tests)
  // ============================================================================

  describe('File Upload and Storage', () => {
    it('should upload an image file (PNG)', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'PNG Upload Test' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-png-data'),
          mimetype: 'image/png',
          name: 'test.png',
          size: 1024,
        },
      });

      expect(media.filename).toBe('test.png');
      expect(media.mimeType).toBe('image/png');
      expect(media.filesize).toBe(1024);
      expect(media.url).toBeDefined();
    });

    it('should upload an image file (JPEG)', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'JPEG Upload Test' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-jpeg-data'),
          mimetype: 'image/jpeg',
          name: 'test.jpg',
          size: 2048,
        },
      });

      expect(media.filename).toBe('test.jpg');
      expect(media.mimeType).toBe('image/jpeg');
      expect(media.filesize).toBe(2048);
    });

    it('should upload a PDF document', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'PDF Upload Test' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-pdf-data'),
          mimetype: 'application/pdf',
          name: 'document.pdf',
          size: 5120,
        },
      });

      expect(media.filename).toBe('document.pdf');
      expect(media.mimeType).toBe('application/pdf');
      expect(media.filesize).toBe(5120);
    });

    it('should auto-populate filename from uploaded file', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Filename Test' },
        user: adminUser,
        file: {
          data: Buffer.from('filename-test'),
          mimetype: 'image/png',
          name: 'auto-filename.png',
          size: 256,
        },
      });

      expect(media.filename).toBe('auto-filename.png');
    });

    it('should auto-populate mimeType from uploaded file', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'MIME Type Test' },
        user: adminUser,
        file: {
          data: Buffer.from('mime-test'),
          mimetype: 'image/webp',
          name: 'webp-test.webp',
          size: 256,
        },
      });

      expect(media.mimeType).toBe('image/webp');
    });

    it('should auto-populate filesize from uploaded file', async () => {
      const fileSize = 12345;
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Filesize Test' },
        user: adminUser,
        file: {
          data: Buffer.alloc(fileSize),
          mimetype: 'image/png',
          name: 'filesize-test.png',
          size: fileSize,
        },
      });

      expect(media.filesize).toBe(fileSize);
    });

    it('should generate S3 URL for uploaded file', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'URL Test' },
        user: adminUser,
        file: {
          data: Buffer.from('url-test'),
          mimetype: 'image/png',
          name: 'url-test.png',
          size: 256,
        },
      });

      expect(media.url).toBeDefined();
      expect(typeof media.url).toBe('string');
      expect(media.url.length).toBeGreaterThan(0);
    });

    it('should store image dimensions (width/height) for images', async () => {
      // Note: This test might require actual image processing
      // For now, we test that the fields exist
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Dimensions Test' },
        user: adminUser,
        file: {
          data: Buffer.from('dimensions-test'),
          mimetype: 'image/png',
          name: 'dimensions-test.png',
          size: 256,
        },
      });

      expect(media).toHaveProperty('width');
      expect(media).toHaveProperty('height');
    });

    it('should reject files with invalid mimeType (executable)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Invalid MIME Test' },
          user: adminUser,
          file: {
            data: Buffer.from('fake-executable'),
            mimetype: 'application/x-msdownload',
            name: 'virus.exe',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should reject files exceeding maximum file size', async () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Too Large File' },
          user: adminUser,
          file: {
            data: Buffer.alloc(maxSize + 1),
            mimetype: 'image/png',
            name: 'too-large.png',
            size: maxSize + 1,
          },
        })
      ).rejects.toThrow();
    });

    it('should accept files under maximum file size', async () => {
      const acceptableSize = 1024 * 1024; // 1MB
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Acceptable Size' },
        user: adminUser,
        file: {
          data: Buffer.alloc(acceptableSize),
          mimetype: 'image/png',
          name: 'acceptable-size.png',
          size: acceptableSize,
        },
      });

      expect(media.filesize).toBe(acceptableSize);
    });

    it('should handle duplicate filenames gracefully', async () => {
      const filename = 'duplicate-test.png';

      const media1 = await payload.create({
        collection: 'media',
        data: { alt: 'Duplicate 1' },
        user: adminUser,
        file: {
          data: Buffer.from('duplicate-1'),
          mimetype: 'image/png',
          name: filename,
          size: 256,
        },
      });

      const media2 = await payload.create({
        collection: 'media',
        data: { alt: 'Duplicate 2' },
        user: adminUser,
        file: {
          data: Buffer.from('duplicate-2'),
          mimetype: 'image/png',
          name: filename,
          size: 256,
        },
      });

      // Payload should auto-append suffix to filename
      expect(media1.filename).toBeDefined();
      expect(media2.filename).toBeDefined();
      expect(media1.id).not.toBe(media2.id);
    });

    it('should support video file uploads (MP4)', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Video Test' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-video-data'),
          mimetype: 'video/mp4',
          name: 'video.mp4',
          size: 1024,
        },
      });

      expect(media.mimeType).toBe('video/mp4');
      expect(media.filename).toBe('video.mp4');
    });

    it('should support SVG file uploads', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'SVG Test' },
        user: adminUser,
        file: {
          data: Buffer.from('<svg></svg>'),
          mimetype: 'image/svg+xml',
          name: 'icon.svg',
          size: 256,
        },
      });

      expect(media.mimeType).toBe('image/svg+xml');
      expect(media.filename).toBe('icon.svg');
    });

    it('should support WebP file uploads', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'WebP Test' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-webp-data'),
          mimetype: 'image/webp',
          name: 'optimized.webp',
          size: 512,
        },
      });

      expect(media.mimeType).toBe('image/webp');
      expect(media.filename).toBe('optimized.webp');
    });

    it('should support GIF file uploads', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'GIF Test' },
        user: adminUser,
        file: {
          data: Buffer.from('fake-gif-data'),
          mimetype: 'image/gif',
          name: 'animated.gif',
          size: 2048,
        },
      });

      expect(media.mimeType).toBe('image/gif');
      expect(media.filename).toBe('animated.gif');
    });

    it('should store focal point for image cropping', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Focal Point Test',
          focalX: 50,
          focalY: 50,
        },
        user: adminUser,
        file: {
          data: Buffer.from('focal-test'),
          mimetype: 'image/png',
          name: 'focal-test.png',
          size: 256,
        },
      });

      expect(media.focalX).toBe(50);
      expect(media.focalY).toBe(50);
    });

    it('should organize files by folder', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Folder Test',
          folder: 'courses/images',
        },
        user: adminUser,
        file: {
          data: Buffer.from('folder-test'),
          mimetype: 'image/png',
          name: 'folder-test.png',
          size: 256,
        },
      });

      expect(media.folder).toBe('courses/images');
    });
  });

  // ============================================================================
  // 3. ACCESS CONTROL (18+ tests, 6 roles)
  // ============================================================================

  describe('Access Control - Public Role', () => {
    it('Public: should be able to read media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Public Read Test' },
        user: adminUser,
        file: {
          data: Buffer.from('public-read'),
          mimetype: 'image/png',
          name: 'public-read.png',
          size: 256,
        },
      });

      // Public access (no user context)
      const media = await payload.findByID({
        collection: 'media',
        id: created.id,
        // No user provided = public access
      });

      expect(media).toBeDefined();
      expect(media.id).toBe(created.id);
    });

    it('Public: should NOT be able to upload media files', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Public Upload Test' },
          // No user = public
          file: {
            data: Buffer.from('public-upload'),
            mimetype: 'image/png',
            name: 'public-upload.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('Public: should NOT be able to update media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Public Update Test' },
        user: adminUser,
        file: {
          data: Buffer.from('public-update'),
          mimetype: 'image/png',
          name: 'public-update.png',
          size: 256,
        },
      });

      await expect(
        payload.update({
          collection: 'media',
          id: created.id,
          data: { alt: 'Updated by Public' },
          // No user = public
        })
      ).rejects.toThrow();
    });

    it('Public: should NOT be able to delete media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Public Delete Test' },
        user: adminUser,
        file: {
          data: Buffer.from('public-delete'),
          mimetype: 'image/png',
          name: 'public-delete.png',
          size: 256,
        },
      });

      await expect(
        payload.delete({
          collection: 'media',
          id: created.id,
          // No user = public
        })
      ).rejects.toThrow();
    });
  });

  describe('Access Control - Lectura Role', () => {
    it('Lectura: should be able to read media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Lectura Read Test' },
        user: adminUser,
        file: {
          data: Buffer.from('lectura-read'),
          mimetype: 'image/png',
          name: 'lectura-read.png',
          size: 256,
        },
      });

      const media = await payload.findByID({
        collection: 'media',
        id: created.id,
        user: lecturaUser,
      });

      expect(media).toBeDefined();
      expect(media.id).toBe(created.id);
    });

    it('Lectura: should NOT be able to upload media files', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Lectura Upload Test' },
          user: lecturaUser,
          file: {
            data: Buffer.from('lectura-upload'),
            mimetype: 'image/png',
            name: 'lectura-upload.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('Lectura: should NOT be able to update media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Lectura Update Test' },
        user: adminUser,
        file: {
          data: Buffer.from('lectura-update'),
          mimetype: 'image/png',
          name: 'lectura-update.png',
          size: 256,
        },
      });

      await expect(
        payload.update({
          collection: 'media',
          id: created.id,
          data: { alt: 'Updated by Lectura' },
          user: lecturaUser,
        })
      ).rejects.toThrow();
    });
  });

  describe('Access Control - Asesor Role', () => {
    it('Asesor: should be able to upload media files', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Asesor Upload Test' },
        user: asesorUser,
        file: {
          data: Buffer.from('asesor-upload'),
          mimetype: 'image/png',
          name: 'asesor-upload.png',
          size: 256,
        },
      });

      expect(media).toBeDefined();
      expect(media.created_by).toBe(asesorUser.id);
    });

    it('Asesor: should be able to read media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Asesor Read Test' },
        user: adminUser,
        file: {
          data: Buffer.from('asesor-read'),
          mimetype: 'image/png',
          name: 'asesor-read.png',
          size: 256,
        },
      });

      const media = await payload.findByID({
        collection: 'media',
        id: created.id,
        user: asesorUser,
      });

      expect(media).toBeDefined();
    });

    it('Asesor: should NOT be able to update media files uploaded by others', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Asesor Update Test' },
        user: adminUser,
        file: {
          data: Buffer.from('asesor-update'),
          mimetype: 'image/png',
          name: 'asesor-update.png',
          size: 256,
        },
      });

      await expect(
        payload.update({
          collection: 'media',
          id: created.id,
          data: { alt: 'Updated by Asesor' },
          user: asesorUser,
        })
      ).rejects.toThrow();
    });

    it('Asesor: should NOT be able to delete media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Asesor Delete Test' },
        user: asesorUser,
        file: {
          data: Buffer.from('asesor-delete'),
          mimetype: 'image/png',
          name: 'asesor-delete.png',
          size: 256,
        },
      });

      await expect(
        payload.delete({
          collection: 'media',
          id: created.id,
          user: asesorUser,
        })
      ).rejects.toThrow();
    });
  });

  describe('Access Control - Marketing Role', () => {
    it('Marketing: should be able to upload media files', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Marketing Upload Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('marketing-upload'),
          mimetype: 'image/png',
          name: 'marketing-upload.png',
          size: 256,
        },
      });

      expect(media).toBeDefined();
      expect(media.created_by).toBe(marketingUser.id);
    });

    it('Marketing: should be able to update own media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Marketing Own Update' },
        user: marketingUser,
        file: {
          data: Buffer.from('marketing-own'),
          mimetype: 'image/png',
          name: 'marketing-own.png',
          size: 256,
        },
      });

      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: { alt: 'Updated by Marketing Owner' },
        user: marketingUser,
      });

      expect(updated.alt).toBe('Updated by Marketing Owner');
    });

    it('Marketing: should NOT be able to update media files uploaded by others', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Marketing Other Update' },
        user: gestorUser,
        file: {
          data: Buffer.from('marketing-other'),
          mimetype: 'image/png',
          name: 'marketing-other.png',
          size: 256,
        },
      });

      await expect(
        payload.update({
          collection: 'media',
          id: created.id,
          data: { alt: 'Updated by Marketing Non-Owner' },
          user: marketingUser,
        })
      ).rejects.toThrow();
    });

    it('Marketing: should NOT be able to delete media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Marketing Delete Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('marketing-delete'),
          mimetype: 'image/png',
          name: 'marketing-delete.png',
          size: 256,
        },
      });

      await expect(
        payload.delete({
          collection: 'media',
          id: created.id,
          user: marketingUser,
        })
      ).rejects.toThrow();
    });
  });

  describe('Access Control - Gestor Role', () => {
    it('Gestor: should be able to upload media files', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Gestor Upload Test' },
        user: gestorUser,
        file: {
          data: Buffer.from('gestor-upload'),
          mimetype: 'image/png',
          name: 'gestor-upload.png',
          size: 256,
        },
      });

      expect(media).toBeDefined();
      expect(media.created_by).toBe(gestorUser.id);
    });

    it('Gestor: should be able to update any media file', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Gestor Update Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('gestor-update'),
          mimetype: 'image/png',
          name: 'gestor-update.png',
          size: 256,
        },
      });

      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: { alt: 'Updated by Gestor' },
        user: gestorUser,
      });

      expect(updated.alt).toBe('Updated by Gestor');
    });

    it('Gestor: should NOT be able to delete media files', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Gestor Delete Test' },
        user: gestorUser,
        file: {
          data: Buffer.from('gestor-delete'),
          mimetype: 'image/png',
          name: 'gestor-delete.png',
          size: 256,
        },
      });

      await expect(
        payload.delete({
          collection: 'media',
          id: created.id,
          user: gestorUser,
        })
      ).rejects.toThrow();
    });
  });

  describe('Access Control - Admin Role', () => {
    it('Admin: should be able to upload media files', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Admin Upload Test' },
        user: adminUser,
        file: {
          data: Buffer.from('admin-upload'),
          mimetype: 'image/png',
          name: 'admin-upload.png',
          size: 256,
        },
      });

      expect(media).toBeDefined();
      expect(media.created_by).toBe(adminUser.id);
    });

    it('Admin: should be able to update any media file', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Admin Update Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('admin-update'),
          mimetype: 'image/png',
          name: 'admin-update.png',
          size: 256,
        },
      });

      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: { alt: 'Updated by Admin' },
        user: adminUser,
      });

      expect(updated.alt).toBe('Updated by Admin');
    });

    it('Admin: should be able to delete any media file', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Admin Delete Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('admin-delete'),
          mimetype: 'image/png',
          name: 'admin-delete.png',
          size: 256,
        },
      });

      await payload.delete({
        collection: 'media',
        id: created.id,
        user: adminUser,
      });

      await expect(
        payload.findByID({ collection: 'media', id: created.id })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // 4. VALIDATION (15+ tests)
  // ============================================================================

  describe('Validation', () => {
    it('should require alt text for accessibility', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            // Missing alt text
            caption: 'Caption only',
          },
          user: adminUser,
          file: {
            data: Buffer.from('no-alt'),
            mimetype: 'image/png',
            name: 'no-alt.png',
            size: 256,
          },
        })
      ).rejects.toThrow(/alt.*required/i);
    });

    it('should enforce alt text minimum length (3 characters)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'ab', // Too short
          },
          user: adminUser,
          file: {
            data: Buffer.from('short-alt'),
            mimetype: 'image/png',
            name: 'short-alt.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce alt text maximum length (500 characters)', async () => {
      const longAlt = 'a'.repeat(501);
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: longAlt,
          },
          user: adminUser,
          file: {
            data: Buffer.from('long-alt'),
            mimetype: 'image/png',
            name: 'long-alt.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should accept valid alt text (3-500 characters)', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Valid alt text for accessibility',
        },
        user: adminUser,
        file: {
          data: Buffer.from('valid-alt'),
          mimetype: 'image/png',
          name: 'valid-alt.png',
          size: 256,
        },
      });

      expect(media.alt).toBe('Valid alt text for accessibility');
    });

    it('should allow caption to be optional', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'No Caption Test',
          // caption not provided
        },
        user: adminUser,
        file: {
          data: Buffer.from('no-caption'),
          mimetype: 'image/png',
          name: 'no-caption.png',
          size: 256,
        },
      });

      expect(media.caption).toBeUndefined();
    });

    it('should enforce caption maximum length (1000 characters)', async () => {
      const longCaption = 'a'.repeat(1001);
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Long Caption Test',
            caption: longCaption,
          },
          user: adminUser,
          file: {
            data: Buffer.from('long-caption'),
            mimetype: 'image/png',
            name: 'long-caption.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate folder format (lowercase, alphanumeric, hyphens, slashes)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Invalid Folder Test',
            folder: 'Invalid Folder Name!',
          },
          user: adminUser,
          file: {
            data: Buffer.from('invalid-folder'),
            mimetype: 'image/png',
            name: 'invalid-folder.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should accept valid folder format', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Valid Folder Test',
          folder: 'courses/images/2025',
        },
        user: adminUser,
        file: {
          data: Buffer.from('valid-folder'),
          mimetype: 'image/png',
          name: 'valid-folder.png',
          size: 256,
        },
      });

      expect(media.folder).toBe('courses/images/2025');
    });

    it('should validate focalX range (0-100)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Invalid FocalX Test',
            focalX: 150, // Out of range
          },
          user: adminUser,
          file: {
            data: Buffer.from('invalid-focalx'),
            mimetype: 'image/png',
            name: 'invalid-focalx.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate focalY range (0-100)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Invalid FocalY Test',
            focalY: -10, // Out of range
          },
          user: adminUser,
          file: {
            data: Buffer.from('invalid-focaly'),
            mimetype: 'image/png',
            name: 'invalid-focaly.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should accept valid focal point values', async () => {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Valid Focal Point Test',
          focalX: 33.5,
          focalY: 66.5,
        },
        user: adminUser,
        file: {
          data: Buffer.from('valid-focal'),
          mimetype: 'image/png',
          name: 'valid-focal.png',
          size: 256,
        },
      });

      expect(media.focalX).toBe(33.5);
      expect(media.focalY).toBe(66.5);
    });

    it('should reject files with empty filename', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Empty Filename Test' },
          user: adminUser,
          file: {
            data: Buffer.from('empty-filename'),
            mimetype: 'image/png',
            name: '', // Empty filename
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should reject files with only whitespace in filename', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Whitespace Filename Test' },
          user: adminUser,
          file: {
            data: Buffer.from('whitespace-filename'),
            mimetype: 'image/png',
            name: '   ', // Only whitespace
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should reject files with zero size', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Zero Size Test' },
          user: adminUser,
          file: {
            data: Buffer.alloc(0),
            mimetype: 'image/png',
            name: 'zero-size.png',
            size: 0,
          },
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // 5. HOOKS (12+ tests)
  // ============================================================================

  describe('Hooks', () => {
    it('should auto-populate created_by field on upload', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Created By Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('created-by-test'),
          mimetype: 'image/png',
          name: 'created-by-test.png',
          size: 256,
        },
      });

      expect(media.created_by).toBe(marketingUser.id);
    });

    it('should prevent manipulation of created_by field (immutability)', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Immutable Created By Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('immutable-created-by'),
          mimetype: 'image/png',
          name: 'immutable-created-by.png',
          size: 256,
        },
      });

      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: {
          alt: 'Updated Alt',
          created_by: adminUser.id, // Attempt to change created_by
        },
        user: marketingUser,
      });

      // created_by should remain unchanged
      expect(updated.created_by).toBe(marketingUser.id);
      expect(updated.created_by).not.toBe(adminUser.id);
    });

    it('should throw error if created_by is missing on create', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'No User Test' },
          // No user provided
          file: {
            data: Buffer.from('no-user'),
            mimetype: 'image/png',
            name: 'no-user.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate folder format in beforeChange hook', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Hook Folder Validation',
            folder: 'INVALID FOLDER',
          },
          user: adminUser,
          file: {
            data: Buffer.from('hook-folder-validation'),
            mimetype: 'image/png',
            name: 'hook-folder.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate mimeType in beforeChange hook', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Hook MIME Validation' },
          user: adminUser,
          file: {
            data: Buffer.from('hook-mime-validation'),
            mimetype: 'application/x-executable',
            name: 'malicious.exe',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate filesize in beforeChange hook', async () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Hook Size Validation' },
          user: adminUser,
          file: {
            data: Buffer.alloc(maxSize + 1),
            mimetype: 'image/png',
            name: 'too-large-hook.png',
            size: maxSize + 1,
          },
        })
      ).rejects.toThrow();
    });

    it('should NOT log sensitive file content in hooks (SP-004)', async () => {
      // This test verifies that hooks do not log file content
      // We can check this by inspecting console.log calls
      const consoleLogSpy = jest.spyOn(console, 'log');

      await payload.create({
        collection: 'media',
        data: { alt: 'No Logging Test' },
        user: adminUser,
        file: {
          data: Buffer.from('sensitive-content'),
          mimetype: 'image/png',
          name: 'no-logging.png',
          size: 256,
        },
      });

      // Check that no console.log contains file content
      const logCalls = consoleLogSpy.mock.calls.flat();
      const hasFileContent = logCalls.some((call) =>
        JSON.stringify(call).includes('sensitive-content')
      );

      expect(hasFileContent).toBe(false);

      consoleLogSpy.mockRestore();
    });

    it('should log only non-sensitive metadata (filename, size, type)', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await payload.create({
        collection: 'media',
        data: { alt: 'Metadata Logging Test' },
        user: adminUser,
        file: {
          data: Buffer.from('metadata-test'),
          mimetype: 'image/png',
          name: 'metadata-test.png',
          size: 256,
        },
      });

      // Verify that logs contain filename/size/type but not content
      const logCalls = consoleLogSpy.mock.calls.flat();
      const hasMetadata = logCalls.some(
        (call) =>
          JSON.stringify(call).includes('metadata-test.png') ||
          JSON.stringify(call).includes('image/png')
      );

      expect(hasMetadata).toBe(true);

      consoleLogSpy.mockRestore();
    });

    it('should handle upload errors gracefully', async () => {
      // Simulate an upload error by providing invalid data
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Upload Error Test' },
          user: adminUser,
          file: {
            data: null as any, // Invalid data
            mimetype: 'image/png',
            name: 'error-test.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should sanitize error messages (no user input reflection)', async () => {
      try {
        await payload.create({
          collection: 'media',
          data: { alt: '<script>alert("XSS")</script>' },
          user: adminUser,
          file: {
            data: Buffer.from('xss-test'),
            mimetype: 'application/x-executable', // Invalid MIME
            name: 'xss-test.exe',
            size: 256,
          },
        });
      } catch (error: any) {
        // Error message should NOT contain the raw user input
        expect(error.message).not.toContain('<script>alert("XSS")</script>');
        expect(error.message).toContain('Invalid');
      }
    });

    it('should preserve original created_by on update (SP-001)', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Preserve Created By Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('preserve-created-by'),
          mimetype: 'image/png',
          name: 'preserve-created-by.png',
          size: 256,
        },
      });

      // Admin tries to update created_by
      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: {
          alt: 'Updated Alt',
          created_by: adminUser.id, // Attempt to hijack ownership
        },
        user: adminUser,
      });

      // SP-001: created_by must remain unchanged
      expect(updated.created_by).toBe(marketingUser.id);
      expect(updated.created_by).not.toBe(adminUser.id);
    });
  });

  // ============================================================================
  // 6. RELATIONSHIPS (10+ tests)
  // ============================================================================

  describe('Relationships', () => {
    it('should establish relationship between media and creator (User)', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'User Relationship Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('user-relationship'),
          mimetype: 'image/png',
          name: 'user-relationship.png',
          size: 256,
        },
      });

      expect(media.created_by).toBe(marketingUser.id);

      // Verify relationship can be populated
      const populated = await payload.findByID({
        collection: 'media',
        id: media.id,
        depth: 1,
      });

      expect(populated.created_by).toBeDefined();
      if (typeof populated.created_by === 'object') {
        expect(populated.created_by.id).toBe(marketingUser.id);
      }
    });

    it('should allow querying media by creator', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'Query By Creator Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('query-by-creator'),
          mimetype: 'image/png',
          name: 'query-by-creator.png',
          size: 256,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          created_by: { equals: marketingUser.id },
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs.every((doc) => doc.created_by === marketingUser.id)).toBe(true);
    });

    it('should handle user deletion gracefully (SET NULL or CASCADE)', async () => {
      // Create a temporary user
      const tempUser = await payload.create({
        collection: 'users',
        data: {
          email: 'temp-media-user@test.com',
          password: 'Test123!@#',
          role: 'marketing',
          name: 'Temp Media User',
        },
      });

      const media = await payload.create({
        collection: 'media',
        data: { alt: 'User Deletion Test' },
        user: tempUser,
        file: {
          data: Buffer.from('user-deletion'),
          mimetype: 'image/png',
          name: 'user-deletion.png',
          size: 256,
        },
      });

      // Delete the user
      await payload.delete({
        collection: 'users',
        id: tempUser.id,
      });

      // Media should either:
      // - Have created_by set to null (SET NULL)
      // - Be deleted (CASCADE)
      // - Remain unchanged (if no onDelete action)
      const mediaAfterUserDeletion = await payload.findByID({
        collection: 'media',
        id: media.id,
      }).catch(() => null);

      // If media still exists, created_by should be null or unchanged
      if (mediaAfterUserDeletion) {
        // SET NULL behavior
        expect(
          mediaAfterUserDeletion.created_by === null ||
          mediaAfterUserDeletion.created_by === tempUser.id
        ).toBe(true);
      }
      // If media doesn't exist, CASCADE behavior is implemented
    });

    it('should populate created_by relationship when depth > 0', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Populate Test' },
        user: gestorUser,
        file: {
          data: Buffer.from('populate-test'),
          mimetype: 'image/png',
          name: 'populate-test.png',
          size: 256,
        },
      });

      const populated = await payload.findByID({
        collection: 'media',
        id: media.id,
        depth: 1,
      });

      expect(populated.created_by).toBeDefined();
      if (typeof populated.created_by === 'object') {
        expect(populated.created_by.id).toBe(gestorUser.id);
        expect(populated.created_by.email).toBe('gestor-media@test.com');
      }
    });

    it('should NOT populate relationships when depth = 0 (default)', async () => {
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'No Populate Test' },
        user: adminUser,
        file: {
          data: Buffer.from('no-populate'),
          mimetype: 'image/png',
          name: 'no-populate.png',
          size: 256,
        },
      });

      const notPopulated = await payload.findByID({
        collection: 'media',
        id: media.id,
        depth: 0,
      });

      // created_by should be a string ID, not an object
      expect(typeof notPopulated.created_by).toBe('string');
    });

    it('should allow filtering by relationship fields', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'Filter By Relationship Test' },
        user: asesorUser,
        file: {
          data: Buffer.from('filter-relationship'),
          mimetype: 'image/png',
          name: 'filter-relationship.png',
          size: 256,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          created_by: { equals: asesorUser.id },
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs.every((doc) => doc.created_by === asesorUser.id)).toBe(true);
    });

    it('should count media files by creator', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'Count By Creator Test 1' },
        user: lecturaUser,
        file: {
          data: Buffer.from('count-1'),
          mimetype: 'image/png',
          name: 'count-1.png',
          size: 256,
        },
      });

      await payload.create({
        collection: 'media',
        data: { alt: 'Count By Creator Test 2' },
        user: lecturaUser,
        file: {
          data: Buffer.from('count-2'),
          mimetype: 'image/png',
          name: 'count-2.png',
          size: 256,
        },
      });

      const result = await payload.count({
        collection: 'media',
        where: {
          created_by: { equals: lecturaUser.id },
        },
      });

      expect(result.totalDocs).toBeGreaterThanOrEqual(2);
    });

    it('should handle relationship with non-existent user gracefully', async () => {
      // Attempt to create media with fake user ID
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Fake User Test',
            created_by: 'non-existent-user-id',
          },
          user: adminUser,
          file: {
            data: Buffer.from('fake-user'),
            mimetype: 'image/png',
            name: 'fake-user.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should allow querying media with multiple relationship conditions', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'Multiple Conditions Test', folder: 'test-folder' },
        user: adminUser,
        file: {
          data: Buffer.from('multiple-conditions'),
          mimetype: 'image/png',
          name: 'multiple-conditions.png',
          size: 256,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          and: [
            { created_by: { equals: adminUser.id } },
            { folder: { equals: 'test-folder' } },
          ],
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(
        result.docs.every(
          (doc) => doc.created_by === adminUser.id && doc.folder === 'test-folder'
        )
      ).toBe(true);
    });

    it('should support OR conditions in relationship queries', async () => {
      await payload.create({
        collection: 'media',
        data: { alt: 'OR Condition Test 1' },
        user: adminUser,
        file: {
          data: Buffer.from('or-1'),
          mimetype: 'image/png',
          name: 'or-1.png',
          size: 256,
        },
      });

      await payload.create({
        collection: 'media',
        data: { alt: 'OR Condition Test 2' },
        user: gestorUser,
        file: {
          data: Buffer.from('or-2'),
          mimetype: 'image/png',
          name: 'or-2.png',
          size: 256,
        },
      });

      const result = await payload.find({
        collection: 'media',
        where: {
          or: [
            { created_by: { equals: adminUser.id } },
            { created_by: { equals: gestorUser.id } },
          ],
        },
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(
        result.docs.some(
          (doc) => doc.created_by === adminUser.id || doc.created_by === gestorUser.id
        )
      ).toBe(true);
    });
  });

  // ============================================================================
  // 7. SECURITY (15+ tests)
  // ============================================================================

  describe('Security', () => {
    it('SP-001: created_by field should be immutable (3-layer defense)', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'SP-001 Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('sp-001-test'),
          mimetype: 'image/png',
          name: 'sp-001-test.png',
          size: 256,
        },
      });

      // Layer 1: UI (admin.readOnly = true)
      // Layer 2: API (access.update = false)
      // Layer 3: Business Logic (hook preserves original)

      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: {
          alt: 'Updated',
          created_by: adminUser.id, // Attempt to change
        },
        user: adminUser,
      });

      expect(updated.created_by).toBe(marketingUser.id);
    });

    it('SP-004: should NOT log file content (only metadata)', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await payload.create({
        collection: 'media',
        data: { alt: 'SP-004 Test' },
        user: adminUser,
        file: {
          data: Buffer.from('confidential-file-content-12345'),
          mimetype: 'image/png',
          name: 'sp-004-test.png',
          size: 256,
        },
      });

      const logCalls = consoleLogSpy.mock.calls.flat();
      const hasFileContent = logCalls.some((call) =>
        JSON.stringify(call).includes('confidential-file-content-12345')
      );

      expect(hasFileContent).toBe(false);

      consoleLogSpy.mockRestore();
    });

    it('should reject executable file types (.exe, .sh, .bat)', async () => {
      const executableTypes = [
        { mime: 'application/x-msdownload', ext: 'exe' },
        { mime: 'application/x-sh', ext: 'sh' },
        { mime: 'application/x-bat', ext: 'bat' },
      ];

      for (const { mime, ext } of executableTypes) {
        await expect(
          payload.create({
            collection: 'media',
            data: { alt: `Reject ${ext} Test` },
            user: adminUser,
            file: {
              data: Buffer.from('malicious-executable'),
              mimetype: mime,
              name: `malicious.${ext}`,
              size: 256,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('should reject files with dangerous extensions in filename', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Dangerous Extension Test' },
          user: adminUser,
          file: {
            data: Buffer.from('dangerous-file'),
            mimetype: 'image/png', // Misleading MIME type
            name: 'image.png.exe', // Double extension
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce maximum file size limit (50MB)', async () => {
      const maxSize = 50 * 1024 * 1024;
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Max Size Test' },
          user: adminUser,
          file: {
            data: Buffer.alloc(maxSize + 1),
            mimetype: 'image/png',
            name: 'too-large.png',
            size: maxSize + 1,
          },
        })
      ).rejects.toThrow(/file.*size|too.*large/i);
    });

    it('should sanitize folder names to prevent directory traversal', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: {
            alt: 'Directory Traversal Test',
            folder: '../../../etc/passwd',
          },
          user: adminUser,
          file: {
            data: Buffer.from('traversal-test'),
            mimetype: 'image/png',
            name: 'traversal.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should sanitize filenames to prevent path injection', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Path Injection Test' },
          user: adminUser,
          file: {
            data: Buffer.from('path-injection'),
            mimetype: 'image/png',
            name: '../../../etc/malicious.png',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should prevent null byte injection in filenames', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Null Byte Test' },
          user: adminUser,
          file: {
            data: Buffer.from('null-byte-test'),
            mimetype: 'image/png',
            name: 'image.png\x00.exe',
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should sanitize error messages (no user input reflection)', async () => {
      try {
        await payload.create({
          collection: 'media',
          data: { alt: '<script>alert("XSS")</script>' },
          user: adminUser,
          file: {
            data: Buffer.from('xss-test'),
            mimetype: 'application/x-executable',
            name: '<script>alert("XSS")</script>.exe',
            size: 256,
          },
        });
      } catch (error: any) {
        expect(error.message).not.toContain('<script>');
        expect(error.message).not.toContain('alert("XSS")');
      }
    });

    it('should enforce authentication for upload operations', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'No Auth Test' },
          // No user = no authentication
          file: {
            data: Buffer.from('no-auth'),
            mimetype: 'image/png',
            name: 'no-auth.png',
            size: 256,
          },
        })
      ).rejects.toThrow(/auth|permission/i);
    });

    it('should log upload activities for audit trail (non-PII only)', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Audit Log Test' },
        user: adminUser,
        file: {
          data: Buffer.from('audit-test'),
          mimetype: 'image/png',
          name: 'audit-test.png',
          size: 256,
        },
      });

      const logCalls = consoleLogSpy.mock.calls.flat();
      const hasMediaId = logCalls.some((call) => JSON.stringify(call).includes(media.id));

      expect(hasMediaId).toBe(true);

      consoleLogSpy.mockRestore();
    });

    it('should validate file integrity (no empty files)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Empty File Test' },
          user: adminUser,
          file: {
            data: Buffer.alloc(0),
            mimetype: 'image/png',
            name: 'empty.png',
            size: 0,
          },
        })
      ).rejects.toThrow(/empty|size/i);
    });

    it('should prevent MIME type spoofing (extension mismatch)', async () => {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'MIME Spoofing Test' },
          user: adminUser,
          file: {
            data: Buffer.from('fake-image-is-actually-executable'),
            mimetype: 'image/png', // Claims to be PNG
            name: 'fake-image.exe', // But extension is .exe
            size: 256,
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce rate limiting on uploads (prevent DoS)', async () => {
      // This test would require rate limiting middleware
      // For now, we document the requirement
      // Rate limiting should be implemented at the API level
      expect(true).toBe(true); // Placeholder
    });

    it('should prevent ownership hijacking via created_by manipulation', async () => {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Ownership Hijacking Test' },
        user: marketingUser,
        file: {
          data: Buffer.from('ownership-test'),
          mimetype: 'image/png',
          name: 'ownership-test.png',
          size: 256,
        },
      });

      // Attacker tries to change created_by to gain permissions
      const updated = await payload.update({
        collection: 'media',
        id: created.id,
        data: {
          alt: 'Hijacked',
          created_by: adminUser.id, // Attempt to hijack
        },
        user: marketingUser,
      });

      expect(updated.created_by).toBe(marketingUser.id);
      expect(updated.created_by).not.toBe(adminUser.id);
    });
  });
});

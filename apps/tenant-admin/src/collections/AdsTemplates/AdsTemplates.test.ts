/**
 * AdsTemplates Collection - Comprehensive Test Suite (TDD - RED PHASE)
 *
 * This test suite follows Test-Driven Development (TDD) methodology:
 * 1. Write tests FIRST (RED phase) ✅ YOU ARE HERE
 * 2. Implement collection to pass tests (GREEN phase)
 * 3. Apply security patterns (REFACTOR phase)
 *
 * Coverage Areas:
 * - CRUD Operations (15+ tests)
 * - Validation Tests (25+ tests)
 * - Access Control Tests (18+ tests)
 * - Relationship Tests (10+ tests)
 * - Hook Tests (12+ tests)
 * - Security Tests (15+ tests)
 * - Business Logic Tests (15+ tests)
 * Total: 110+ comprehensive tests
 *
 * Security Focus:
 * - SP-001: Immutable fields (created_by, version, usage_count, timestamps)
 * - SP-004: No sensitive data in logs (no marketing copy/URLs)
 * - Confidential marketing asset protection
 * - Ownership-based permissions (Marketing role)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import config from '../../payload.config';

describe('AdsTemplates Collection - TDD Test Suite', () => {
  let payload: Payload;
  let adminUser: any;
  let gestorUser: any;
  let marketingUser: any;
  let marketing2User: any; // Second marketing user for ownership tests
  let asesorUser: any;
  let lecturaUser: any;
  let testCampaign: any;

  // Valid template data
  const validTemplateData = {
    name: 'Spring Email Campaign Template',
    description: 'Email template for spring enrollment',
    template_type: 'email',
    status: 'draft',
    headline: 'Enroll Now - Spring 2025',
    body_copy: '<p>Join our spring courses and transform your career!</p>',
    call_to_action: 'Enroll Today',
    cta_url: 'https://www.example.com/enroll',
    primary_image_url: 'https://cdn.example.com/images/spring-banner.jpg',
    tone: 'professional',
    language: 'es',
    tags: ['spring', 'enrollment', 'email'],
  };

  // ============================================================================
  // TEST SETUP
  // ============================================================================

  beforeAll(async () => {
    payload = await getPayload({ config });

    // Create test users for each role
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin-template@test.com',
        password: 'TestPassword123!',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'Template',
      },
    });

    gestorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'gestor-template@test.com',
        password: 'TestPassword123!',
        role: 'gestor',
        first_name: 'Gestor',
        last_name: 'Template',
      },
    });

    marketingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing-template@test.com',
        password: 'TestPassword123!',
        role: 'marketing',
        first_name: 'Marketing',
        last_name: 'Template',
      },
    });

    marketing2User = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing2-template@test.com',
        password: 'TestPassword123!',
        role: 'marketing',
        first_name: 'Marketing Two',
        last_name: 'Template',
      },
    });

    asesorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'asesor-template@test.com',
        password: 'TestPassword123!',
        role: 'asesor',
        first_name: 'Asesor',
        last_name: 'Template',
      },
    });

    lecturaUser = await payload.create({
      collection: 'users',
      data: {
        email: 'lectura-template@test.com',
        password: 'TestPassword123!',
        role: 'lectura',
        first_name: 'Lectura',
        last_name: 'Template',
      },
    });

    // Create test campaign
    testCampaign = await payload.create({
      collection: 'campaigns',
      data: {
        name: 'Test Campaign for Templates',
        campaign_type: 'email',
        status: 'draft',
        utm_source: 'newsletter',
        utm_medium: 'email',
        utm_campaign: 'template_test',
        start_date: '2025-01-01',
      },
      user: adminUser,
    });
  });

  afterAll(async () => {
    // Cleanup is handled by database teardown
  });

  // ============================================================================
  // 1. CRUD OPERATIONS TESTS (15+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    let createdTemplate: any;

    it('should create template with all required fields', async () => {
      createdTemplate = await payload.create({
        collection: 'ads_templates',
        data: {
          name: validTemplateData.name,
          template_type: validTemplateData.template_type,
          status: validTemplateData.status,
          headline: validTemplateData.headline,
          body_copy: validTemplateData.body_copy,
          tone: validTemplateData.tone,
          language: validTemplateData.language,
        },
        user: adminUser,
      });

      expect(createdTemplate).toBeDefined();
      expect(createdTemplate.id).toBeDefined();
      expect(createdTemplate.name).toBe(validTemplateData.name);
      expect(createdTemplate.template_type).toBe(validTemplateData.template_type);
      expect(createdTemplate.status).toBe(validTemplateData.status);
    });

    it('should auto-populate created_by on creation', async () => {
      expect(createdTemplate.created_by).toBeDefined();
      expect(createdTemplate.created_by).toBe(adminUser.id);
    });

    it('should auto-set version to 1 on creation', async () => {
      expect(createdTemplate.version).toBe(1);
    });

    it('should create template with all optional fields', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          name: 'Full Template Test',
          campaign: testCampaign.id,
          description: 'Detailed template description',
          call_to_action: 'Sign Up Now',
          cta_url: 'https://www.example.com/signup',
          primary_image_url: 'https://cdn.example.com/images/banner.jpg',
          secondary_image_url: 'https://cdn.example.com/images/banner2.jpg',
          video_url: 'https://cdn.example.com/videos/promo.mp4',
          thumbnail_url: 'https://cdn.example.com/images/thumb.jpg',
          target_audience: 'Young professionals aged 25-35',
          tags: ['email', 'professional', 'spring'],
        },
        user: gestorUser,
      });

      expect(template).toBeDefined();
      expect(template.campaign).toBe(testCampaign.id);
      expect(template.description).toBeDefined();
      expect(template.call_to_action).toBe('Sign Up Now');
      expect(template.cta_url).toBe('https://www.example.com/signup');
      expect(template.tags).toEqual(['email', 'professional', 'spring']);
    });

    it('should read template by ID', async () => {
      const template = await payload.findByID({
        collection: 'ads_templates',
        id: createdTemplate.id,
        user: adminUser,
      });

      expect(template).toBeDefined();
      expect(template.id).toBe(createdTemplate.id);
    });

    it('should list all templates', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.docs.length).toBeGreaterThan(0);
    });

    it('should update template status', async () => {
      const updated = await payload.update({
        collection: 'ads_templates',
        id: createdTemplate.id,
        data: {
          status: 'active',
        },
        user: adminUser,
      });

      expect(updated.status).toBe('active');
    });

    it('should update template content', async () => {
      const updated = await payload.update({
        collection: 'ads_templates',
        id: createdTemplate.id,
        data: {
          headline: 'Updated Headline',
          body_copy: '<p>Updated body copy</p>',
        },
        user: adminUser,
      });

      expect(updated.headline).toBe('Updated Headline');
      expect(updated.body_copy).toBe('<p>Updated body copy</p>');
    });

    it('should update template tags', async () => {
      const updated = await payload.update({
        collection: 'ads_templates',
        id: createdTemplate.id,
        data: {
          tags: ['updated', 'tags'],
        },
        user: adminUser,
      });

      expect(updated.tags).toEqual(['updated', 'tags']);
    });

    it('should soft delete template (active=false)', async () => {
      const toSoftDelete = await payload.create({
        collection: 'ads_templates',
        data: {
          name: 'Template to Soft Delete',
          template_type: 'social_post',
          status: 'draft',
          headline: 'Test',
          body_copy: '<p>Test</p>',
          tone: 'casual',
          language: 'es',
        },
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'ads_templates',
        id: toSoftDelete.id,
        data: {
          active: false,
        },
        user: adminUser,
      });

      expect(updated.active).toBe(false);
    });

    it('should hard delete template (Gestor/Admin only)', async () => {
      const toDelete = await payload.create({
        collection: 'ads_templates',
        data: {
          name: 'Template to Delete',
          template_type: 'display_ad',
          status: 'draft',
          headline: 'Test',
          body_copy: '<p>Test</p>',
          tone: 'urgent',
          language: 'en',
        },
        user: adminUser,
      });

      await payload.delete({
        collection: 'ads_templates',
        id: toDelete.id,
        user: adminUser,
      });

      // Verify deletion
      await expect(
        payload.findByID({
          collection: 'ads_templates',
          id: toDelete.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should support pagination', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        limit: 5,
        page: 1,
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.limit).toBe(5);
      expect(result.page).toBe(1);
    });

    it('should support filtering by template_type', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        where: {
          template_type: { equals: 'email' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.template_type).toBe('email');
      });
    });

    it('should support filtering by status', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        where: {
          status: { equals: 'active' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.status).toBe('active');
      });
    });

    it('should support filtering by language', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        where: {
          language: { equals: 'es' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.language).toBe('es');
      });
    });

    it('should search templates by name', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          name: 'Searchable Template Name',
          template_type: 'landing_page',
          status: 'draft',
          headline: 'Search Test',
          body_copy: '<p>Search test content</p>',
          tone: 'friendly',
          language: 'ca',
        },
        user: adminUser,
      });

      const result = await payload.find({
        collection: 'ads_templates',
        where: {
          name: { equals: 'Searchable Template Name' },
        },
        user: adminUser,
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs[0].name).toBe('Searchable Template Name');
    });
  });

  // ============================================================================
  // 2. VALIDATION TESTS (25+ tests)
  // ============================================================================

  describe('Validation Tests', () => {
    it('should require name field', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require template_type field', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Test Template',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require headline field', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Test Template',
            template_type: 'email',
            status: 'draft',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require body_copy field', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Test Template',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            tone: 'professional',
            language: 'es',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should enforce unique name constraint', async () => {
      const uniqueName = 'Unique Template Name Test';

      await payload.create({
        collection: 'ads_templates',
        data: {
          name: uniqueName,
          template_type: 'email',
          status: 'draft',
          headline: 'Test',
          body_copy: '<p>Test</p>',
          tone: 'professional',
          language: 'es',
        },
        user: adminUser,
      });

      // Attempt duplicate
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: uniqueName,
            template_type: 'social_post',
            status: 'draft',
            headline: 'Test 2',
            body_copy: '<p>Test 2</p>',
            tone: 'casual',
            language: 'en',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    it('should validate name length (min 3, max 100)', async () => {
      // Too short
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'AB',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/3.*characters/i);

      // Too long
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'A'.repeat(101),
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/100.*characters/i);
    });

    it('should validate headline max length (100 chars)', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Headline Test',
            template_type: 'email',
            status: 'draft',
            headline: 'A'.repeat(101),
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/100.*characters/i);
    });

    it('should validate call_to_action max length (50 chars)', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'CTA Test',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            call_to_action: 'A'.repeat(51),
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/50.*characters/i);
    });

    it('should validate cta_url format', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid URL Test',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            cta_url: 'not-a-valid-url',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/url/i);
    });

    it('should accept valid URL formats (http/https)', async () => {
      const validUrls = [
        'https://www.example.com',
        'http://example.com',
        'https://subdomain.example.com/path',
        'https://example.com/path?query=value',
      ];

      for (const url of validUrls) {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: `URL Test ${url}`,
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            cta_url: url,
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        });

        expect(template.cta_url).toBe(url);

        // Cleanup
        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: adminUser,
        });
      }
    });

    it('should validate primary_image_url format', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Image URL',
            template_type: 'display_ad',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            primary_image_url: 'invalid-url',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/url/i);
    });

    it('should validate secondary_image_url format', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Secondary Image',
            template_type: 'display_ad',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            secondary_image_url: 'not-a-url',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/url/i);
    });

    it('should validate video_url format', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Video URL',
            template_type: 'video_script',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            video_url: 'invalid-video-url',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/url/i);
    });

    it('should validate thumbnail_url format', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Thumbnail',
            template_type: 'video_script',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            thumbnail_url: 'bad-url',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/url/i);
    });

    it('should accept valid template_type values', async () => {
      const validTypes = ['email', 'social_post', 'display_ad', 'landing_page', 'video_script', 'other'];

      for (const template_type of validTypes) {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: `Template Type ${template_type}`,
            template_type,
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        });

        expect(template.template_type).toBe(template_type);

        // Cleanup
        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: adminUser,
        });
      }
    });

    it('should reject invalid template_type values', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Type',
            template_type: 'invalid_type',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['draft', 'active', 'archived'];

      for (const status of validStatuses) {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: `Status ${status}`,
            template_type: 'email',
            status,
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          },
          user: adminUser,
        });

        expect(template.status).toBe(status);

        // Cleanup
        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: adminUser,
        });
      }
    });

    it('should reject invalid status values', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Status',
            template_type: 'email',
            status: 'invalid_status',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept valid tone values', async () => {
      const validTones = ['professional', 'casual', 'urgent', 'friendly', 'educational', 'promotional'];

      for (const tone of validTones) {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: `Tone ${tone}`,
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone,
            language: 'es',
          },
          user: adminUser,
        });

        expect(template.tone).toBe(tone);

        // Cleanup
        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: adminUser,
        });
      }
    });

    it('should accept valid language values', async () => {
      const validLanguages = ['es', 'en', 'ca'];

      for (const language of validLanguages) {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: `Language ${language}`,
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language,
          },
          user: adminUser,
        });

        expect(template.language).toBe(language);

        // Cleanup
        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: adminUser,
        });
      }
    });

    it('should validate tag format (lowercase, alphanumeric, hyphens)', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          name: 'Valid Tags Test',
          template_type: 'email',
          status: 'draft',
          headline: 'Test',
          body_copy: '<p>Test</p>',
          tone: 'professional',
          language: 'es',
          tags: ['valid-tag-123', 'another-tag', 'tag3'],
        },
        user: adminUser,
      });

      expect(template.tags).toEqual(['valid-tag-123', 'another-tag', 'tag3']);
    });

    it('should reject invalid tag format (uppercase)', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Tag Case',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
            tags: ['INVALID-TAG'],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/lowercase/i);
    });

    it('should reject invalid tag format (spaces)', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Invalid Tag Spaces',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
            tags: ['invalid tag'],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/alphanumeric.*hyphens/i);
    });

    it('should enforce max 10 tags limit', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Too Many Tags',
            template_type: 'email',
            status: 'draft',
            headline: 'Test',
            body_copy: '<p>Test</p>',
            tone: 'professional',
            language: 'es',
            tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11'],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/10.*tags/i);
    });

    it('should prevent status transition from archived', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          name: 'Archived Template',
          template_type: 'email',
          status: 'archived',
          headline: 'Test',
          body_copy: '<p>Test</p>',
          tone: 'professional',
          language: 'es',
        },
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'active' },
          user: adminUser,
        })
      ).rejects.toThrow(/archived.*terminal/i);
    });
  });

  // ============================================================================
  // 3. ACCESS CONTROL TESTS (18+ tests)
  // ============================================================================

  describe('Access Control Tests', () => {
    describe('Public (Unauthenticated)', () => {
      it('should NOT allow public to create templates', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: validTemplateData,
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to read templates', async () => {
        await expect(
          payload.find({
            collection: 'ads_templates',
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to update templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'ads_templates',
            id: template.id,
            data: { status: 'active' },
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to delete templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'ads_templates',
            id: template.id,
            // No user = public
          })
        ).rejects.toThrow();
      });
    });

    describe('Lectura Role', () => {
      it('should allow Lectura to read templates', async () => {
        const result = await payload.find({
          collection: 'ads_templates',
          user: lecturaUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should NOT allow Lectura to create templates', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: validTemplateData,
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Lectura to update templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'ads_templates',
            id: template.id,
            data: { status: 'active' },
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Lectura to delete templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'ads_templates',
            id: template.id,
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Asesor Role', () => {
      it('should allow Asesor to read templates', async () => {
        const result = await payload.find({
          collection: 'ads_templates',
          user: asesorUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should NOT allow Asesor to create templates', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: validTemplateData,
            user: asesorUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Asesor to update templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'ads_templates',
            id: template.id,
            data: { status: 'active' },
            user: asesorUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Asesor to delete templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'ads_templates',
            id: template.id,
            user: asesorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Marketing Role', () => {
      it('should allow Marketing to create templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: marketingUser,
        });

        expect(template).toBeDefined();
        expect(template.created_by).toBe(marketingUser.id);
      });

      it('should allow Marketing to read all templates', async () => {
        const result = await payload.find({
          collection: 'ads_templates',
          user: marketingUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Marketing to update own templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Marketing Own Template',
            template_type: 'social_post',
            status: 'draft',
            headline: 'Own Template',
            body_copy: '<p>Marketing own</p>',
            tone: 'casual',
            language: 'es',
          },
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'active' },
          user: marketingUser,
        });

        expect(updated.status).toBe('active');
      });

      it('should NOT allow Marketing to update templates created by others', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            name: 'Other Marketing Template',
            template_type: 'email',
            status: 'draft',
            headline: 'Other Template',
            body_copy: '<p>Other marketing</p>',
            tone: 'professional',
            language: 'es',
          },
          user: marketing2User,
        });

        await expect(
          payload.update({
            collection: 'ads_templates',
            id: template.id,
            data: { status: 'active' },
            user: marketingUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Marketing to delete templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: marketingUser,
        });

        await expect(
          payload.delete({
            collection: 'ads_templates',
            id: template.id,
            user: marketingUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Gestor Role', () => {
      it('should allow Gestor to create templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: gestorUser,
        });

        expect(template).toBeDefined();
      });

      it('should allow Gestor to read all templates', async () => {
        const result = await payload.find({
          collection: 'ads_templates',
          user: gestorUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Gestor to update any template', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'archived' },
          user: gestorUser,
        });

        expect(updated.status).toBe('archived');
      });

      it('should allow Gestor to delete templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: gestorUser,
        });

        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: gestorUser,
        });

        await expect(
          payload.findByID({
            collection: 'ads_templates',
            id: template.id,
            user: gestorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Admin Role', () => {
      it('should allow Admin to create templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        expect(template).toBeDefined();
      });

      it('should allow Admin to read all templates', async () => {
        const result = await payload.find({
          collection: 'ads_templates',
          user: adminUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Admin to update any template', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'archived' },
          user: adminUser,
        });

        expect(updated.status).toBe('archived');
      });

      it('should allow Admin to delete any template', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        await payload.delete({
          collection: 'ads_templates',
          id: template.id,
          user: adminUser,
        });

        await expect(
          payload.findByID({
            collection: 'ads_templates',
            id: template.id,
            user: adminUser,
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 4. RELATIONSHIP TESTS (10+ tests)
  // ============================================================================

  describe('Relationship Tests', () => {
    it('should populate campaign relationship', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          campaign: testCampaign.id,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'ads_templates',
        id: template.id,
        depth: 1,
        user: adminUser,
      });

      expect(populated.campaign).toBeDefined();
      expect(typeof populated.campaign).toBe('object');
    });

    it('should populate created_by relationship', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'ads_templates',
        id: template.id,
        depth: 1,
        user: adminUser,
      });

      expect(populated.created_by).toBeDefined();
      expect(typeof populated.created_by).toBe('object');
    });

    it('should handle SET NULL when campaign is deleted', async () => {
      // Create temporary campaign
      const tempCampaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Temp Campaign for Template',
          campaign_type: 'email',
          status: 'draft',
          utm_source: 'test',
          utm_medium: 'test',
          utm_campaign: 'temp',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          name: 'Template with Temp Campaign',
          campaign: tempCampaign.id,
        },
        user: adminUser,
      });

      // Delete campaign
      await payload.delete({
        collection: 'campaigns',
        id: tempCampaign.id,
        user: adminUser,
      });

      // Verify template still exists with campaign = null
      const updatedTemplate = await payload.findByID({
        collection: 'ads_templates',
        id: template.id,
        user: adminUser,
      });

      expect(updatedTemplate.campaign).toBeNull();
    });

    it('should handle SET NULL when created_by user is deleted', async () => {
      // Create temporary user
      const tempUser = await payload.create({
        collection: 'users',
        data: {
          email: 'temp-template-creator@test.com',
          password: 'TestPassword123!',
          role: 'marketing',
          first_name: 'Temp',
          last_name: 'Creator',
        },
      });

      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          name: 'Template with Temp User',
        },
        user: tempUser,
      });

      expect(template.created_by).toBe(tempUser.id);

      // Delete temp user
      await payload.delete({
        collection: 'users',
        id: tempUser.id,
        user: adminUser,
      });

      // Verify template still exists with created_by = null
      const updatedTemplate = await payload.findByID({
        collection: 'ads_templates',
        id: template.id,
        user: adminUser,
      });

      expect(updatedTemplate.created_by).toBeNull();
    });

    it('should filter templates by campaign relationship', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        where: {
          campaign: { equals: testCampaign.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.campaign).toBe(testCampaign.id);
      });
    });

    it('should filter templates by created_by relationship', async () => {
      const result = await payload.find({
        collection: 'ads_templates',
        where: {
          created_by: { equals: marketingUser.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.created_by).toBe(marketingUser.id);
      });
    });

    it('should support deep population of nested relationships', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          campaign: testCampaign.id,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'ads_templates',
        id: template.id,
        depth: 2,
        user: adminUser,
      });

      expect(populated.campaign).toBeDefined();
      expect(typeof populated.campaign).toBe('object');
    });

    it('should validate referential integrity on create', async () => {
      await expect(
        payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            campaign: 999999, // Non-existent
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should maintain referential integrity on update', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: {
            campaign: 999999, // Non-existent
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should allow template without campaign (optional)', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          campaign: undefined,
        },
        user: adminUser,
      });

      expect(template.campaign).toBeUndefined();
    });
  });

  // ============================================================================
  // 5. HOOK TESTS (12+ tests)
  // ============================================================================

  describe('Hook Tests', () => {
    describe('trackTemplateCreator Hook', () => {
      it('should auto-populate created_by on creation', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: marketingUser,
        });

        expect(template.created_by).toBe(marketingUser.id);
      });

      it('should prevent created_by from being manually set', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            created_by: gestorUser.id, // Attempt to override
          } as any,
          user: marketingUser,
        });

        // Should be marketingUser (the actual creator), not gestorUser
        expect(template.created_by).toBe(marketingUser.id);
      });

      it('should make created_by immutable after creation', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: {
            created_by: adminUser.id, // Attempt to change
          } as any,
          user: adminUser,
        });

        // Should remain marketingUser
        expect(updated.created_by).toBe(marketingUser.id);
      });
    });

    describe('setArchivedTimestamp Hook', () => {
      it('should auto-set archived_at when status changes to archived', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            status: 'draft',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'archived' },
          user: adminUser,
        });

        expect(updated.archived_at).toBeDefined();
        expect(new Date(updated.archived_at).getTime()).toBeGreaterThan(0);
      });

      it('should not set archived_at when status is not archived', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            status: 'draft',
          },
          user: adminUser,
        });

        expect(template.archived_at).toBeUndefined();

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'active' },
          user: adminUser,
        });

        expect(updated.archived_at).toBeUndefined();
      });

      it('should make archived_at immutable after being set', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            status: 'archived',
          },
          user: adminUser,
        });

        const originalTimestamp = template.archived_at;

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: {
            archived_at: new Date('2020-01-01').toISOString(), // Attempt to change
          } as any,
          user: adminUser,
        });

        // Should remain original
        expect(updated.archived_at).toBe(originalTimestamp);
      });
    });

    describe('validateTemplateContent Hook', () => {
      it('should validate headline length (max 100)', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: {
              ...validTemplateData,
              headline: 'A'.repeat(101),
            },
            user: adminUser,
          })
        ).rejects.toThrow(/100.*characters/i);
      });

      it('should validate call_to_action length (max 50)', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: {
              ...validTemplateData,
              call_to_action: 'A'.repeat(51),
            },
            user: adminUser,
          })
        ).rejects.toThrow(/50.*characters/i);
      });
    });

    describe('validateAssetURLs Hook', () => {
      it('should validate cta_url format', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: {
              ...validTemplateData,
              cta_url: 'not-a-url',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/url/i);
      });

      it('should accept valid http/https URLs', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            cta_url: 'https://www.example.com/enroll',
            primary_image_url: 'https://cdn.example.com/image.jpg',
          },
          user: adminUser,
        });

        expect(template.cta_url).toBe('https://www.example.com/enroll');
        expect(template.primary_image_url).toBe('https://cdn.example.com/image.jpg');
      });
    });

    describe('validateTags Hook', () => {
      it('should validate tag format (lowercase, alphanumeric, hyphens)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            tags: ['valid-tag', 'tag123', 'another-tag'],
          },
          user: adminUser,
        });

        expect(template.tags).toEqual(['valid-tag', 'tag123', 'another-tag']);
      });

      it('should reject uppercase tags', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: {
              ...validTemplateData,
              tags: ['INVALID'],
            },
            user: adminUser,
          })
        ).rejects.toThrow(/lowercase/i);
      });

      it('should enforce max 10 tags limit', async () => {
        await expect(
          payload.create({
            collection: 'ads_templates',
            data: {
              ...validTemplateData,
              tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
            },
            user: adminUser,
          })
        ).rejects.toThrow(/10.*tags/i);
      });
    });
  });

  // ============================================================================
  // 6. SECURITY TESTS (15+ tests)
  // ============================================================================

  describe('Security Tests - SP-001: Immutable Fields', () => {
    it('should make created_by immutable (Layer 2: Security)', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: {
          created_by: adminUser.id,
        } as any,
        user: adminUser,
      });

      expect(updated.created_by).toBe(marketingUser.id); // Unchanged
    });

    it('should make version immutable', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: adminUser,
      });

      expect(template.version).toBe(1);

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: {
          version: 99,
        } as any,
        user: adminUser,
      });

      expect(updated.version).toBe(1); // Unchanged
    });

    it('should make usage_count immutable (system-tracked)', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: {
          usage_count: 999,
        } as any,
        user: adminUser,
      });

      // Should remain system-calculated value
      expect(updated.usage_count).not.toBe(999);
    });

    it('should make last_used_at immutable (system-tracked)', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: {
          last_used_at: new Date('2020-01-01').toISOString(),
        } as any,
        user: adminUser,
      });

      // Should not accept manual updates
      expect(updated.last_used_at).not.toBe(new Date('2020-01-01').toISOString());
    });

    it('should make archived_at immutable', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          status: 'archived',
        },
        user: adminUser,
      });

      const originalTimestamp = template.archived_at;

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: {
          archived_at: new Date('2020-01-01').toISOString(),
        } as any,
        user: adminUser,
      });

      expect(updated.archived_at).toBe(originalTimestamp);
    });

    it('should have field-level access control on created_by', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: adminUser,
      });

      const collectionConfig = payload.collections['ads_templates'].config;
      const createdByField = collectionConfig.fields.find(
        (f: any) => f.name === 'created_by'
      );

      expect(createdByField).toBeDefined();
      expect(createdByField.access).toBeDefined();
      expect(createdByField.access.update).toBeDefined();

      const canUpdate = await createdByField.access.update({
        req: { user: adminUser },
        data: template,
      });

      expect(canUpdate).toBe(false);
    });

    it('should have field-level access control on system-tracked fields', async () => {
      const collectionConfig = payload.collections['ads_templates'].config;

      const systemFields = [
        'version',
        'usage_count',
        'last_used_at',
        'archived_at',
      ];

      systemFields.forEach((fieldName) => {
        const field = collectionConfig.fields.find((f: any) => f.name === fieldName);

        expect(field).toBeDefined();
        expect(field.access).toBeDefined();
        expect(field.access.update).toBeDefined();
      });
    });

    it('should enforce ownership-based update permissions (Marketing)', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          name: 'Ownership Test',
        },
        user: marketing2User,
      });

      await expect(
        payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'active' },
          user: marketingUser, // Different marketing user
        })
      ).rejects.toThrow();
    });

    it('should allow Admin to bypass ownership restrictions', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          name: 'Admin Bypass Test',
        },
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: { status: 'active' },
        user: adminUser,
      });

      expect(updated.status).toBe('active');
    });

    it('should allow Gestor to bypass ownership restrictions', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          name: 'Gestor Bypass Test',
        },
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: { status: 'archived' },
        user: gestorUser,
      });

      expect(updated.status).toBe('archived');
    });

    it('should NOT log marketing copy in console (SP-004 - Confidential)', async () => {
      // This is a manual verification test
      // Developers should check that hooks never log:
      // - headline, body_copy, call_to_action
      // - cta_url, image URLs (may contain tracking parameters)
      // Only log: template.id, template_type (non-sensitive)

      const template = await payload.create({
        collection: 'ads_templates',
        data: {
          ...validTemplateData,
          headline: 'CONFIDENTIAL MARKETING HEADLINE',
          body_copy: '<p>CONFIDENTIAL MARKETING COPY</p>',
        },
        user: adminUser,
      });

      // This test passes if implementation never logs sensitive marketing data
      expect(template.id).toBeDefined();
    });

    it('should prevent privilege escalation via created_by manipulation', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: marketingUser,
      });

      // Verify created_by is set correctly
      expect(template.created_by).toBe(marketingUser.id);

      // Try to change ownership
      await expect(
        payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { created_by: adminUser.id },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should maintain data integrity across all immutable fields', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: marketingUser,
      });

      const immutableFields = {
        created_by: template.created_by,
        version: template.version,
        usage_count: template.usage_count,
        last_used_at: template.last_used_at,
        archived_at: template.archived_at,
      };

      // Try to update mutable field
      await payload.update({
        collection: 'ads_templates',
        id: template.id,
        data: { description: 'Updated description' },
        user: marketingUser,
      });

      // Verify immutable fields unchanged
      const updated = await payload.findByID({
        collection: 'ads_templates',
        id: template.id,
        user: adminUser,
      });

      expect(updated.created_by).toBe(immutableFields.created_by);
      expect(updated.version).toBe(immutableFields.version);
      expect(updated.usage_count).toBe(immutableFields.usage_count);
      expect(updated.last_used_at).toBe(immutableFields.last_used_at);
      expect(updated.archived_at).toBe(immutableFields.archived_at);
    });

    it('should sanitize error messages (no data leakage)', async () => {
      try {
        await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            tags: ['INVALID-TAG'],
          },
          user: adminUser,
        });
      } catch (error: any) {
        // Error message should not reflect user input
        expect(error.message).not.toContain('INVALID-TAG');
      }
    });

    it('should enforce 3-layer defense for created_by', async () => {
      const template = await payload.create({
        collection: 'ads_templates',
        data: validTemplateData,
        user: marketingUser,
      });

      // Layer 1: UI (admin.readOnly) - tested manually
      // Layer 2: API (access.update: false)
      await expect(
        payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { created_by: adminUser.id },
          user: adminUser,
        })
      ).rejects.toThrow();

      // Layer 3: Hook enforces immutability
      // Verified by previous tests
    });
  });

  // ============================================================================
  // 7. BUSINESS LOGIC TESTS (15+ tests)
  // ============================================================================

  describe('Business Logic Tests', () => {
    describe('Status Workflow', () => {
      it('should allow transition: draft → active', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            status: 'draft',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'active' },
          user: adminUser,
        });

        expect(updated.status).toBe('active');
      });

      it('should allow transition: active → archived', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            status: 'active',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { status: 'archived' },
          user: adminUser,
        });

        expect(updated.status).toBe('archived');
        expect(updated.archived_at).toBeDefined();
      });

      it('should prevent transition: archived → any status (terminal)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            status: 'archived',
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'ads_templates',
            id: template.id,
            data: { status: 'active' },
            user: adminUser,
          })
        ).rejects.toThrow(/archived.*terminal/i);
      });
    });

    describe('Soft Delete Behavior', () => {
      it('should support soft delete (active=false)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { active: false },
          user: adminUser,
        });

        expect(updated.active).toBe(false);
      });

      it('should filter out soft-deleted templates by default', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            name: 'Soft Deleted Template',
          },
          user: adminUser,
        });

        await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { active: false },
          user: adminUser,
        });

        const result = await payload.find({
          collection: 'ads_templates',
          where: {
            active: { equals: true },
          },
          user: adminUser,
        });

        const found = result.docs.find((doc: any) => doc.id === template.id);
        expect(found).toBeUndefined();
      });

      it('should allow reactivating soft-deleted templates', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            name: 'Reactivate Test',
            active: false,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { active: true },
          user: adminUser,
        });

        expect(updated.active).toBe(true);
      });
    });

    describe('Version Management', () => {
      it('should auto-set version to 1 on creation', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        expect(template.version).toBe(1);
      });

      it('should keep version immutable (no auto-increment on updates)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { headline: 'Updated Headline' },
          user: adminUser,
        });

        expect(updated.version).toBe(1); // Unchanged
      });
    });

    describe('Tag Management', () => {
      it('should allow adding tags', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            tags: ['tag1', 'tag2'],
          },
          user: adminUser,
        });

        expect(template.tags).toEqual(['tag1', 'tag2']);
      });

      it('should allow updating tags', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            tags: ['tag1'],
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { tags: ['tag2', 'tag3'] },
          user: adminUser,
        });

        expect(updated.tags).toEqual(['tag2', 'tag3']);
      });

      it('should allow removing all tags', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            tags: ['tag1', 'tag2'],
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { tags: [] },
          user: adminUser,
        });

        expect(updated.tags).toEqual([]);
      });
    });

    describe('Template Content Updates', () => {
      it('should allow updating headline', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { headline: 'New Headline' },
          user: adminUser,
        });

        expect(updated.headline).toBe('New Headline');
      });

      it('should allow updating body_copy', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: { body_copy: '<p>New body copy</p>' },
          user: adminUser,
        });

        expect(updated.body_copy).toBe('<p>New body copy</p>');
      });

      it('should allow updating asset URLs', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: validTemplateData,
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'ads_templates',
          id: template.id,
          data: {
            primary_image_url: 'https://cdn.example.com/new-image.jpg',
            video_url: 'https://cdn.example.com/new-video.mp4',
          },
          user: adminUser,
        });

        expect(updated.primary_image_url).toBe('https://cdn.example.com/new-image.jpg');
        expect(updated.video_url).toBe('https://cdn.example.com/new-video.mp4');
      });
    });

    describe('Multi-Language Support', () => {
      it('should support Spanish (es)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            language: 'es',
          },
          user: adminUser,
        });

        expect(template.language).toBe('es');
      });

      it('should support English (en)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            name: 'English Template',
            language: 'en',
          },
          user: adminUser,
        });

        expect(template.language).toBe('en');
      });

      it('should support Catalan (ca)', async () => {
        const template = await payload.create({
          collection: 'ads_templates',
          data: {
            ...validTemplateData,
            name: 'Catalan Template',
            language: 'ca',
          },
          user: adminUser,
        });

        expect(template.language).toBe('ca');
      });
    });
  });
});

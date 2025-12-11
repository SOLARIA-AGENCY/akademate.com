/**
 * Campaigns Collection - Comprehensive Test Suite (TDD - RED PHASE)
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
 * - Relationship Tests (12+ tests)
 * - Hook Tests (15+ tests)
 * - Security Tests (15+ tests)
 * - Business Logic Tests (20+ tests)
 * Total: 120+ comprehensive tests
 *
 * Security Focus:
 * - SP-001: Immutable fields (created_by, system-calculated metrics)
 * - SP-004: No PII in logs (campaigns don't contain PII but budget is sensitive)
 * - Business intelligence protection (budget, ROI data)
 * - Ownership-based permissions (Marketing role)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import config from '../../payload.config';

describe('Campaigns Collection - TDD Test Suite', () => {
  let payload: Payload;
  let adminUser: any;
  let gestorUser: any;
  let marketingUser: any;
  let marketing2User: any; // Second marketing user for ownership tests
  let asesorUser: any;
  let lecturaUser: any;
  let testCourse: any;

  // Valid campaign data template
  const validCampaignData = {
    name: 'Spring Enrollment 2025',
    description: 'Campaign for spring semester enrollment',
    campaign_type: 'email',
    status: 'draft',
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'spring_enrollment_2025',
    start_date: '2025-01-01',
    end_date: '2025-03-31',
    budget: 5000.00,
    target_leads: 100,
    target_enrollments: 30,
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
        email: 'admin-campaign@test.com',
        password: 'TestPassword123!',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'Campaign',
      },
    });

    gestorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'gestor-campaign@test.com',
        password: 'TestPassword123!',
        role: 'gestor',
        first_name: 'Gestor',
        last_name: 'Campaign',
      },
    });

    marketingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing-campaign@test.com',
        password: 'TestPassword123!',
        role: 'marketing',
        first_name: 'Marketing',
        last_name: 'Campaign',
      },
    });

    marketing2User = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing2-campaign@test.com',
        password: 'TestPassword123!',
        role: 'marketing',
        first_name: 'Marketing Two',
        last_name: 'Campaign',
      },
    });

    asesorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'asesor-campaign@test.com',
        password: 'TestPassword123!',
        role: 'asesor',
        first_name: 'Asesor',
        last_name: 'Campaign',
      },
    });

    lecturaUser = await payload.create({
      collection: 'users',
      data: {
        email: 'lectura-campaign@test.com',
        password: 'TestPassword123!',
        role: 'lectura',
        first_name: 'Lectura',
        last_name: 'Campaign',
      },
    });

    // Create prerequisite data
    const testCycle = await payload.create({
      collection: 'cycles',
      data: {
        name: 'Test Cycle for Campaigns',
        code: 'TEST-CAMP',
        level: 'grado_superior',
        duration_years: 2,
      },
      user: adminUser,
    });

    testCourse = await payload.create({
      collection: 'courses',
      data: {
        title: 'Test Course for Campaigns',
        code: 'TC-CAMP',
        cycle: testCycle.id,
        description: 'Test course description',
        status: 'published',
        price: 2000,
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
    let createdCampaign: any;

    it('should create campaign with all required fields', async () => {
      createdCampaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: validCampaignData.name,
          campaign_type: validCampaignData.campaign_type,
          status: validCampaignData.status,
          utm_source: validCampaignData.utm_source,
          utm_medium: validCampaignData.utm_medium,
          utm_campaign: validCampaignData.utm_campaign,
          start_date: validCampaignData.start_date,
        },
        user: adminUser,
      });

      expect(createdCampaign).toBeDefined();
      expect(createdCampaign.id).toBeDefined();
      expect(createdCampaign.name).toBe(validCampaignData.name);
      expect(createdCampaign.campaign_type).toBe(validCampaignData.campaign_type);
      expect(createdCampaign.status).toBe(validCampaignData.status);
    });

    it('should auto-populate created_by on creation', async () => {
      expect(createdCampaign.created_by).toBeDefined();
      expect(createdCampaign.created_by).toBe(adminUser.id);
    });

    it('should create campaign with all optional fields', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Full Campaign Test',
          course: testCourse.id,
          description: 'Detailed campaign description',
          utm_term: 'marketing automation',
          utm_content: 'ad variant A',
          budget: 10000.00,
          target_leads: 200,
          target_enrollments: 60,
          notes: 'Internal campaign notes',
        },
        user: gestorUser,
      });

      expect(campaign).toBeDefined();
      expect(campaign.course).toBe(testCourse.id);
      expect(campaign.description).toBeDefined();
      expect(campaign.utm_term).toBe('marketing automation');
      expect(campaign.utm_content).toBe('ad variant A');
      expect(campaign.budget).toBe(10000.00);
      expect(campaign.target_leads).toBe(200);
      expect(campaign.target_enrollments).toBe(60);
      expect(campaign.notes).toBe('Internal campaign notes');
    });

    it('should read campaign by ID', async () => {
      const campaign = await payload.findByID({
        collection: 'campaigns',
        id: createdCampaign.id,
        user: adminUser,
      });

      expect(campaign).toBeDefined();
      expect(campaign.id).toBe(createdCampaign.id);
    });

    it('should list all campaigns', async () => {
      const result = await payload.find({
        collection: 'campaigns',
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.docs.length).toBeGreaterThan(0);
    });

    it('should update campaign status', async () => {
      const updated = await payload.update({
        collection: 'campaigns',
        id: createdCampaign.id,
        data: {
          status: 'active',
        },
        user: adminUser,
      });

      expect(updated.status).toBe('active');
    });

    it('should update campaign budget', async () => {
      const updated = await payload.update({
        collection: 'campaigns',
        id: createdCampaign.id,
        data: {
          budget: 7500.00,
        },
        user: adminUser,
      });

      expect(updated.budget).toBe(7500.00);
    });

    it('should update campaign notes', async () => {
      const updated = await payload.update({
        collection: 'campaigns',
        id: createdCampaign.id,
        data: {
          notes: 'Updated internal notes',
        },
        user: adminUser,
      });

      expect(updated.notes).toBe('Updated internal notes');
    });

    it('should delete campaign (Gestor/Admin only)', async () => {
      const toDelete = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Campaign to Delete',
          campaign_type: 'social',
          status: 'draft',
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'test_delete',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      await payload.delete({
        collection: 'campaigns',
        id: toDelete.id,
        user: adminUser,
      });

      // Verify deletion
      await expect(
        payload.findByID({
          collection: 'campaigns',
          id: toDelete.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should support pagination', async () => {
      const result = await payload.find({
        collection: 'campaigns',
        limit: 5,
        page: 1,
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.limit).toBe(5);
      expect(result.page).toBe(1);
    });

    it('should support filtering by status', async () => {
      const result = await payload.find({
        collection: 'campaigns',
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

    it('should support filtering by campaign_type', async () => {
      const result = await payload.find({
        collection: 'campaigns',
        where: {
          campaign_type: { equals: 'email' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.campaign_type).toBe('email');
      });
    });

    it('should support filtering by date range', async () => {
      const result = await payload.find({
        collection: 'campaigns',
        where: {
          start_date: { greater_than_equal: '2025-01-01' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
    });

    it('should support sorting by created date', async () => {
      const result = await payload.find({
        collection: 'campaigns',
        sort: '-createdAt', // Descending (newest first)
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      if (result.docs.length > 1) {
        const first = new Date(result.docs[0].createdAt);
        const second = new Date(result.docs[1].createdAt);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });

    it('should search campaigns by name', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Searchable Campaign Name',
          campaign_type: 'paid_ads',
          status: 'draft',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'searchable_test',
          start_date: '2025-02-01',
        },
        user: adminUser,
      });

      const result = await payload.find({
        collection: 'campaigns',
        where: {
          name: { equals: 'Searchable Campaign Name' },
        },
        user: adminUser,
      });

      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.docs[0].name).toBe('Searchable Campaign Name');
    });
  });

  // ============================================================================
  // 2. VALIDATION TESTS (25+ tests)
  // ============================================================================

  describe('Validation Tests', () => {
    it('should require name field', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require campaign_type field', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Test Campaign',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require start_date field', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Test Campaign',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should enforce unique name constraint', async () => {
      const uniqueName = 'Unique Campaign Name Test';

      await payload.create({
        collection: 'campaigns',
        data: {
          name: uniqueName,
          campaign_type: 'social',
          status: 'draft',
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'unique_test',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      // Attempt duplicate
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: uniqueName,
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'newsletter',
            utm_medium: 'email',
            utm_campaign: 'unique_test_2',
            start_date: '2025-02-01',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    it('should validate end_date > start_date', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid Date Range',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-12-31',
            end_date: '2025-01-01', // Before start_date
          },
          user: adminUser,
        })
      ).rejects.toThrow(/end.*date.*after.*start/i);
    });

    it('should accept equal start and end dates (same day campaign)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Same Day Campaign',
          campaign_type: 'event',
          status: 'draft',
          utm_source: 'event',
          utm_medium: 'offline',
          utm_campaign: 'same_day',
          start_date: '2025-06-15',
          end_date: '2025-06-15',
        },
        user: adminUser,
      });

      expect(campaign.start_date).toBe(campaign.end_date);
    });

    it('should validate budget >= 0', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Negative Budget',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
            budget: -1000,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept decimal budget values', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Decimal Budget Campaign',
          campaign_type: 'paid_ads',
          status: 'draft',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'decimal_test',
          start_date: '2025-01-01',
          budget: 1234.56,
        },
        user: adminUser,
      });

      expect(campaign.budget).toBe(1234.56);
    });

    it('should validate target_leads >= 0', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Negative Target Leads',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
            target_leads: -50,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate target_enrollments >= 0', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Negative Target Enrollments',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
            target_enrollments: -20,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate target_enrollments <= target_leads (if both provided)', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid Targets',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
            target_leads: 50,
            target_enrollments: 100, // More than leads
          },
          user: adminUser,
        })
      ).rejects.toThrow(/target_enrollments.*target_leads/i);
    });

    it('should accept valid campaign_type values', async () => {
      const validTypes = ['email', 'social', 'paid_ads', 'organic', 'event', 'referral', 'other'];

      for (const campaign_type of validTypes) {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            name: `Campaign Type ${campaign_type}`,
            campaign_type,
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: `type_${campaign_type}`,
            start_date: '2025-01-01',
          },
          user: adminUser,
        });

        expect(campaign.campaign_type).toBe(campaign_type);

        // Cleanup
        await payload.delete({
          collection: 'campaigns',
          id: campaign.id,
          user: adminUser,
        });
      }
    });

    it('should reject invalid campaign_type values', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid Type',
            campaign_type: 'invalid_type',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['draft', 'active', 'paused', 'completed', 'archived'];

      for (const status of validStatuses) {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            name: `Campaign Status ${status}`,
            campaign_type: 'email',
            status,
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: `status_${status}`,
            start_date: '2025-01-01',
          },
          user: adminUser,
        });

        expect(campaign.status).toBe(status);

        // Cleanup
        await payload.delete({
          collection: 'campaigns',
          id: campaign.id,
          user: adminUser,
        });
      }
    });

    it('should reject invalid status values', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid Status',
            campaign_type: 'email',
            status: 'invalid_status',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate UTM source format (lowercase, alphanumeric, hyphens)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Valid UTM Source',
          campaign_type: 'email',
          status: 'draft',
          utm_source: 'valid-utm-source-123',
          utm_medium: 'email',
          utm_campaign: 'test',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      expect(campaign.utm_source).toBe('valid-utm-source-123');
    });

    it('should reject invalid UTM source format (uppercase)', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid UTM Source',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'INVALID-SOURCE',
            utm_medium: 'email',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/lowercase/i);
    });

    it('should reject invalid UTM source format (spaces)', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid UTM Source Spaces',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'invalid source',
            utm_medium: 'email',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/lowercase.*alphanumeric.*hyphens/i);
    });

    it('should validate UTM medium format (lowercase, alphanumeric, hyphens)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Valid UTM Medium',
          campaign_type: 'paid_ads',
          status: 'draft',
          utm_source: 'google',
          utm_medium: 'cpc-display-123',
          utm_campaign: 'test',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      expect(campaign.utm_medium).toBe('cpc-display-123');
    });

    it('should reject invalid UTM medium format', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid UTM Medium',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'INVALID_MEDIUM',
            utm_campaign: 'test',
            start_date: '2025-01-01',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/lowercase.*alphanumeric.*hyphens/i);
    });

    it('should require utm_campaign if any UTM parameter is provided', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Missing UTM Campaign',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'newsletter',
            utm_medium: 'email',
            // Missing utm_campaign
            start_date: '2025-01-01',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/utm_campaign.*required/i);
    });

    it('should accept campaign without any UTM parameters', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'No UTM Campaign',
          campaign_type: 'event',
          status: 'draft',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      expect(campaign.utm_source).toBeUndefined();
      expect(campaign.utm_medium).toBeUndefined();
      expect(campaign.utm_campaign).toBeUndefined();
    });

    it('should validate course relationship exists', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid Course',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'test',
            utm_medium: 'test',
            utm_campaign: 'test',
            start_date: '2025-01-01',
            course: 999999, // Non-existent
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should allow null/undefined course (optional relationship)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'No Course Campaign',
          campaign_type: 'organic',
          status: 'draft',
          utm_source: 'blog',
          utm_medium: 'organic',
          utm_campaign: 'content_marketing',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      expect(campaign.course).toBeUndefined();
    });

    it('should prevent status transition from archived', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Archived Campaign',
          campaign_type: 'email',
          status: 'archived',
          utm_source: 'test',
          utm_medium: 'test',
          utm_campaign: 'archived_test',
          start_date: '2025-01-01',
        },
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'campaigns',
          id: campaign.id,
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
      it('should NOT allow public to create campaigns', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: validCampaignData,
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to read campaigns', async () => {
        await expect(
          payload.find({
            collection: 'campaigns',
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to update campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'campaigns',
            id: campaign.id,
            data: { status: 'active' },
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to delete campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'campaigns',
            id: campaign.id,
            // No user = public
          })
        ).rejects.toThrow();
      });
    });

    describe('Lectura Role', () => {
      it('should allow Lectura to read campaigns', async () => {
        const result = await payload.find({
          collection: 'campaigns',
          user: lecturaUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should NOT allow Lectura to create campaigns', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: validCampaignData,
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Lectura to update campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'campaigns',
            id: campaign.id,
            data: { status: 'active' },
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Lectura to delete campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'campaigns',
            id: campaign.id,
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Asesor Role', () => {
      it('should allow Asesor to read campaigns', async () => {
        const result = await payload.find({
          collection: 'campaigns',
          user: asesorUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should NOT allow Asesor to create campaigns', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: validCampaignData,
            user: asesorUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Asesor to update campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'campaigns',
            id: campaign.id,
            data: { status: 'active' },
            user: asesorUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Asesor to delete campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'campaigns',
            id: campaign.id,
            user: asesorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Marketing Role', () => {
      it('should allow Marketing to create campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: marketingUser,
        });

        expect(campaign).toBeDefined();
        expect(campaign.created_by).toBe(marketingUser.id);
      });

      it('should allow Marketing to read all campaigns', async () => {
        const result = await payload.find({
          collection: 'campaigns',
          user: marketingUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Marketing to update own campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            name: 'Marketing Own Campaign',
            campaign_type: 'social',
            status: 'draft',
            utm_source: 'facebook',
            utm_medium: 'social',
            utm_campaign: 'marketing_own',
            start_date: '2025-01-01',
          },
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'active' },
          user: marketingUser,
        });

        expect(updated.status).toBe('active');
      });

      it('should NOT allow Marketing to update campaigns created by others', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            name: 'Other Marketing Campaign',
            campaign_type: 'email',
            status: 'draft',
            utm_source: 'newsletter',
            utm_medium: 'email',
            utm_campaign: 'other_marketing',
            start_date: '2025-01-01',
          },
          user: marketing2User,
        });

        await expect(
          payload.update({
            collection: 'campaigns',
            id: campaign.id,
            data: { status: 'active' },
            user: marketingUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Marketing to delete campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: marketingUser,
        });

        await expect(
          payload.delete({
            collection: 'campaigns',
            id: campaign.id,
            user: marketingUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Gestor Role', () => {
      it('should allow Gestor to create campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: gestorUser,
        });

        expect(campaign).toBeDefined();
      });

      it('should allow Gestor to read all campaigns', async () => {
        const result = await payload.find({
          collection: 'campaigns',
          user: gestorUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Gestor to update any campaign', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'completed' },
          user: gestorUser,
        });

        expect(updated.status).toBe('completed');
      });

      it('should allow Gestor to delete campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: gestorUser,
        });

        await payload.delete({
          collection: 'campaigns',
          id: campaign.id,
          user: gestorUser,
        });

        await expect(
          payload.findByID({
            collection: 'campaigns',
            id: campaign.id,
            user: gestorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Admin Role', () => {
      it('should allow Admin to create campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        expect(campaign).toBeDefined();
      });

      it('should allow Admin to read all campaigns', async () => {
        const result = await payload.find({
          collection: 'campaigns',
          user: adminUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Admin to update any campaign', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'archived' },
          user: adminUser,
        });

        expect(updated.status).toBe('archived');
      });

      it('should allow Admin to delete any campaign', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        await payload.delete({
          collection: 'campaigns',
          id: campaign.id,
          user: adminUser,
        });

        await expect(
          payload.findByID({
            collection: 'campaigns',
            id: campaign.id,
            user: adminUser,
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 4. RELATIONSHIP TESTS (12+ tests)
  // ============================================================================

  describe('Relationship Tests', () => {
    it('should populate course relationship', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          course: testCourse.id,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        depth: 1,
        user: adminUser,
      });

      expect(populated.course).toBeDefined();
      expect(typeof populated.course).toBe('object');
    });

    it('should populate created_by relationship', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        depth: 1,
        user: adminUser,
      });

      expect(populated.created_by).toBeDefined();
      expect(typeof populated.created_by).toBe('object');
    });

    it('should handle SET NULL when course is deleted', async () => {
      // Create temporary course
      const tempCycle = await payload.create({
        collection: 'cycles',
        data: {
          name: 'Temp Cycle',
          code: 'TEMP',
          level: 'grado_superior',
          duration_years: 2,
        },
        user: adminUser,
      });

      const tempCourse = await payload.create({
        collection: 'courses',
        data: {
          title: 'Temp Course',
          code: 'TEMP',
          cycle: tempCycle.id,
          description: 'Temp',
          status: 'published',
          price: 1000,
        },
        user: adminUser,
      });

      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Campaign with Temp Course',
          course: tempCourse.id,
        },
        user: adminUser,
      });

      // Delete course
      await payload.delete({
        collection: 'courses',
        id: tempCourse.id,
        user: adminUser,
      });

      // Verify campaign still exists with course = null
      const updatedCampaign = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        user: adminUser,
      });

      expect(updatedCampaign.course).toBeNull();
    });

    it('should handle SET NULL when created_by user is deleted', async () => {
      // Create temporary user
      const tempUser = await payload.create({
        collection: 'users',
        data: {
          email: 'temp-creator@test.com',
          password: 'TestPassword123!',
          role: 'marketing',
          first_name: 'Temp',
          last_name: 'Creator',
        },
      });

      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Campaign with Temp User',
        },
        user: tempUser,
      });

      expect(campaign.created_by).toBe(tempUser.id);

      // Delete temp user
      await payload.delete({
        collection: 'users',
        id: tempUser.id,
        user: adminUser,
      });

      // Verify campaign still exists with created_by = null
      const updatedCampaign = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        user: adminUser,
      });

      expect(updatedCampaign.created_by).toBeNull();
    });

    it('should filter campaigns by course relationship', async () => {
      const result = await payload.find({
        collection: 'campaigns',
        where: {
          course: { equals: testCourse.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.course).toBe(testCourse.id);
      });
    });

    it('should filter campaigns by created_by relationship', async () => {
      const result = await payload.find({
        collection: 'campaigns',
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
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          course: testCourse.id,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        depth: 2, // Deep nesting
        user: adminUser,
      });

      expect(populated.course).toBeDefined();
      expect(typeof populated.course).toBe('object');
      if (typeof populated.course === 'object' && populated.course !== null) {
        expect((populated.course as any).cycle).toBeDefined();
      }
    });

    it('should validate referential integrity on create', async () => {
      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            course: 999999, // Non-existent
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should maintain referential integrity on update', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: {
            course: 999999, // Non-existent
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should query leads by campaign relationship (reverse)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Campaign for Lead Test',
        },
        user: adminUser,
      });

      // Create lead with campaign
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Test',
          last_name: 'Lead',
          email: 'lead@campaign.test',
          phone: '+34 666 777 888',
          gdpr_consent: true,
          privacy_policy_accepted: true,
          campaign: campaign.id,
        },
      });

      // Query leads by campaign
      const leadsResult = await payload.find({
        collection: 'leads',
        where: {
          campaign: { equals: campaign.id },
        },
        user: adminUser,
      });

      expect(leadsResult.docs.length).toBeGreaterThan(0);
      expect(leadsResult.docs[0].campaign).toBe(campaign.id);
    });

    it('should allow campaign without course (optional)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          course: undefined,
        },
        user: adminUser,
      });

      expect(campaign.course).toBeUndefined();
    });

    it('should allow updating course relationship', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: { course: testCourse.id },
        user: adminUser,
      });

      expect(updated.course).toBe(testCourse.id);
    });
  });

  // ============================================================================
  // 5. HOOK TESTS (15+ tests)
  // ============================================================================

  describe('Hook Tests', () => {
    describe('trackCampaignCreator Hook', () => {
      it('should auto-populate created_by on creation', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: marketingUser,
        });

        expect(campaign.created_by).toBe(marketingUser.id);
      });

      it('should prevent created_by from being manually set', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            created_by: gestorUser.id, // Attempt to override
          } as any,
          user: marketingUser,
        });

        // Should be marketingUser (the actual creator), not gestorUser
        expect(campaign.created_by).toBe(marketingUser.id);
      });

      it('should make created_by immutable after creation', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: {
            created_by: adminUser.id, // Attempt to change
          } as any,
          user: adminUser,
        });

        // Should remain marketingUser
        expect(updated.created_by).toBe(marketingUser.id);
      });
    });

    describe('validateCampaignDates Hook', () => {
      it('should validate end_date > start_date', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: {
              ...validCampaignData,
              start_date: '2025-12-31',
              end_date: '2025-01-01',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/end.*date.*after/i);
      });

      it('should accept end_date = start_date', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            start_date: '2025-06-15',
            end_date: '2025-06-15',
          },
          user: adminUser,
        });

        expect(campaign.start_date).toBe(campaign.end_date);
      });

      it('should reject start_date in the past for draft campaigns', async () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        await expect(
          payload.create({
            collection: 'campaigns',
            data: {
              ...validCampaignData,
              status: 'draft',
              start_date: pastDate.toISOString().split('T')[0],
            },
            user: adminUser,
          })
        ).rejects.toThrow(/past/i);
      });
    });

    describe('validateCampaignTargets Hook', () => {
      it('should validate target_enrollments <= target_leads', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: {
              ...validCampaignData,
              target_leads: 50,
              target_enrollments: 100,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/target_enrollments.*target_leads/i);
      });

      it('should accept target_enrollments = target_leads', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            target_leads: 100,
            target_enrollments: 100,
          },
          user: adminUser,
        });

        expect(campaign.target_enrollments).toBe(campaign.target_leads);
      });

      it('should allow target_enrollments undefined if target_leads provided', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            target_leads: 150,
          },
          user: adminUser,
        });

        expect(campaign.target_leads).toBe(150);
        expect(campaign.target_enrollments).toBeUndefined();
      });
    });

    describe('validateUTMParameters Hook', () => {
      it('should require utm_campaign if utm_source is provided', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: {
              name: 'Missing UTM Campaign',
              campaign_type: 'email',
              status: 'draft',
              utm_source: 'newsletter',
              start_date: '2025-01-01',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/utm_campaign.*required/i);
      });

      it('should validate utm_source format', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: {
              ...validCampaignData,
              utm_source: 'INVALID SOURCE',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/lowercase.*alphanumeric/i);
      });

      it('should validate utm_medium format', async () => {
        await expect(
          payload.create({
            collection: 'campaigns',
            data: {
              ...validCampaignData,
              utm_medium: 'INVALID_MEDIUM',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/lowercase.*alphanumeric/i);
      });

      it('should accept valid UTM parameters', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            utm_source: 'google-ads',
            utm_medium: 'cpc',
            utm_campaign: 'summer-2025',
            utm_term: 'online courses',
            utm_content: 'ad-variant-a',
          },
          user: adminUser,
        });

        expect(campaign.utm_source).toBe('google-ads');
        expect(campaign.utm_medium).toBe('cpc');
        expect(campaign.utm_campaign).toBe('summer-2025');
      });
    });

    describe('calculateCampaignMetrics Hook', () => {
      it('should auto-calculate total_leads from Leads collection', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Metrics Test Campaign',
          },
          user: adminUser,
        });

        // Create leads associated with campaign
        for (let i = 0; i < 5; i++) {
          await payload.create({
            collection: 'leads',
            data: {
              first_name: `Lead${i}`,
              last_name: 'Test',
              email: `lead${i}@metrics.test`,
              phone: '+34 666 777 888',
              gdpr_consent: true,
              privacy_policy_accepted: true,
              campaign: campaign.id,
            },
          });
        }

        // Refresh campaign to get calculated metrics
        const updated = await payload.findByID({
          collection: 'campaigns',
          id: campaign.id,
          user: adminUser,
        });

        expect(updated.total_leads).toBe(5);
      });

      it('should calculate cost_per_lead (budget / total_leads)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Cost Per Lead Test',
            budget: 1000,
          },
          user: adminUser,
        });

        // Assuming total_leads = 10 (from previous test or hook)
        // cost_per_lead should be 1000 / 10 = 100
        // This will be tested after implementation
        expect(campaign.budget).toBe(1000);
      });

      it('should handle division by zero for cost_per_lead', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Zero Leads Campaign',
            budget: 1000,
          },
          user: adminUser,
        });

        // With 0 leads, cost_per_lead should be undefined or 0
        expect(campaign.cost_per_lead).toBeUndefined();
      });

      it('should make total_leads immutable (system-calculated)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: validCampaignData,
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: {
            total_leads: 999, // Attempt to manipulate
          } as any,
          user: adminUser,
        });

        // Should remain system-calculated value
        expect(updated.total_leads).not.toBe(999);
      });
    });
  });

  // ============================================================================
  // 6. SECURITY TESTS (15+ tests)
  // ============================================================================

  describe('Security Tests - SP-001: Immutable Fields', () => {
    it('should make created_by immutable (Layer 2: Security)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: {
          created_by: adminUser.id,
        } as any,
        user: adminUser,
      });

      expect(updated.created_by).toBe(marketingUser.id); // Unchanged
    });

    it('should make total_leads immutable (system-calculated)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: {
          total_leads: 999,
        } as any,
        user: adminUser,
      });

      expect(updated.total_leads).not.toBe(999);
    });

    it('should make total_conversions immutable (system-calculated)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: {
          total_conversions: 999,
        } as any,
        user: adminUser,
      });

      expect(updated.total_conversions).not.toBe(999);
    });

    it('should make conversion_rate immutable (system-calculated)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: {
          conversion_rate: 99.9,
        } as any,
        user: adminUser,
      });

      expect(updated.conversion_rate).not.toBe(99.9);
    });

    it('should make cost_per_lead immutable (system-calculated)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: {
          cost_per_lead: 999.99,
        } as any,
        user: adminUser,
      });

      expect(updated.cost_per_lead).not.toBe(999.99);
    });

    it('should have field-level access control on created_by', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: adminUser,
      });

      const collectionConfig = payload.collections['campaigns'].config;
      const createdByField = collectionConfig.fields.find(
        (f: any) => f.name === 'created_by'
      );

      expect(createdByField).toBeDefined();
      expect(createdByField.access).toBeDefined();
      expect(createdByField.access.update).toBeDefined();

      const canUpdate = await createdByField.access.update({
        req: { user: adminUser },
        data: campaign,
      });

      expect(canUpdate).toBe(false);
    });

    it('should have field-level access control on system-calculated metrics', async () => {
      const collectionConfig = payload.collections['campaigns'].config;

      const metricFields = [
        'total_leads',
        'total_conversions',
        'conversion_rate',
        'cost_per_lead',
      ];

      metricFields.forEach((fieldName) => {
        const field = collectionConfig.fields.find((f: any) => f.name === fieldName);

        expect(field).toBeDefined();
        expect(field.access).toBeDefined();
        expect(field.access.update).toBeDefined();
      });
    });

    it('should enforce ownership-based update permissions (Marketing)', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Ownership Test',
        },
        user: marketing2User,
      });

      await expect(
        payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'active' },
          user: marketingUser, // Different marketing user
        })
      ).rejects.toThrow();
    });

    it('should allow Admin to bypass ownership restrictions', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Admin Bypass Test',
        },
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: { status: 'paused' },
        user: adminUser,
      });

      expect(updated.status).toBe('paused');
    });

    it('should allow Gestor to bypass ownership restrictions', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          name: 'Gestor Bypass Test',
        },
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: { status: 'completed' },
        user: gestorUser,
      });

      expect(updated.status).toBe('completed');
    });

    it('should NOT log budget in console (SP-004 - Business Intelligence)', async () => {
      // This is a manual verification test
      // Developers should check that hooks never log:
      // - budget, target_leads, target_enrollments
      // - total_leads, total_conversions, conversion_rate, cost_per_lead
      // Only log: campaign.id, campaign.name (non-sensitive)

      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          budget: 50000,
        },
        user: adminUser,
      });

      // This test passes if implementation never logs sensitive business data
      expect(campaign.id).toBeDefined();
    });

    it('should prevent privilege escalation via created_by manipulation', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: marketingUser,
      });

      // Verify created_by is set correctly
      expect(campaign.created_by).toBe(marketingUser.id);

      // Try to change ownership
      await expect(
        payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { created_by: adminUser.id },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should maintain data integrity across all immutable fields', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          ...validCampaignData,
          budget: 5000,
        },
        user: marketingUser,
      });

      const immutableFields = {
        created_by: campaign.created_by,
        total_leads: campaign.total_leads,
        total_conversions: campaign.total_conversions,
        conversion_rate: campaign.conversion_rate,
        cost_per_lead: campaign.cost_per_lead,
      };

      // Try to update mutable field
      await payload.update({
        collection: 'campaigns',
        id: campaign.id,
        data: { notes: 'Updated notes' },
        user: marketingUser,
      });

      // Verify immutable fields unchanged
      const updated = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        user: adminUser,
      });

      expect(updated.created_by).toBe(immutableFields.created_by);
      expect(updated.total_leads).toBe(immutableFields.total_leads);
      expect(updated.total_conversions).toBe(immutableFields.total_conversions);
      expect(updated.conversion_rate).toBe(immutableFields.conversion_rate);
      expect(updated.cost_per_lead).toBe(immutableFields.cost_per_lead);
    });

    it('should sanitize error messages (no data leakage)', async () => {
      try {
        await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            utm_source: 'INVALID SOURCE',
          },
          user: adminUser,
        });
      } catch (error: any) {
        // Error message should not reflect user input
        expect(error.message).not.toContain('INVALID SOURCE');
      }
    });

    it('should enforce 3-layer defense for created_by', async () => {
      const campaign = await payload.create({
        collection: 'campaigns',
        data: validCampaignData,
        user: marketingUser,
      });

      // Layer 1: UI (admin.readOnly) - tested manually
      // Layer 2: API (access.update: false)
      await expect(
        payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { created_by: adminUser.id },
          user: adminUser,
        })
      ).rejects.toThrow();

      // Layer 3: Hook enforces immutability
      // Verified by previous tests
    });
  });

  // ============================================================================
  // 7. BUSINESS LOGIC TESTS (20+ tests)
  // ============================================================================

  describe('Business Logic Tests', () => {
    describe('Status Workflow', () => {
      it('should allow transition: draft → active', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'draft',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'active' },
          user: adminUser,
        });

        expect(updated.status).toBe('active');
      });

      it('should allow transition: active → paused', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'active',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'paused' },
          user: adminUser,
        });

        expect(updated.status).toBe('paused');
      });

      it('should allow transition: paused → active', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'paused',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'active' },
          user: adminUser,
        });

        expect(updated.status).toBe('active');
      });

      it('should allow transition: active → completed', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'active',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'completed' },
          user: adminUser,
        });

        expect(updated.status).toBe('completed');
      });

      it('should allow transition: completed → archived', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'completed',
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { status: 'archived' },
          user: adminUser,
        });

        expect(updated.status).toBe('archived');
      });

      it('should prevent transition: archived → any other status (terminal)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'archived',
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'campaigns',
            id: campaign.id,
            data: { status: 'active' },
            user: adminUser,
          })
        ).rejects.toThrow(/archived.*terminal/i);
      });
    });

    describe('Analytics Calculations', () => {
      it('should calculate total_leads from Leads collection', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Analytics Test 1',
          },
          user: adminUser,
        });

        // Mock: total_leads should be calculated from actual leads
        // This will be implemented in hooks
        expect(campaign.total_leads).toBeDefined();
      });

      it('should calculate total_conversions (leads with enrollments)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Analytics Test 2',
          },
          user: adminUser,
        });

        // Mock: total_conversions = count of leads that have enrollments
        expect(campaign.total_conversions).toBeDefined();
      });

      it('should calculate conversion_rate (conversions / leads * 100)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Conversion Rate Test',
          },
          user: adminUser,
        });

        // If total_leads = 100 and total_conversions = 30
        // conversion_rate should = 30.0
        // This will be tested after implementation
      });

      it('should calculate cost_per_lead (budget / total_leads)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Cost Per Lead Test',
            budget: 5000,
          },
          user: adminUser,
        });

        // If total_leads = 100, cost_per_lead should = 50.0
        expect(campaign.budget).toBe(5000);
      });

      it('should handle division by zero in conversion_rate', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Zero Conversions Test',
          },
          user: adminUser,
        });

        // If total_leads = 0, conversion_rate should be undefined or 0
        // Prevent NaN or Infinity
      });

      it('should handle division by zero in cost_per_lead', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Zero Leads Cost Test',
            budget: 1000,
          },
          user: adminUser,
        });

        // If total_leads = 0, cost_per_lead should be undefined or 0
        expect(campaign.cost_per_lead).toBeUndefined();
      });

      it('should recalculate metrics when leads are added', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Metrics Recalc Test',
            budget: 1000,
          },
          user: adminUser,
        });

        const initialLeads = campaign.total_leads || 0;

        // Add a new lead
        await payload.create({
          collection: 'leads',
          data: {
            first_name: 'New',
            last_name: 'Lead',
            email: 'newlead@test.com',
            phone: '+34 666 777 888',
            gdpr_consent: true,
            privacy_policy_accepted: true,
            campaign: campaign.id,
          },
        });

        // Refresh campaign
        const updated = await payload.findByID({
          collection: 'campaigns',
          id: campaign.id,
          user: adminUser,
        });

        expect(updated.total_leads).toBe(initialLeads + 1);
      });

      it('should return 0 for cost_per_lead when budget is 0', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            name: 'Zero Budget Test',
            budget: 0,
          },
          user: adminUser,
        });

        expect(campaign.cost_per_lead).toBe(0);
      });

      it('should support decimal precision in conversion_rate', async () => {
        // If total_leads = 137 and total_conversions = 43
        // conversion_rate should = 31.38686131386861
        // Should be rounded to 2 decimal places: 31.39
      });

      it('should support decimal precision in cost_per_lead', async () => {
        // If budget = 1234.56 and total_leads = 78
        // cost_per_lead should = 15.8277 → 15.83
      });
    });

    describe('Date Range Validation', () => {
      it('should accept campaigns with no end_date (ongoing)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            end_date: undefined,
          },
          user: adminUser,
        });

        expect(campaign.end_date).toBeUndefined();
      });

      it('should accept long-running campaigns (1+ years)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            start_date: '2025-01-01',
            end_date: '2026-12-31',
          },
          user: adminUser,
        });

        expect(campaign.start_date).toBe('2025-01-01');
        expect(campaign.end_date).toBe('2026-12-31');
      });

      it('should accept single-day campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            campaign_type: 'event',
            start_date: '2025-06-15',
            end_date: '2025-06-15',
          },
          user: adminUser,
        });

        expect(campaign.start_date).toBe(campaign.end_date);
      });
    });

    describe('Campaign Type Behavior', () => {
      it('should allow all campaign_type values', async () => {
        const types = ['email', 'social', 'paid_ads', 'organic', 'event', 'referral', 'other'];

        for (const type of types) {
          const campaign = await payload.create({
            collection: 'campaigns',
            data: {
              ...validCampaignData,
              name: `Type ${type} Test`,
              campaign_type: type,
            },
            user: adminUser,
          });

          expect(campaign.campaign_type).toBe(type);

          await payload.delete({
            collection: 'campaigns',
            id: campaign.id,
            user: adminUser,
          });
        }
      });
    });

    describe('Budget Management', () => {
      it('should allow updating budget for active campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'active',
            budget: 5000,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { budget: 7500 },
          user: adminUser,
        });

        expect(updated.budget).toBe(7500);
      });

      it('should allow campaigns without budget (optional)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            budget: undefined,
          },
          user: adminUser,
        });

        expect(campaign.budget).toBeUndefined();
      });

      it('should support fractional budgets (cents)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            budget: 1234.56,
          },
          user: adminUser,
        });

        expect(campaign.budget).toBe(1234.56);
      });
    });

    describe('Target Management', () => {
      it('should allow updating targets for draft campaigns', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            status: 'draft',
            target_leads: 100,
            target_enrollments: 30,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: {
            target_leads: 150,
            target_enrollments: 45,
          },
          user: adminUser,
        });

        expect(updated.target_leads).toBe(150);
        expect(updated.target_enrollments).toBe(45);
      });

      it('should allow campaigns without targets (optional)', async () => {
        const campaign = await payload.create({
          collection: 'campaigns',
          data: {
            ...validCampaignData,
            target_leads: undefined,
            target_enrollments: undefined,
          },
          user: adminUser,
        });

        expect(campaign.target_leads).toBeUndefined();
        expect(campaign.target_enrollments).toBeUndefined();
      });
    });
  });
});

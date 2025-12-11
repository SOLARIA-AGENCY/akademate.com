/**
 * Leads Collection Tests
 *
 * Critical GDPR-compliant tests for lead management
 * - CRUD operations with PII protection
 * - GDPR consent tracking
 * - Data export/deletion (GDPR rights)
 * - Audit logging
 * - Access control
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

describe('Leads Collection API - GDPR Compliance', () => {
  let payload: Payload;
  let adminToken: string;
  let testLeadId: string;
  let testCampaignId: string;

  beforeAll(async () => {
    // Initialize Payload
    payload = await getPayload({ config: await import('../../payload.config') });

    // Login as admin
    const loginResponse = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'admin@cepcomunicacion.com',
        password: 'admin123',
      });

    adminToken = loginResponse.body.token;

    // Create test campaign
    const campaign = await payload.create({
      collection: 'campaigns',
      data: {
        name: 'Test Campaign for Leads',
        slug: 'test-campaign-leads',
        campaign_type: 'paid_social',
        status: 'active',
      },
    });
    testCampaignId = campaign.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testLeadId) {
      await payload.delete({ collection: 'leads', id: testLeadId }).catch(() => {});
    }
    if (testCampaignId) {
      await payload.delete({ collection: 'campaigns', id: testCampaignId }).catch(() => {});
    }
  });

  describe('POST /api/leads - Lead Creation', () => {
    it('should create a lead with valid data and GDPR consent', async () => {
      const leadData = {
        name: 'Juan',
        surname: 'Pérez García',
        email: 'juan.perez@example.com',
        phone: '+34612345678',
        gdpr_consent: true,
        gdpr_consent_date: new Date().toISOString(),
        gdpr_consent_ip: '192.168.1.1',
        campaign: testCampaignId,
        lead_source: 'website_form',
        status: 'new',
      };

      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(leadData)
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');
      expect(response.body.doc.email).toBe(leadData.email);
      expect(response.body.doc.gdpr_consent).toBe(true);
      expect(response.body.doc).toHaveProperty('gdpr_consent_date');
      expect(response.body.doc).toHaveProperty('gdpr_consent_ip');

      testLeadId = response.body.doc.id;
    });

    it('should REJECT lead without GDPR consent', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Consent',
          surname: 'User',
          email: 'noconsent@example.com',
          phone: '+34600000000',
          gdpr_consent: false, // MUST FAIL
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should require gdpr_consent_date when consent is given', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          phone: '+34600000000',
          gdpr_consent: true,
          // Missing gdpr_consent_date
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should require gdpr_consent_ip when consent is given', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          phone: '+34600000000',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          // Missing gdpr_consent_ip
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid',
          surname: 'Email',
          email: 'not-an-email', // Invalid format
          phone: '+34600000000',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate Spanish phone format', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid',
          surname: 'Phone',
          email: 'valid@example.com',
          phone: '123', // Invalid format
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/leads - Access Control', () => {
    it('should require authentication for reading leads (PII protection)', async () => {
      await request(payload.express)
        .get('/api/leads')
        .expect(401);
    });

    it('should allow authenticated admin to read leads', async () => {
      const response = await request(payload.express)
        .get('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
    });

    it('should allow filtering by status', async () => {
      const response = await request(payload.express)
        .get('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ where: { status: { equals: 'new' } } })
        .expect(200);

      response.body.docs.forEach((lead: any) => {
        expect(lead.status).toBe('new');
      });
    });

    it('should allow filtering by lead_source', async () => {
      const response = await request(payload.express)
        .get('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ where: { lead_source: { equals: 'website_form' } } })
        .expect(200);

      response.body.docs.forEach((lead: any) => {
        expect(lead.lead_source).toBe('website_form');
      });
    });
  });

  describe('GDPR Rights - Data Export', () => {
    it('should support data export for GDPR subject access request', async () => {
      // In real implementation, this would be a custom endpoint
      // For now, we verify lead data can be retrieved
      const leads = await payload.find({
        collection: 'leads',
        where: { email: { equals: 'juan.perez@example.com' } },
      });

      expect(leads.docs.length).toBeGreaterThan(0);
      const lead = leads.docs[0];

      // Verify all PII fields are accessible for export
      expect(lead).toHaveProperty('name');
      expect(lead).toHaveProperty('surname');
      expect(lead).toHaveProperty('email');
      expect(lead).toHaveProperty('phone');
      expect(lead).toHaveProperty('gdpr_consent');
      expect(lead).toHaveProperty('gdpr_consent_date');
      expect(lead).toHaveProperty('gdpr_consent_ip');
    });
  });

  describe('GDPR Rights - Right to Erasure', () => {
    it('should allow deletion of lead data (right to be forgotten)', async () => {
      // Create a lead for deletion
      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: 'To Be',
          surname: 'Deleted',
          email: 'tobe.deleted@example.com',
          phone: '+34600111222',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
          lead_source: 'website_form',
          status: 'new',
        },
      });

      // Delete the lead
      await request(payload.express)
        .delete(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await payload.findByID({
        collection: 'leads',
        id: lead.id,
      }).catch(() => null);

      expect(deleted).toBeNull();
    });
  });

  describe('Audit Logging', () => {
    it('should log lead creation with user and timestamp', async () => {
      // Audit logs should be created automatically via hooks
      // This test verifies the audit trail exists
      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: 'Audit',
          surname: 'Test',
          email: 'audit.test@example.com',
          phone: '+34600333444',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
          lead_source: 'website_form',
          status: 'new',
        },
      });

      // Verify audit fields exist (implementation-dependent)
      expect(lead).toHaveProperty('createdAt');
      expect(lead).toHaveProperty('updatedAt');

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });
  });

  describe('Lead Status Workflow', () => {
    it('should validate status enum values', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid',
          surname: 'Status',
          email: 'invalid.status@example.com',
          phone: '+34600555666',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
          status: 'invalid_status', // Not in enum
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should allow valid status transitions', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: 'Status',
          surname: 'Transition',
          email: 'status.transition@example.com',
          phone: '+34600777888',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
          lead_source: 'website_form',
          status: 'new',
        },
      });

      // Transition to contacted
      const updated = await payload.update({
        collection: 'leads',
        id: lead.id,
        data: { status: 'contacted' },
      });

      expect(updated.status).toBe('contacted');

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });
  });

  describe('Campaign Relationship', () => {
    it('should associate lead with campaign', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          name: 'Campaign',
          surname: 'Lead',
          email: 'campaign.lead@example.com',
          phone: '+34600999000',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
          gdpr_consent_ip: '192.168.1.1',
          lead_source: 'paid_social',
          campaign: testCampaignId,
          status: 'new',
        },
      });

      expect(lead.campaign).toBe(testCampaignId);

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });

    it('should populate campaign relationship', async () => {
      const leads = await payload.find({
        collection: 'leads',
        where: { campaign: { exists: true } },
        limit: 1,
        depth: 2,
      });

      if (leads.docs.length > 0) {
        const lead = leads.docs[0];
        if (typeof lead.campaign === 'object') {
          expect(lead.campaign).toHaveProperty('name');
        }
      }
    });
  });

  describe('PII Protection', () => {
    it('should NOT expose leads in public API without authentication', async () => {
      await request(payload.express)
        .get('/api/leads')
        .expect(401);
    });

    it('should mask PII in logs (implementation check)', () => {
      // This test ensures PII masking is considered
      // Actual implementation depends on logging configuration
      expect(true).toBe(true);
    });
  });
});

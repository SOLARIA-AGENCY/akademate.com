/**
 * @module @akademate/jobs
 * Tests for tenant job utilities
 */

import { describe, expect, it } from 'vitest'
import { buildTenantJob, defaultQueueName, type TenantJob, type JobName } from '../src/index'

describe('@akademate/jobs', () => {
  describe('defaultQueueName', () => {
    it('exports the correct queue name', () => {
      expect(defaultQueueName).toBe('akademate-jobs')
    })
  })

  describe('buildTenantJob', () => {
    it('creates a job with required fields', () => {
      const job = buildTenantJob('tenant-1', 'send-email', { to: 'test@example.com' })

      expect(job).toEqual({
        tenantId: 'tenant-1',
        name: 'send-email',
        payload: { to: 'test@example.com' },
      })
    })

    it('creates webhook job with complex payload', () => {
      const webhookPayload = {
        url: 'https://api.example.com/webhook',
        method: 'POST',
        body: { event: 'enrollment.created', data: { studentId: '123' } },
        headers: { 'X-Webhook-Secret': 'secret123' },
      }

      const job = buildTenantJob('tenant-2', 'webhook', webhookPayload)

      expect(job.tenantId).toBe('tenant-2')
      expect(job.name).toBe('webhook')
      expect(job.payload).toEqual(webhookPayload)
    })

    it('creates sync-search job', () => {
      const job = buildTenantJob('tenant-3', 'sync-search', { indexName: 'courses', documentIds: ['c1', 'c2'] })

      expect(job.name).toBe('sync-search')
      expect(job.payload).toEqual({
        indexName: 'courses',
        documentIds: ['c1', 'c2'],
      })
    })

    it('preserves generic type for payload', () => {
      interface EmailPayload {
        to: string
        subject: string
        body: string
      }

      const job = buildTenantJob<EmailPayload>('tenant-4', 'send-email', {
        to: 'student@akademate.com',
        subject: 'Welcome',
        body: 'Welcome to Akademate!',
      })

      // TypeScript would enforce the payload type at compile time
      expect(job.payload.to).toBe('student@akademate.com')
      expect(job.payload.subject).toBe('Welcome')
      expect(job.payload.body).toBe('Welcome to Akademate!')
    })

    it('does not include optional fields when not provided', () => {
      const job = buildTenantJob('tenant-5', 'send-email', {})

      expect(job.runAt).toBeUndefined()
      expect(job.traceId).toBeUndefined()
    })
  })

  describe('TenantJob type', () => {
    it('allows typed job creation', () => {
      const job: TenantJob<{ recipients: string[] }> = {
        tenantId: 'tenant-6',
        name: 'send-email',
        payload: { recipients: ['a@b.com', 'c@d.com'] },
        runAt: new Date('2025-01-01T10:00:00Z'),
        traceId: 'trace-123',
      }

      expect(job.tenantId).toBe('tenant-6')
      expect(job.runAt).toBeInstanceOf(Date)
      expect(job.traceId).toBe('trace-123')
    })
  })

  describe('JobName type', () => {
    it('contains expected job types', () => {
      const jobNames: JobName[] = ['send-email', 'sync-search', 'webhook']

      expect(jobNames).toHaveLength(3)
      expect(jobNames).toContain('send-email')
      expect(jobNames).toContain('sync-search')
      expect(jobNames).toContain('webhook')
    })
  })
})

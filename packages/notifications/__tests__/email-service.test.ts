/**
 * @fileoverview Email Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EmailService,
  createEmailService,
  getEmailService,
  sendEmail,
  sendNotification,
} from '../src/email-service';
import type {
  EmailConfig,
  EmailMessage,
  WelcomeTemplateData,
  NotificationPayload,
} from '../src/types';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return {
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: 'resend-msg-123' } }),
      },
    };
  }),
}));

describe('EmailService', () => {
  const baseConfig: EmailConfig = {
    provider: 'console',
    fromEmail: 'noreply@test.com',
    fromName: 'Test App',
    replyTo: 'support@test.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // CONSOLE PROVIDER
  // ============================================================================

  describe('Console Provider', () => {
    it('should send email via console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const service = new EmailService(baseConfig);

      const message: EmailMessage = {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
        text: 'Hello',
      };

      const result = await service.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^console-\d+$/);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log email details to console', async () => {
      const logs: string[] = [];
      vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(String(msg)));

      const service = new EmailService(baseConfig);

      await service.send({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
        text: 'Plain text version',
      });

      const fullLog = logs.join('\n');
      expect(fullLog).toContain('To: user@example.com');
      expect(fullLog).toContain('Subject: Test Subject');
      expect(fullLog).toContain('Plain text version');
    });

    it('should handle multiple recipients', async () => {
      const logs: string[] = [];
      vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(String(msg)));

      const service = new EmailService(baseConfig);

      await service.send({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      const fullLog = logs.join('\n');
      expect(fullLog).toContain('user1@example.com, user2@example.com');
    });

    it('should include CC in console output', async () => {
      const logs: string[] = [];
      vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(String(msg)));

      const service = new EmailService(baseConfig);

      await service.send({
        to: 'user@example.com',
        cc: 'cc@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      const fullLog = logs.join('\n');
      expect(fullLog).toContain('CC: cc@example.com');
    });
  });

  // ============================================================================
  // RESEND PROVIDER
  // ============================================================================

  describe('Resend Provider', () => {
    const resendConfig: EmailConfig = {
      ...baseConfig,
      provider: 'resend',
      apiKey: 're_test_12345',
    };

    it('should send email via Resend', async () => {
      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ data: { id: 'resend-123' } });
      (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        function ResendMock() {
          return { emails: { send: mockSend } };
        }
      );

      const service = new EmailService(resendConfig);

      const result = await service.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('resend-123');
    });

    it('should handle Resend errors', async () => {
      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });
      (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        function ResendMock() {
          return { emails: { send: mockSend } };
        }
      );

      const service = new EmailService(resendConfig);

      const result = await service.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should pass correct parameters to Resend', async () => {
      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ data: { id: 'test' } });
      (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        function ResendMock() {
          return { emails: { send: mockSend } };
        }
      );

      const service = new EmailService(resendConfig);

      await service.send({
        to: 'user@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        html: '<p>Content</p>',
        text: 'Plain content',
        replyTo: 'custom-reply@example.com',
        tags: [{ name: 'type', value: 'test' }],
      });

      expect(mockSend).toHaveBeenCalledWith({
        from: 'Test App <noreply@test.com>',
        to: ['user@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test Subject',
        html: '<p>Content</p>',
        text: 'Plain content',
        replyTo: 'custom-reply@example.com',
        tags: [{ name: 'type', value: 'test' }],
      });
    });
  });

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  describe('sendNotification', () => {
    it('should render template and send email', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const service = new EmailService(baseConfig);

      const payload: NotificationPayload<WelcomeTemplateData> = {
        type: 'welcome',
        to: 'user@example.com',
        data: {
          recipientName: 'John Doe',
          recipientEmail: 'user@example.com',
          tenantName: 'Akademate',
          supportEmail: 'support@test.com',
          year: 2024,
          loginUrl: 'https://app.example.com/login',
        },
      };

      const result = await service.sendNotification(payload);

      expect(result.success).toBe(true);
    });

    it('should include notification type in tags', async () => {
      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ data: { id: 'test' } });
      (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        function ResendMock() {
          return { emails: { send: mockSend } };
        }
      );

      const service = new EmailService({
        ...baseConfig,
        provider: 'resend',
        apiKey: 're_test',
      });

      await service.sendNotification({
        type: 'password_reset',
        to: 'user@example.com',
        priority: 'high',
        data: {
          recipientName: 'John',
          recipientEmail: 'user@example.com',
          tenantName: 'Test',
          supportEmail: 'support@test.com',
          year: 2024,
          resetUrl: 'https://example.com/reset',
          expiresIn: '1 hour',
          requestedAt: new Date(),
        },
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining([
            { name: 'notification_type', value: 'password_reset' },
            { name: 'priority', value: 'high' },
          ]),
        })
      );
    });
  });

  // ============================================================================
  // BATCH SENDING
  // ============================================================================

  describe('sendBatch', () => {
    it('should send multiple notifications', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const service = new EmailService(baseConfig);

      const payloads: NotificationPayload<WelcomeTemplateData>[] = [
        {
          type: 'welcome',
          to: 'user1@example.com',
          data: {
            recipientName: 'User 1',
            recipientEmail: 'user1@example.com',
            tenantName: 'Test',
            supportEmail: 'support@test.com',
            year: 2024,
            loginUrl: 'https://example.com/login',
          },
        },
        {
          type: 'welcome',
          to: 'user2@example.com',
          data: {
            recipientName: 'User 2',
            recipientEmail: 'user2@example.com',
            tenantName: 'Test',
            supportEmail: 'support@test.com',
            year: 2024,
            loginUrl: 'https://example.com/login',
          },
        },
      ];

      const results = await service.sendBatch(payloads);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle batch errors gracefully', async () => {
      const { Resend } = await import('resend');
      let callCount = 0;
      (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        function ResendMock() {
          return {
            emails: {
              send: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                  return Promise.resolve({ error: { message: 'Failed' } });
                }
                return Promise.resolve({ data: { id: `msg-${callCount}` } });
              }),
            },
          };
        }
      );

      const service = new EmailService({
        ...baseConfig,
        provider: 'resend',
        apiKey: 're_test',
      });

      const payloads: NotificationPayload<WelcomeTemplateData>[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          type: 'welcome' as const,
          to: `user${i}@example.com`,
          data: {
            recipientName: `User ${i}`,
            recipientEmail: `user${i}@example.com`,
            tenantName: 'Test',
            supportEmail: 'support@test.com',
            year: 2024,
            loginUrl: 'https://example.com/login',
          },
        }));

      const results = await service.sendBatch(payloads);

      expect(results.filter((r) => r.success)).toHaveLength(2);
      expect(results.filter((r) => !r.success)).toHaveLength(1);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should catch and return network errors', async () => {
      const { Resend } = await import('resend');
      (Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        function ResendMock() {
          return {
            emails: {
              send: vi.fn().mockRejectedValue(new Error('Network error')),
            },
          };
        }
      );

      const service = new EmailService({
        ...baseConfig,
        provider: 'resend',
        apiKey: 're_test',
      });

      const result = await service.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should throw error for unconfigured Resend', async () => {
      const service = new EmailService({
        ...baseConfig,
        provider: 'resend',
        // No apiKey
      });

      const result = await service.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Resend not configured');
    });
  });

  // ============================================================================
  // FACTORY FUNCTIONS
  // ============================================================================

  describe('Factory Functions', () => {
    it('should create service with default config', () => {
      const service = createEmailService();
      expect(service).toBeInstanceOf(EmailService);
    });

    it('should create service with custom config', () => {
      const service = createEmailService({
        fromEmail: 'custom@test.com',
        fromName: 'Custom App',
      });
      expect(service).toBeInstanceOf(EmailService);
    });

    it('should return singleton from getEmailService', () => {
      const service1 = getEmailService();
      const service2 = getEmailService();
      expect(service1).toBe(service2);
    });
  });

  // ============================================================================
  // CONVENIENCE FUNCTIONS
  // ============================================================================

  describe('Convenience Functions', () => {
    it('sendEmail should use default service', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
    });

    it('sendNotification should use default service', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendNotification({
        type: 'welcome',
        to: 'user@example.com',
        data: {
          recipientName: 'Test',
          recipientEmail: 'user@example.com',
          tenantName: 'Test',
          supportEmail: 'support@test.com',
          year: 2024,
          loginUrl: 'https://example.com',
        },
      });

      expect(result.success).toBe(true);
    });
  });
});

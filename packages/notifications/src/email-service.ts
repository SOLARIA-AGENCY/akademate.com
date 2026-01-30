/**
 * @fileoverview Email Service
 * Handles email sending via Resend or SMTP
 */

import { Resend } from 'resend';
import type {
  EmailConfig,
  EmailMessage,
  SendEmailResult,
  NotificationPayload,
  TemplateData,
} from './types';
import { renderTemplate, getSubject } from './templates';

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

export class EmailService {
  private config: EmailConfig;
  private resend: Resend | null = null;

  constructor(config: EmailConfig) {
    this.config = config;

    if (config.provider === 'resend' && config.apiKey) {
      this.resend = new Resend(config.apiKey);
    }
  }

  /**
   * Send a raw email message
   */
  async send(message: EmailMessage): Promise<SendEmailResult> {
    const _startTime = Date.now();

    try {
      switch (this.config.provider) {
        case 'resend':
          return await this.sendViaResend(message);
        case 'smtp':
          return await this.sendViaSMTP(message);
        case 'console':
        default:
          return this.sendViaConsole(message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Send failed:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send a notification using a template
   */
  async sendNotification<T extends TemplateData>(
    payload: NotificationPayload<T>
  ): Promise<SendEmailResult> {
    const { type, to, data, cc, bcc, priority } = payload;

    // Render template
    const html = renderTemplate(type, data);
    const subject = getSubject(type, data);

    // Build email message
    const message: EmailMessage = {
      to,
      subject,
      html,
      cc,
      bcc,
      replyTo: this.config.replyTo,
      tags: [
        { name: 'notification_type', value: type },
        { name: 'priority', value: priority || 'normal' },
      ],
    };

    return this.send(message);
  }

  /**
   * Send multiple notifications in batch
   */
  async sendBatch<T extends TemplateData>(
    payloads: NotificationPayload<T>[]
  ): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((payload) => this.sendNotification(payload))
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < payloads.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // ============================================================================
  // PROVIDER IMPLEMENTATIONS
  // ============================================================================

  private async sendViaResend(message: EmailMessage): Promise<SendEmailResult> {
    if (!this.resend) {
      throw new Error('Resend not configured');
    }

    const result = await this.resend.emails.send({
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      cc: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : undefined,
      bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : undefined,
      reply_to: message.replyTo || this.config.replyTo,
      tags: message.tags,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  }

  private async sendViaSMTP(message: EmailMessage): Promise<SendEmailResult> {
    // SMTP implementation would go here using nodemailer
    // For now, fall back to console in development
    console.warn('[EmailService] SMTP not implemented, using console');
    return this.sendViaConsole(message);
  }

  private sendViaConsole(message: EmailMessage): SendEmailResult {
    console.log('\n' + '='.repeat(60));
    console.log('[EmailService] Console Email');
    console.log('='.repeat(60));
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log(`To: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);
    if (message.cc) {
      console.log(`CC: ${Array.isArray(message.cc) ? message.cc.join(', ') : message.cc}`);
    }
    console.log(`Subject: ${message.subject}`);
    console.log('-'.repeat(60));
    console.log(message.text || '[HTML content - view in browser]');
    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let defaultService: EmailService | null = null;

export function createEmailService(config?: Partial<EmailConfig>): EmailService {
  const fullConfig: EmailConfig = {
    provider: (process.env.EMAIL_PROVIDER as EmailConfig['provider']) ?? 'console',
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM ?? 'noreply@akademate.com',
    fromName: process.env.EMAIL_FROM_NAME ?? 'Akademate',
    replyTo: process.env.EMAIL_REPLY_TO,
    ...config,
  };

  return new EmailService(fullConfig);
}

export function getEmailService(): EmailService {
  if (!defaultService) {
    defaultService = createEmailService();
  }
  return defaultService;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  return getEmailService().send(message);
}

export async function sendNotification<T extends TemplateData>(
  payload: NotificationPayload<T>
): Promise<SendEmailResult> {
  return getEmailService().sendNotification(payload);
}

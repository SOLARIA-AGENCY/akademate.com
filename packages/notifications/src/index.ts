/**
 * @fileoverview Akademate Notifications Package
 * Email service and notification templates
 */

// Types
export * from './types';

// Email Service
export {
  EmailService,
  createEmailService,
  getEmailService,
  sendEmail,
  sendNotification,
} from './email-service';

// Templates
export {
  renderTemplate,
  getSubject,
  formatDate,
  formatCurrency,
} from './templates';

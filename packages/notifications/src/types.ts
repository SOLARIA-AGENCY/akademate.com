/**
 * @fileoverview Email Notification Types
 * Types for email service and templates
 */

export type EmailProvider = 'resend' | 'smtp' | 'console';

export interface EmailConfig {
  provider: EmailProvider;
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export type NotificationType =
  | 'welcome'
  | 'password_reset'
  | 'enrollment_confirmed'
  | 'course_started'
  | 'lesson_reminder'
  | 'certificate_issued'
  | 'payment_received'
  | 'payment_failed'
  | 'trial_ending'
  | 'account_locked'
  | 'new_lead'
  | 'lead_assigned'
  | 'campaign_report';

export interface BaseTemplateData {
  recipientName: string;
  recipientEmail: string;
  tenantName: string;
  tenantLogo?: string;
  supportEmail: string;
  unsubscribeUrl?: string;
  year: number;
}

export interface WelcomeTemplateData extends BaseTemplateData {
  loginUrl: string;
  temporaryPassword?: string;
}

export interface PasswordResetTemplateData extends BaseTemplateData {
  resetUrl: string;
  expiresIn: string;
  requestedAt: Date;
  ipAddress?: string;
}

export interface EnrollmentConfirmedTemplateData extends BaseTemplateData {
  courseName: string;
  courseRunName: string;
  startDate: Date;
  endDate: Date;
  campusName?: string;
  instructorName?: string;
  accessUrl: string;
}

export interface CourseStartedTemplateData extends BaseTemplateData {
  courseName: string;
  courseRunName: string;
  firstLessonTitle: string;
  totalLessons: number;
  estimatedDuration: string;
  accessUrl: string;
}

export interface LessonReminderTemplateData extends BaseTemplateData {
  courseName: string;
  lessonTitle: string;
  dueDate?: Date;
  progressPercent: number;
  accessUrl: string;
}

export interface CertificateIssuedTemplateData extends BaseTemplateData {
  courseName: string;
  completionDate: Date;
  certificateUrl: string;
  shareUrl?: string;
}

export interface PaymentReceivedTemplateData extends BaseTemplateData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  description: string;
  paymentDate: Date;
  invoiceUrl?: string;
}

export interface PaymentFailedTemplateData extends BaseTemplateData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  failureReason: string;
  updatePaymentUrl: string;
  retryDate?: Date;
}

export interface TrialEndingTemplateData extends BaseTemplateData {
  daysRemaining: number;
  trialEndDate: Date;
  planName: string;
  upgradeUrl: string;
}

export interface AccountLockedTemplateData extends BaseTemplateData {
  reason: string;
  lockDate: Date;
  unlockUrl?: string;
  supportUrl: string;
}

export interface NewLeadTemplateData extends BaseTemplateData {
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  source: string;
  interestedIn?: string;
  leadScore: number;
  dashboardUrl: string;
}

export interface LeadAssignedTemplateData extends BaseTemplateData {
  leadName: string;
  leadEmail: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  dashboardUrl: string;
}

export interface CampaignReportTemplateData extends BaseTemplateData {
  campaignName: string;
  reportPeriod: string;
  totalLeads: number;
  conversionRate: number;
  topPerformingAd?: string;
  reportUrl: string;
}

export type TemplateData =
  | WelcomeTemplateData
  | PasswordResetTemplateData
  | EnrollmentConfirmedTemplateData
  | CourseStartedTemplateData
  | LessonReminderTemplateData
  | CertificateIssuedTemplateData
  | PaymentReceivedTemplateData
  | PaymentFailedTemplateData
  | TrialEndingTemplateData
  | AccountLockedTemplateData
  | NewLeadTemplateData
  | LeadAssignedTemplateData
  | CampaignReportTemplateData;

export interface NotificationPayload<T extends TemplateData = TemplateData> {
  type: NotificationType;
  to: string | string[];
  data: T;
  cc?: string | string[];
  bcc?: string | string[];
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

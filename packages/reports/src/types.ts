/**
 * @fileoverview Report Types
 * Type definitions for PDF and Excel report generation
 */

// =============================================================================
// COMMON
// =============================================================================

export type ReportFormat = 'pdf' | 'excel';
export type ReportOrientation = 'portrait' | 'landscape';
export type ReportSize = 'A4' | 'letter' | 'legal';

export interface ReportMeta {
  title: string;
  subtitle?: string;
  author?: string;
  createdAt: Date;
  tenantName: string;
  tenantLogo?: string;
  pageSize?: ReportSize;
  orientation?: ReportOrientation;
}

export interface ReportColumn<T = unknown> {
  key: keyof T | string;
  header: string;
  width?: number | 'auto';
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown, row: T) => string;
}

export interface ReportResult {
  success: boolean;
  data?: Buffer | Uint8Array;
  error?: string;
  filename?: string;
  mimeType?: string;
}

// =============================================================================
// PDF SPECIFIC
// =============================================================================

export interface PdfStyles {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
  headerFontSize?: number;
  tableFontSize?: number;
}

export interface PdfReportOptions {
  meta: ReportMeta;
  styles?: PdfStyles;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  watermark?: string;
}

// =============================================================================
// EXCEL SPECIFIC
// =============================================================================

export interface ExcelStyles {
  headerBgColor?: string;
  headerFontColor?: string;
  alternateRowColor?: string;
  borderColor?: string;
}

export interface ExcelSheetOptions {
  name: string;
  columns: ReportColumn[];
  data: unknown[];
  freezeHeader?: boolean;
  autoFilter?: boolean;
}

export interface ExcelReportOptions {
  meta: ReportMeta;
  sheets: ExcelSheetOptions[];
  styles?: ExcelStyles;
  protectSheet?: boolean;
}

// =============================================================================
// REPORT TYPES
// =============================================================================

/** Enrollment report data */
export interface EnrollmentReportRow {
  studentName: string;
  studentEmail: string;
  courseName: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  progress: number;
  grade?: number;
  campusName?: string;
}

/** Attendance report data */
export interface AttendanceReportRow {
  studentName: string;
  courseRunName: string;
  sessionDate: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

/** Lead report data */
export interface LeadReportRow {
  name: string;
  email: string;
  phone?: string;
  source: string;
  campaign?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  createdAt: Date;
  assignedTo?: string;
}

/** Revenue report data */
export interface RevenueReportRow {
  period: string;
  courseName: string;
  enrollments: number;
  revenue: number;
  currency: string;
  avgTicket: number;
}

/** Course completion report */
export interface CourseCompletionReportRow {
  courseName: string;
  totalEnrollments: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  dropped: number;
  avgProgress: number;
  avgGrade: number;
}

/** Student progress report */
export interface StudentProgressReportRow {
  studentName: string;
  studentEmail: string;
  courseName: string;
  modulesCompleted: number;
  totalModules: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesCompleted: number;
  avgQuizScore: number;
  timeSpent: number;
  lastActivity: Date;
}

/** Certificate report */
export interface CertificateReportRow {
  studentName: string;
  studentEmail: string;
  courseName: string;
  certificateCode: string;
  issueDate: Date;
  expiryDate?: Date;
  grade: number;
}

/** Campaign performance report */
export interface CampaignReportRow {
  campaignName: string;
  source: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  cost: number;
  roi: number;
  startDate: Date;
  endDate?: Date;
}

// =============================================================================
// GENERATOR INTERFACES
// =============================================================================

export interface ReportGenerator<T> {
  generate(data: T[], options: PdfReportOptions | ExcelReportOptions): Promise<ReportResult>;
}

export interface PdfGenerator {
  generatePdf<T>(
    data: T[],
    columns: ReportColumn<T>[],
    options: PdfReportOptions
  ): Promise<ReportResult>;
}

export interface ExcelGenerator {
  generateExcel(options: ExcelReportOptions): Promise<ReportResult>;
}

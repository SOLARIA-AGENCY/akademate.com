/**
 * @fileoverview CSV Import Types
 * Type definitions for bulk import functionality
 */

import { z } from 'zod';

// =============================================================================
// IMPORT RESULT TYPES
// =============================================================================

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportError {
  row: number;
  column?: string;
  value?: string;
  message: string;
  code: string;
}

export interface ImportWarning {
  row: number;
  column?: string;
  message: string;
}

export interface ImportResult<T = unknown> {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  data: T[];
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportProgress {
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  percentage: number;
  errors: number;
  startedAt: Date;
  completedAt?: Date;
}

// =============================================================================
// PARSER OPTIONS
// =============================================================================

export interface CsvParseOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  encoding?: BufferEncoding;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
  hasHeader?: boolean;
  maxRows?: number;
}

export interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  required?: boolean;
  transform?: (value: string) => unknown;
  validate?: (value: unknown) => boolean;
}

// =============================================================================
// IMPORT SCHEMAS
// =============================================================================

/** Student import schema */
export const studentImportSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export type StudentImportData = z.infer<typeof studentImportSchema>;

/** Lead import schema */
export const leadImportSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  source: z.string().optional(),
  campaign: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

export type LeadImportData = z.infer<typeof leadImportSchema>;

/** Enrollment import schema */
export const enrollmentImportSchema = z.object({
  studentEmail: z.string().email('Invalid student email'),
  courseCode: z.string().min(1, 'Course code is required'),
  enrolledAt: z.string().optional(),
  status: z.enum(['active', 'pending', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export type EnrollmentImportData = z.infer<typeof enrollmentImportSchema>;

/** Attendance import schema */
export const attendanceImportSchema = z.object({
  studentEmail: z.string().email('Invalid student email'),
  courseRunCode: z.string().min(1, 'Course run code is required'),
  sessionDate: z.string().min(1, 'Session date is required'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
});

export type AttendanceImportData = z.infer<typeof attendanceImportSchema>;

/** Course import schema */
export const courseImportSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

export type CourseImportData = z.infer<typeof courseImportSchema>;

// =============================================================================
// IMPORT TYPES
// =============================================================================

export type ImportType = 'students' | 'leads' | 'enrollments' | 'attendance' | 'courses';

export interface ImportConfig<T> {
  type: ImportType;
  schema: z.ZodSchema<T>;
  columnMappings: Record<string, string>;
  requiredColumns: string[];
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export interface ExportOptions {
  columns: string[];
  filename?: string;
  includeHeader?: boolean;
  delimiter?: string;
}

export interface ExportResult {
  success: boolean;
  data?: Buffer;
  filename?: string;
  mimeType?: string;
  rowCount?: number;
  error?: string;
}

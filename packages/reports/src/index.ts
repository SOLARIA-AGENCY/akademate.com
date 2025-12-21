/**
 * @fileoverview Akademate Reports Package
 * PDF and Excel report generation
 */

// Types
export * from './types';

// Excel Generator
export {
  ExcelReportGenerator,
  generateEnrollmentExcel,
  generateAttendanceExcel,
  generateLeadExcel,
  generateRevenueExcel,
} from './excel';

// PDF Generator
export {
  PdfReportGenerator,
  generateEnrollmentPdf,
  generateAttendancePdf,
  generateLeadPdf,
} from './pdf';

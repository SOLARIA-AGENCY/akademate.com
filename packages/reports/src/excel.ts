/**
 * @fileoverview Excel Report Generator
 * Uses ExcelJS for spreadsheet generation
 */

import ExcelJS from 'exceljs';
import type {
  ExcelReportOptions,
  ExcelSheetOptions,
  ExcelStyles,
  ReportResult,
  ReportColumn,
} from './types';

// =============================================================================
// DEFAULT STYLES
// =============================================================================

const defaultStyles: ExcelStyles = {
  headerBgColor: '6366F1',
  headerFontColor: 'FFFFFF',
  alternateRowColor: 'F4F4F5',
  borderColor: 'E4E4E7',
};

// =============================================================================
// EXCEL GENERATOR CLASS
// =============================================================================

export class ExcelReportGenerator {
  private styles: ExcelStyles;

  constructor(styles?: ExcelStyles) {
    this.styles = { ...defaultStyles, ...styles };
  }

  /**
   * Generate Excel workbook from options
   */
  async generate(options: ExcelReportOptions): Promise<ReportResult> {
    try {
      const workbook = new ExcelJS.Workbook();

      // Set workbook properties
      workbook.creator = options.meta.author || 'Akademate';
      workbook.created = options.meta.createdAt;
      workbook.modified = new Date();
      workbook.company = options.meta.tenantName;

      // Add sheets
      for (const sheetOptions of options.sheets) {
        await this.addSheet(workbook, sheetOptions);
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        success: true,
        data: Buffer.from(buffer),
        filename: this.generateFilename(options.meta.title),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating Excel',
      };
    }
  }

  /**
   * Add sheet to workbook
   */
  private async addSheet(
    workbook: ExcelJS.Workbook,
    options: ExcelSheetOptions
  ): Promise<void> {
    const worksheet = workbook.addWorksheet(options.name, {
      views: options.freezeHeader ? [{ state: 'frozen', ySplit: 1 }] : undefined,
    });

    // Configure columns
    worksheet.columns = options.columns.map((col) => ({
      header: col.header,
      key: String(col.key),
      width: col.width === 'auto' ? undefined : (col.width as number) || 15,
      style: {
        alignment: {
          horizontal: col.align || 'left',
          vertical: 'middle',
        },
      },
    }));

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: this.styles.headerFontColor } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.styles.headerBgColor },
    };
    headerRow.height = 25;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    options.data.forEach((row, index) => {
      const excelRow = worksheet.addRow(
        this.formatRow(row as Record<string, unknown>, options.columns)
      );

      // Alternate row colors
      if (index % 2 === 1) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: this.styles.alternateRowColor },
        };
      }

      excelRow.height = 20;
    });

    // Apply borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: this.styles.borderColor } },
          left: { style: 'thin', color: { argb: this.styles.borderColor } },
          bottom: { style: 'thin', color: { argb: this.styles.borderColor } },
          right: { style: 'thin', color: { argb: this.styles.borderColor } },
        };
      });
    });

    // Auto filter
    if (options.autoFilter && options.data.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: options.data.length + 1, column: options.columns.length },
      };
    }
  }

  /**
   * Format row data using column formatters
   */
  private formatRow(
    row: Record<string, unknown>,
    columns: ReportColumn[]
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const col of columns) {
      const key = String(col.key);
      const value = row[key];

      if (col.format) {
        result[key] = col.format(value, row);
      } else if (value instanceof Date) {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Generate safe filename
   */
  private generateFilename(title: string): string {
    const safeTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const date = new Date().toISOString().split('T')[0];
    return `${safeTitle}-${date}.xlsx`;
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Generate enrollment report as Excel
 */
export async function generateEnrollmentExcel(
  data: Array<{
    studentName: string;
    studentEmail: string;
    courseName: string;
    enrolledAt: Date;
    status: string;
    progress: number;
    grade?: number;
    campusName?: string;
  }>,
  tenantName: string
): Promise<ReportResult> {
  const generator = new ExcelReportGenerator();

  return generator.generate({
    meta: {
      title: 'Reporte de Matrículas',
      tenantName,
      createdAt: new Date(),
    },
    sheets: [
      {
        name: 'Matrículas',
        columns: [
          { key: 'studentName', header: 'Alumno', width: 25 },
          { key: 'studentEmail', header: 'Email', width: 30 },
          { key: 'courseName', header: 'Curso', width: 30 },
          { key: 'campusName', header: 'Sede', width: 20 },
          {
            key: 'enrolledAt',
            header: 'Fecha Matrícula',
            width: 18,
            format: (v) => formatDate(v as Date),
          },
          { key: 'status', header: 'Estado', width: 12 },
          {
            key: 'progress',
            header: 'Progreso',
            width: 12,
            align: 'right',
            format: (v) => `${v}%`,
          },
          {
            key: 'grade',
            header: 'Nota',
            width: 10,
            align: 'right',
            format: (v) => (v != null ? String(v) : '-'),
          },
        ],
        data,
        freezeHeader: true,
        autoFilter: true,
      },
    ],
  });
}

/**
 * Generate attendance report as Excel
 */
export async function generateAttendanceExcel(
  data: Array<{
    studentName: string;
    courseRunName: string;
    sessionDate: Date;
    checkInTime?: Date;
    checkOutTime?: Date;
    status: string;
    notes?: string;
  }>,
  tenantName: string
): Promise<ReportResult> {
  const generator = new ExcelReportGenerator();

  return generator.generate({
    meta: {
      title: 'Reporte de Asistencia',
      tenantName,
      createdAt: new Date(),
    },
    sheets: [
      {
        name: 'Asistencia',
        columns: [
          { key: 'studentName', header: 'Alumno', width: 25 },
          { key: 'courseRunName', header: 'Convocatoria', width: 30 },
          {
            key: 'sessionDate',
            header: 'Fecha',
            width: 15,
            format: (v) => formatDate(v as Date),
          },
          {
            key: 'checkInTime',
            header: 'Entrada',
            width: 12,
            format: (v) => formatTime(v as Date | undefined),
          },
          {
            key: 'checkOutTime',
            header: 'Salida',
            width: 12,
            format: (v) => formatTime(v as Date | undefined),
          },
          { key: 'status', header: 'Estado', width: 12 },
          { key: 'notes', header: 'Notas', width: 30 },
        ],
        data,
        freezeHeader: true,
        autoFilter: true,
      },
    ],
  });
}

/**
 * Generate lead report as Excel
 */
export async function generateLeadExcel(
  data: Array<{
    name: string;
    email: string;
    phone?: string;
    source: string;
    campaign?: string;
    status: string;
    score: number;
    createdAt: Date;
    assignedTo?: string;
  }>,
  tenantName: string
): Promise<ReportResult> {
  const generator = new ExcelReportGenerator();

  return generator.generate({
    meta: {
      title: 'Reporte de Leads',
      tenantName,
      createdAt: new Date(),
    },
    sheets: [
      {
        name: 'Leads',
        columns: [
          { key: 'name', header: 'Nombre', width: 25 },
          { key: 'email', header: 'Email', width: 30 },
          { key: 'phone', header: 'Teléfono', width: 15 },
          { key: 'source', header: 'Fuente', width: 15 },
          { key: 'campaign', header: 'Campaña', width: 20 },
          { key: 'status', header: 'Estado', width: 12 },
          { key: 'score', header: 'Score', width: 10, align: 'right' },
          {
            key: 'createdAt',
            header: 'Fecha',
            width: 15,
            format: (v) => formatDate(v as Date),
          },
          { key: 'assignedTo', header: 'Asignado', width: 20 },
        ],
        data,
        freezeHeader: true,
        autoFilter: true,
      },
    ],
  });
}

/**
 * Generate revenue report as Excel
 */
export async function generateRevenueExcel(
  data: Array<{
    period: string;
    courseName: string;
    enrollments: number;
    revenue: number;
    currency: string;
    avgTicket: number;
  }>,
  tenantName: string
): Promise<ReportResult> {
  const generator = new ExcelReportGenerator();

  return generator.generate({
    meta: {
      title: 'Reporte de Ingresos',
      tenantName,
      createdAt: new Date(),
    },
    sheets: [
      {
        name: 'Ingresos',
        columns: [
          { key: 'period', header: 'Período', width: 15 },
          { key: 'courseName', header: 'Curso', width: 30 },
          { key: 'enrollments', header: 'Matrículas', width: 12, align: 'right' },
          {
            key: 'revenue',
            header: 'Ingresos',
            width: 15,
            align: 'right',
            format: (v, row) => formatCurrency(v as number, (row as { currency: string }).currency),
          },
          {
            key: 'avgTicket',
            header: 'Ticket Medio',
            width: 15,
            align: 'right',
            format: (v, row) => formatCurrency(v as number, (row as { currency: string }).currency),
          },
        ],
        data,
        freezeHeader: true,
        autoFilter: true,
      },
    ],
  });
}

// =============================================================================
// FORMATTERS
// =============================================================================

function formatDate(date: Date | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}

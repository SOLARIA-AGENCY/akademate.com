/**
 * @fileoverview PDF Report Generator
 * Uses @react-pdf/renderer for PDF generation
 */

import type {
  PdfReportOptions,
  ReportResult,
  ReportColumn,
  PdfStyles,
  ReportSize,
} from './types';

// =============================================================================
// DEFAULT STYLES
// =============================================================================

const defaultStyles: PdfStyles = {
  primaryColor: '#6366F1',
  secondaryColor: '#8B5CF6',
  fontFamily: 'Helvetica',
  fontSize: 10,
  headerFontSize: 18,
  tableFontSize: 9,
};

// =============================================================================
// PDF GENERATOR CLASS
// =============================================================================

export class PdfReportGenerator {
  private styles: PdfStyles;

  constructor(styles?: PdfStyles) {
    this.styles = { ...defaultStyles, ...styles };
  }

  /**
   * Generate PDF from data and columns
   */
  async generate<T>(
    data: T[],
    columns: ReportColumn<T>[],
    options: PdfReportOptions
  ): Promise<ReportResult> {
    try {
      // Dynamic import to avoid SSR issues
      const { Document, Page, Text, View, StyleSheet, renderToBuffer } = await import(
        '@react-pdf/renderer'
      );
      const React = await import('react');

      // Create styles
      const styles = StyleSheet.create({
        page: {
          padding: 40,
          fontFamily: this.styles.fontFamily ?? 'Helvetica',
          fontSize: this.styles.fontSize ?? 10,
        },
        header: {
          marginBottom: 20,
          borderBottomWidth: 2,
          borderBottomColor: this.styles.primaryColor ?? '#6366F1',
          paddingBottom: 10,
        },
        title: {
          fontSize: this.styles.headerFontSize ?? 18,
          fontWeight: 'bold',
          color: this.styles.primaryColor ?? '#6366F1',
        },
        subtitle: {
          fontSize: 12,
          color: '#71717A',
          marginTop: 4,
        },
        meta: {
          fontSize: 9,
          color: '#A1A1AA',
          marginTop: 8,
        },
        table: {
          marginTop: 20,
        },
        tableHeader: {
          flexDirection: 'row',
          backgroundColor: this.styles.primaryColor ?? '#6366F1',
          padding: 8,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        },
        tableHeaderCell: {
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: this.styles.tableFontSize ?? 9,
        },
        tableRow: {
          flexDirection: 'row',
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#E4E4E7',
        },
        tableRowAlt: {
          backgroundColor: '#F4F4F5',
        },
        tableCell: {
          fontSize: this.styles.tableFontSize ?? 9,
        },
        footer: {
          position: 'absolute',
          bottom: 30,
          left: 40,
          right: 40,
          flexDirection: 'row',
          justifyContent: 'space-between',
          fontSize: 8,
          color: '#71717A',
        },
        watermark: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: 60,
          color: '#E4E4E7',
          opacity: 0.3,
        },
      });

      // Calculate column widths
      const totalWidth = 100;
      const colWidth = totalWidth / columns.length;

      // Create document
      const doc = React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          {
            size: mapPageSize(options.meta.pageSize),
            orientation: options.meta.orientation ?? 'portrait',
            style: styles.page,
          },
          // Watermark
          options.watermark &&
            React.createElement(Text, { style: styles.watermark }, options.watermark),
          // Header
          options.includeHeader !== false &&
            React.createElement(
              View,
              { style: styles.header },
              React.createElement(Text, { style: styles.title }, options.meta.title),
              options.meta.subtitle &&
                React.createElement(Text, { style: styles.subtitle }, options.meta.subtitle),
              React.createElement(
                Text,
                { style: styles.meta },
                `${options.meta.tenantName} | Generado: ${formatDate(options.meta.createdAt)}`
              )
            ),
          // Table
          React.createElement(
            View,
            { style: styles.table },
            // Table Header
            React.createElement(
              View,
              { style: styles.tableHeader },
              columns.map((col, i) =>
                React.createElement(
                  Text,
                  {
                    key: i,
                    style: [
                      styles.tableHeaderCell,
                      { width: `${colWidth}%`, textAlign: col.align ?? 'left' },
                    ],
                  },
                  col.header
                )
              )
            ),
            // Table Body
            data.map((row, rowIndex) =>
              React.createElement(
                View,
                {
                  key: rowIndex,
                  style:
                    rowIndex % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow,
                },
                columns.map((col, colIndex) =>
                  React.createElement(
                    Text,
                    {
                      key: colIndex,
                      style: [
                        styles.tableCell,
                        { width: `${colWidth}%`, textAlign: col.align ?? 'left' },
                      ],
                    },
                    formatCellValue(row, col)
                  )
                )
              )
            )
          ),
          // Footer
          options.includeFooter !== false &&
            React.createElement(
              View,
              { style: styles.footer, fixed: true },
              React.createElement(Text, null, `© ${new Date().getFullYear()} ${options.meta.tenantName}`),
              options.includePageNumbers !== false &&
                React.createElement(
                  Text,
                  { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Página ${pageNumber} de ${totalPages}` }
                )
            )
        )
      );

      // Render to buffer
      const buffer = await renderToBuffer(doc);

      return {
        success: true,
        data: buffer,
        filename: this.generateFilename(options.meta.title),
        mimeType: 'application/pdf',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating PDF',
      };
    }
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
    return `${safeTitle}-${date}.pdf`;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCellValue<T>(row: T, col: ReportColumn<T>): string {
  const value = (row as Record<string, unknown>)[col.key as string];

  if (col.format) {
    return col.format(value, row);
  }

  if (value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  return String(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function mapPageSize(size?: ReportSize): 'A4' | 'LETTER' | 'LEGAL' | undefined {
  if (!size) return undefined;
  switch (size) {
    case 'letter':
      return 'LETTER';
    case 'legal':
      return 'LEGAL';
    case 'A4':
      return 'A4';
    default:
      return undefined;
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Generate enrollment report as PDF
 */
export async function generateEnrollmentPdf(
  data: {
    studentName: string;
    studentEmail: string;
    courseName: string;
    enrolledAt: Date;
    status: string;
    progress: number;
  }[],
  tenantName: string
): Promise<ReportResult> {
  const generator = new PdfReportGenerator();

  return generator.generate(data, [
    { key: 'studentName', header: 'Alumno' },
    { key: 'studentEmail', header: 'Email' },
    { key: 'courseName', header: 'Curso' },
    { key: 'enrolledAt', header: 'Fecha', format: (v) => formatDate(v as Date) },
    { key: 'status', header: 'Estado' },
    { key: 'progress', header: 'Progreso', align: 'right', format: (v) => `${v}%` },
  ], {
    meta: {
      title: 'Reporte de Matrículas',
      tenantName,
      createdAt: new Date(),
    },
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
  });
}

/**
 * Generate attendance report as PDF
 */
export async function generateAttendancePdf(
  data: {
    studentName: string;
    courseRunName: string;
    sessionDate: Date;
    status: string;
  }[],
  tenantName: string
): Promise<ReportResult> {
  const generator = new PdfReportGenerator();

  return generator.generate(data, [
    { key: 'studentName', header: 'Alumno' },
    { key: 'courseRunName', header: 'Convocatoria' },
    { key: 'sessionDate', header: 'Fecha', format: (v) => formatDate(v as Date) },
    { key: 'status', header: 'Estado' },
  ], {
    meta: {
      title: 'Reporte de Asistencia',
      tenantName,
      createdAt: new Date(),
    },
  });
}

/**
 * Generate lead report as PDF
 */
export async function generateLeadPdf(
  data: {
    name: string;
    email: string;
    source: string;
    status: string;
    score: number;
    createdAt: Date;
  }[],
  tenantName: string
): Promise<ReportResult> {
  const generator = new PdfReportGenerator();

  return generator.generate(data, [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Email' },
    { key: 'source', header: 'Fuente' },
    { key: 'status', header: 'Estado' },
    { key: 'score', header: 'Score', align: 'right' },
    { key: 'createdAt', header: 'Fecha', format: (v) => formatDate(v as Date) },
  ], {
    meta: {
      title: 'Reporte de Leads',
      tenantName,
      createdAt: new Date(),
    },
  });
}

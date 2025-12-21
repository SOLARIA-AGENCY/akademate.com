/**
 * @fileoverview PDF Report Generator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfReportGenerator } from '../src/pdf';
import type { PdfReportOptions, ReportColumn } from '../src/types';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: vi.fn(({ children }) => ({ type: 'Document', children })),
  Page: vi.fn(({ children }) => ({ type: 'Page', children })),
  View: vi.fn(({ children }) => ({ type: 'View', children })),
  Text: vi.fn(({ children }) => ({ type: 'Text', children })),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
}));

describe('PdfReportGenerator', () => {
  let generator: PdfReportGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new PdfReportGenerator();
  });

  // ============================================================================
  // BASIC GENERATION
  // ============================================================================

  describe('Basic Generation', () => {
    it('should generate PDF with data', async () => {
      const data = [
        { name: 'Item 1', value: 100 },
        { name: 'Item 2', value: 200 },
      ];

      const columns: ReportColumn<typeof data[0]>[] = [
        { key: 'name', header: 'Name' },
        { key: 'value', header: 'Value' },
      ];

      const options: PdfReportOptions = {
        meta: {
          title: 'Test Report',
          tenantName: 'Test Academy',
          createdAt: new Date('2024-01-15'),
        },
      };

      const result = await generator.generate(data, columns, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should generate correct filename', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Monthly Report - January',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
        }
      );

      expect(result.filename).toMatch(/^monthly-report-january-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should handle empty data array', async () => {
      const result = await generator.generate(
        [],
        [{ key: 'name', header: 'Name' }],
        {
          meta: {
            title: 'Empty Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
        }
      );

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // OPTIONS
  // ============================================================================

  describe('Report Options', () => {
    it('should respect page size option', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Letter Size Report',
            tenantName: 'Academy',
            createdAt: new Date(),
            pageSize: 'letter',
          },
        }
      );

      expect(result.success).toBe(true);
    });

    it('should respect orientation option', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Landscape Report',
            tenantName: 'Academy',
            createdAt: new Date(),
            orientation: 'landscape',
          },
        }
      );

      expect(result.success).toBe(true);
    });

    it('should include subtitle when provided', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Main Title',
            subtitle: 'Detailed Subtitle',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
        }
      );

      expect(result.success).toBe(true);
    });

    it('should include watermark when provided', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Draft Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
          watermark: 'DRAFT',
        }
      );

      expect(result.success).toBe(true);
    });

    it('should disable header when specified', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'No Header Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
          includeHeader: false,
        }
      );

      expect(result.success).toBe(true);
    });

    it('should disable footer when specified', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'No Footer Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
          includeFooter: false,
        }
      );

      expect(result.success).toBe(true);
    });

    it('should disable page numbers when specified', async () => {
      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'No Page Numbers',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
          includePageNumbers: false,
        }
      );

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // CUSTOM STYLES
  // ============================================================================

  describe('Custom Styles', () => {
    it('should apply custom primary color', async () => {
      const customGenerator = new PdfReportGenerator({
        primaryColor: '#10B981',
      });

      const result = await customGenerator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Custom Color Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
        }
      );

      expect(result.success).toBe(true);
    });

    it('should apply custom font sizes', async () => {
      const customGenerator = new PdfReportGenerator({
        fontSize: 12,
        headerFontSize: 24,
        tableFontSize: 10,
      });

      const result = await customGenerator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Custom Font Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
        }
      );

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // COLUMN FORMATTING
  // ============================================================================

  describe('Column Formatting', () => {
    it('should apply format function to values', async () => {
      interface DataRow {
        name: string;
        price: number;
      }

      const data: DataRow[] = [
        { name: 'Product A', price: 99.9 },
        { name: 'Product B', price: 149.5 },
      ];

      const columns: ReportColumn<DataRow>[] = [
        { key: 'name', header: 'Name' },
        {
          key: 'price',
          header: 'Price',
          format: (v) => `€${(v as number).toFixed(2)}`,
        },
      ];

      const result = await generator.generate(data, columns, {
        meta: {
          title: 'Formatted Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle null values', async () => {
      const data = [
        { name: 'Item 1', optional: 'value' },
        { name: 'Item 2', optional: null },
      ];

      const columns: ReportColumn<typeof data[0]>[] = [
        { key: 'name', header: 'Name' },
        { key: 'optional', header: 'Optional' },
      ];

      const result = await generator.generate(data, columns, {
        meta: {
          title: 'Null Values Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle date values', async () => {
      const data = [
        { event: 'Start', date: new Date('2024-01-01') },
        { event: 'End', date: new Date('2024-12-31') },
      ];

      const columns: ReportColumn<typeof data[0]>[] = [
        { key: 'event', header: 'Event' },
        { key: 'date', header: 'Date' },
      ];

      const result = await generator.generate(data, columns, {
        meta: {
          title: 'Date Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle column alignment', async () => {
      const data = [{ left: 'L', center: 'C', right: 'R' }];

      const columns: ReportColumn<typeof data[0]>[] = [
        { key: 'left', header: 'Left', align: 'left' },
        { key: 'center', header: 'Center', align: 'center' },
        { key: 'right', header: 'Right', align: 'right' },
      ];

      const result = await generator.generate(data, columns, {
        meta: {
          title: 'Aligned Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should return error result on render failure', async () => {
      // Override the mock for this test
      const { renderToBuffer } = await import('@react-pdf/renderer');
      (renderToBuffer as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Render failed')
      );

      const result = await generator.generate(
        [{ id: 1 }],
        [{ key: 'id', header: 'ID' }],
        {
          meta: {
            title: 'Error Report',
            tenantName: 'Academy',
            createdAt: new Date(),
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Render failed');
    });
  });
});

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

describe('PDF Convenience Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEnrollmentPdf', () => {
    it('should generate enrollment PDF', async () => {
      const { generateEnrollmentPdf } = await import('../src/pdf');

      const data = [
        {
          studentName: 'John Doe',
          studentEmail: 'john@example.com',
          courseName: 'React Advanced',
          enrolledAt: new Date('2024-01-15'),
          status: 'active',
          progress: 75,
        },
      ];

      const result = await generateEnrollmentPdf(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/matr.*\.pdf$/);
    });
  });

  describe('generateAttendancePdf', () => {
    it('should generate attendance PDF', async () => {
      const { generateAttendancePdf } = await import('../src/pdf');

      const data = [
        {
          studentName: 'John Doe',
          courseRunName: 'React - Enero 2024',
          sessionDate: new Date('2024-01-15'),
          status: 'present',
        },
      ];

      const result = await generateAttendancePdf(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toContain('asistencia');
    });
  });

  describe('generateLeadPdf', () => {
    it('should generate lead PDF', async () => {
      const { generateLeadPdf } = await import('../src/pdf');

      const data = [
        {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          source: 'Google Ads',
          status: 'qualified',
          score: 85,
          createdAt: new Date('2024-01-10'),
        },
      ];

      const result = await generateLeadPdf(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toContain('leads');
    });
  });
});

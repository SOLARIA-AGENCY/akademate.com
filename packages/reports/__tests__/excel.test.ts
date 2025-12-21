/**
 * @fileoverview Excel Report Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExcelReportGenerator,
  generateEnrollmentExcel,
  generateAttendanceExcel,
  generateLeadExcel,
  generateRevenueExcel,
} from '../src/excel';
import type { ExcelReportOptions } from '../src/types';

describe('ExcelReportGenerator', () => {
  let generator: ExcelReportGenerator;

  beforeEach(() => {
    generator = new ExcelReportGenerator();
  });

  // ============================================================================
  // BASIC GENERATION
  // ============================================================================

  describe('Basic Generation', () => {
    it('should generate Excel with single sheet', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Test Report',
          tenantName: 'Test Academy',
          createdAt: new Date('2024-01-15'),
        },
        sheets: [
          {
            name: 'Data',
            columns: [
              { key: 'name', header: 'Name', width: 20 },
              { key: 'value', header: 'Value', width: 15 },
            ],
            data: [
              { name: 'Item 1', value: 100 },
              { name: 'Item 2', value: 200 },
            ],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should generate filename from title', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Monthly Report - January 2024',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ key: 'id', header: 'ID' }],
            data: [{ id: 1 }],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.filename).toMatch(/^monthly-report-january-2024-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should handle multiple sheets', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Multi Sheet Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Sheet 1',
            columns: [{ key: 'a', header: 'A' }],
            data: [{ a: 1 }],
          },
          {
            name: 'Sheet 2',
            columns: [{ key: 'b', header: 'B' }],
            data: [{ b: 2 }],
          },
          {
            name: 'Sheet 3',
            columns: [{ key: 'c', header: 'C' }],
            data: [{ c: 3 }],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle empty data array', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Empty Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Empty',
            columns: [{ key: 'name', header: 'Name' }],
            data: [],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // COLUMN FORMATTING
  // ============================================================================

  describe('Column Formatting', () => {
    it('should apply custom format function', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Formatted Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Data',
            columns: [
              { key: 'name', header: 'Name' },
              {
                key: 'price',
                header: 'Price',
                format: (v) => `$${(v as number).toFixed(2)}`,
              },
            ],
            data: [
              { name: 'Product A', price: 99.9 },
              { name: 'Product B', price: 149.5 },
            ],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
    });

    it('should handle date values', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Date Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Dates',
            columns: [
              { key: 'event', header: 'Event' },
              { key: 'date', header: 'Date' },
            ],
            data: [
              { event: 'Start', date: new Date('2024-01-01') },
              { event: 'End', date: new Date('2024-12-31') },
            ],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
    });

    it('should handle column alignment', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Aligned Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Aligned',
            columns: [
              { key: 'left', header: 'Left', align: 'left' },
              { key: 'center', header: 'Center', align: 'center' },
              { key: 'right', header: 'Right', align: 'right' },
            ],
            data: [{ left: 'L', center: 'C', right: 'R' }],
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // SHEET OPTIONS
  // ============================================================================

  describe('Sheet Options', () => {
    it('should apply freeze header option', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Frozen Header',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Frozen',
            columns: [{ key: 'id', header: 'ID' }],
            data: Array(100)
              .fill(null)
              .map((_, i) => ({ id: i + 1 })),
            freezeHeader: true,
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
    });

    it('should apply auto filter option', async () => {
      const options: ExcelReportOptions = {
        meta: {
          title: 'Filtered',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Filtered',
            columns: [
              { key: 'category', header: 'Category' },
              { key: 'value', header: 'Value' },
            ],
            data: [
              { category: 'A', value: 1 },
              { category: 'B', value: 2 },
              { category: 'A', value: 3 },
            ],
            autoFilter: true,
          },
        ],
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // CUSTOM STYLES
  // ============================================================================

  describe('Custom Styles', () => {
    it('should apply custom header colors', async () => {
      const styledGenerator = new ExcelReportGenerator({
        headerBgColor: '10B981',
        headerFontColor: 'FFFFFF',
      });

      const options: ExcelReportOptions = {
        meta: {
          title: 'Styled Report',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Styled',
            columns: [{ key: 'id', header: 'ID' }],
            data: [{ id: 1 }],
          },
        ],
      };

      const result = await styledGenerator.generate(options);

      expect(result.success).toBe(true);
    });

    it('should apply alternate row color', async () => {
      const styledGenerator = new ExcelReportGenerator({
        alternateRowColor: 'E0F2FE',
      });

      const options: ExcelReportOptions = {
        meta: {
          title: 'Alternating',
          tenantName: 'Academy',
          createdAt: new Date(),
        },
        sheets: [
          {
            name: 'Rows',
            columns: [{ key: 'id', header: 'ID' }],
            data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
          },
        ],
      };

      const result = await styledGenerator.generate(options);

      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

describe('Convenience Functions', () => {
  describe('generateEnrollmentExcel', () => {
    it('should generate enrollment report', async () => {
      const data = [
        {
          studentName: 'John Doe',
          studentEmail: 'john@example.com',
          courseName: 'React Advanced',
          enrolledAt: new Date('2024-01-15'),
          status: 'active',
          progress: 75,
          grade: 85,
          campusName: 'Madrid',
        },
        {
          studentName: 'Jane Smith',
          studentEmail: 'jane@example.com',
          courseName: 'TypeScript',
          enrolledAt: new Date('2024-02-01'),
          status: 'completed',
          progress: 100,
          grade: 92,
          campusName: 'Barcelona',
        },
      ];

      const result = await generateEnrollmentExcel(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/matr.*\.xlsx$/);
      expect(result.data).toBeInstanceOf(Buffer);
    });
  });

  describe('generateAttendanceExcel', () => {
    it('should generate attendance report', async () => {
      const data = [
        {
          studentName: 'John Doe',
          courseRunName: 'React - Enero 2024',
          sessionDate: new Date('2024-01-15'),
          checkInTime: new Date('2024-01-15T09:00:00'),
          checkOutTime: new Date('2024-01-15T13:00:00'),
          status: 'present',
          notes: '',
        },
        {
          studentName: 'Jane Smith',
          courseRunName: 'React - Enero 2024',
          sessionDate: new Date('2024-01-15'),
          status: 'absent',
          notes: 'Notified absence',
        },
      ];

      const result = await generateAttendanceExcel(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toContain('asistencia');
    });
  });

  describe('generateLeadExcel', () => {
    it('should generate lead report', async () => {
      const data = [
        {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '+34 600 123 456',
          source: 'Google Ads',
          campaign: 'Winter Campaign',
          status: 'qualified',
          score: 85,
          createdAt: new Date('2024-01-10'),
          assignedTo: 'Sales Rep 1',
        },
        {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          source: 'Organic',
          status: 'new',
          score: 40,
          createdAt: new Date('2024-01-12'),
        },
      ];

      const result = await generateLeadExcel(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toContain('leads');
    });
  });

  describe('generateRevenueExcel', () => {
    it('should generate revenue report', async () => {
      const data = [
        {
          period: '2024-01',
          courseName: 'React Advanced',
          enrollments: 25,
          revenue: 12500,
          currency: 'EUR',
          avgTicket: 500,
        },
        {
          period: '2024-01',
          courseName: 'TypeScript',
          enrollments: 15,
          revenue: 6000,
          currency: 'EUR',
          avgTicket: 400,
        },
      ];

      const result = await generateRevenueExcel(data, 'Test Academy');

      expect(result.success).toBe(true);
      expect(result.filename).toContain('ingresos');
    });
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

describe('Error Handling', () => {
  it('should handle invalid options gracefully', async () => {
    const generator = new ExcelReportGenerator();

    // This should not throw, but return error result
    const options: ExcelReportOptions = {
      meta: {
        title: 'Test',
        tenantName: 'Academy',
        createdAt: new Date(),
      },
      sheets: [],
    };

    const result = await generator.generate(options);

    // Empty sheets should still work (just create empty workbook)
    expect(result.success).toBe(true);
  });
});
